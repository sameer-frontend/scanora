import { NextRequest, NextResponse } from "next/server";
import type {
  PerformanceData,
  PerformanceOpportunity,
  DevicePerformanceResult,
  DeviceProfile,
  AssetFile,
  MultiRunStats,
  CWVTimeline,
  TimelineEvent,
  ThrottleProfile,
} from "@/lib/types";

export const maxDuration = 300;
import { DEVICE_PROFILES } from "@/lib/types";
import {
  launchBrowser,
  applyStealthScripts,
  stealthGoto,
  getStealthContextOptions,
} from "@/lib/browser-helpers";

interface ResourceEntry {
  name: string;
  transferSize: number;
  initiatorType: string;
}

interface PageMetrics {
  ttfb: number;
  fcp: number;
  lcp: number;
  tbt: number;
  cls: number;
  domContentLoaded: number;
  loadTime: number;
  resources: ResourceEntry[];
  // Enhanced timeline data
  inp: number;
  layoutShifts: { time: number; value: number; element?: string }[];
  longTasks: { start: number; duration: number }[];
}

// Throttle configs per device type — models real-world network conditions
const THROTTLE_PROFILES: Record<
  string,
  { downloadThroughput: number; uploadThroughput: number; latency: number; cpuRate: number }
> = {
  // Lighthouse mobile: slow 4G, 4× CPU slowdown
  mobile: {
    downloadThroughput: (1.6 * 1024 * 1024) / 8,
    uploadThroughput: (750 * 1024) / 8,
    latency: 150,
    cpuRate: 4,
  },
  // Moderate throttle for tablet
  tablet: {
    downloadThroughput: (4 * 1024 * 1024) / 8,
    uploadThroughput: (2 * 1024 * 1024) / 8,
    latency: 100,
    cpuRate: 2,
  },
  // Lighthouse desktop: cable-like connection, no CPU slowdown
  laptop: {
    downloadThroughput: (10 * 1024 * 1024) / 8,
    uploadThroughput: (5 * 1024 * 1024) / 8,
    latency: 40,
    cpuRate: 1,
  },
  desktop: {
    downloadThroughput: (10 * 1024 * 1024) / 8,
    uploadThroughput: (5 * 1024 * 1024) / 8,
    latency: 40,
    cpuRate: 1,
  },
};

// Custom throttle profiles for user-selected device categories
const CUSTOM_THROTTLE_PROFILES: Record<ThrottleProfile, typeof THROTTLE_PROFILES[string]> = {
  "low-end-android": {
    downloadThroughput: (400 * 1024) / 8,    // Slow 3G ~400kbps
    uploadThroughput: (200 * 1024) / 8,
    latency: 400,
    cpuRate: 6,
  },
  "mid-range-android": {
    downloadThroughput: (1.6 * 1024 * 1024) / 8,  // Slow 4G
    uploadThroughput: (750 * 1024) / 8,
    latency: 150,
    cpuRate: 4,
  },
  "iphone": {
    downloadThroughput: (4 * 1024 * 1024) / 8,     // 4G LTE
    uploadThroughput: (3 * 1024 * 1024) / 8,
    latency: 70,
    cpuRate: 2,
  },
  "desktop-high": {
    downloadThroughput: (10 * 1024 * 1024) / 8,
    uploadThroughput: (5 * 1024 * 1024) / 8,
    latency: 40,
    cpuRate: 1,
  },
  "custom": {
    downloadThroughput: (10 * 1024 * 1024) / 8,
    uploadThroughput: (5 * 1024 * 1024) / 8,
    latency: 40,
    cpuRate: 1,
  },
};

function getThrottleForRequest(
  deviceType: string,
  customProfile?: ThrottleProfile
): typeof THROTTLE_PROFILES[string] {
  if (customProfile && customProfile !== "custom") {
    return CUSTOM_THROTTLE_PROFILES[customProfile];
  }
  return THROTTLE_PROFILES[deviceType] ?? THROTTLE_PROFILES.desktop;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function rateMetric(
  name: "lcp" | "fcp" | "tbt" | "cls",
  value: number
): "good" | "needs-improvement" | "poor" {
  const thresholds: Record<string, [number, number]> = {
    lcp: [2500, 4000],
    fcp: [1800, 3000],
    tbt: [200, 600],
    cls: [0.1, 0.25],
  };
  const [good, poor] = thresholds[name];
  if (value <= good) return "good";
  if (value <= poor) return "needs-improvement";
  return "poor";
}

// ── Lighthouse-style scoring using log-normal CDF ──────────────
// Each metric is scored 0-1, then weighted. This matches Lighthouse v10.

function erfc(x: number): number {
  const t = 1 / (1 + 0.5 * Math.abs(x));
  const tau = t * Math.exp(
    -x * x - 1.26551223 +
    t * (1.00002368 + t * (0.37409196 + t * (0.09678418 +
    t * (-0.18628806 + t * (0.27886807 + t * (-1.13520398 +
    t * (1.48851587 + t * (-0.82215223 + t * 0.17087277))))))))
  );
  return x >= 0 ? tau : 2 - tau;
}

/** Score a single metric using log-normal CDF (same curve shape as Lighthouse).
 *  p10 = value where score ≈ 0.90, median = value where score ≈ 0.50 */
function scoreMetric(value: number, p10: number, median: number): number {
  if (value <= 0) return 1;
  const sigma = Math.log(median / p10) / 1.2816;
  if (sigma <= 0) return 1;
  const z = (Math.log(value) - Math.log(median)) / (sigma * Math.SQRT2);
  return Math.max(0, Math.min(1, 0.5 * erfc(z)));
}

// Lighthouse v10 weights: FCP 10%, SI 10%, LCP 25%, TBT 30%, CLS 25%
// We approximate SI ≈ (FCP+LCP)/2 and redistribute its weight.
function computeScore(metrics: PageMetrics): number {
  const fcp = scoreMetric(metrics.fcp, 1800, 3000);
  const lcp = scoreMetric(metrics.lcp, 2500, 4000);
  const tbt = scoreMetric(metrics.tbt, 200, 600);
  const cls = scoreMetric(metrics.cls, 0.1, 0.25);
  const si = scoreMetric((metrics.fcp + metrics.lcp) / 2, 3387, 5800);

  const weighted = fcp * 0.10 + si * 0.10 + lcp * 0.25 + tbt * 0.30 + cls * 0.25;
  return Math.round(weighted * 100);
}

/** Generate deterministic optimization opportunities based on collected metrics */
function generateOpportunities(
  metrics: PageMetrics,
  categories: Record<string, { count: number; sizeBytes: number; files: AssetFile[] }>,
  totalSize: number,
  coreWebVitals: Record<string, { rating: string; numericValue: number }>,
): PerformanceOpportunity[] {
  const opps: PerformanceOpportunity[] = [];

  // Large images (>200KB each)
  const largeImages = categories.images.files.filter((f) => f.sizeBytes > 200 * 1024);
  if (largeImages.length > 0) {
    const totalImgSavings = largeImages.reduce((s, f) => s + f.sizeBytes * 0.6, 0);
    opps.push({
      title: "Optimize images",
      savings: formatBytes(totalImgSavings),
      impact: totalImgSavings > 500 * 1024 ? "high" : "medium",
      description: `${largeImages.length} image${largeImages.length !== 1 ? "s" : ""} over 200 KB. Use modern formats (WebP/AVIF), compress, and serve responsive sizes.`,
    });
  }

  // Large JavaScript bundles (>100KB each)
  const largeScripts = categories.scripts.files.filter((f) => f.sizeBytes > 100 * 1024);
  if (largeScripts.length > 0) {
    const totalJsSavings = largeScripts.reduce((s, f) => s + f.sizeBytes * 0.3, 0);
    opps.push({
      title: "Reduce JavaScript bundle size",
      savings: formatBytes(totalJsSavings),
      impact: totalJsSavings > 300 * 1024 ? "high" : "medium",
      description: `${largeScripts.length} script${largeScripts.length !== 1 ? "s" : ""} over 100 KB. Consider code splitting, tree shaking, and lazy loading.`,
    });
  }

  // Slow LCP
  if (coreWebVitals.lcp.rating !== "good") {
    opps.push({
      title: "Improve Largest Contentful Paint",
      savings: `${Math.round(metrics.lcp - 2500)}ms`,
      impact: "high",
      description: "LCP exceeds 2.5s threshold. Preload LCP resources, optimize server response time, and avoid render-blocking resources.",
    });
  }

  // High TBT
  if (coreWebVitals.tbt.rating !== "good") {
    opps.push({
      title: "Reduce Total Blocking Time",
      savings: `${Math.round(metrics.tbt - 200)}ms`,
      impact: "high",
      description: "TBT exceeds 200ms threshold. Break up long tasks, defer non-critical JavaScript, and reduce main-thread work.",
    });
  }

  // High CLS
  if (coreWebVitals.cls.rating !== "good") {
    opps.push({
      title: "Reduce layout shifts",
      savings: (metrics.cls - 0.1).toFixed(3),
      impact: metrics.cls > 0.25 ? "high" : "medium",
      description: "CLS exceeds 0.1 threshold. Set explicit width/height on images and embeds, avoid inserting content above existing content.",
    });
  }

  // Slow TTFB
  if (metrics.ttfb > 800) {
    opps.push({
      title: "Reduce server response time",
      savings: `${Math.round(metrics.ttfb - 800)}ms`,
      impact: metrics.ttfb > 1800 ? "high" : "medium",
      description: "TTFB exceeds 800ms. Consider using a CDN, optimizing server-side code, or implementing caching.",
    });
  }

  // Too many fonts
  if (categories.fonts.count > 4) {
    opps.push({
      title: "Reduce web font usage",
      savings: formatBytes(categories.fonts.sizeBytes * 0.3),
      impact: "medium",
      description: `${categories.fonts.count} font files loaded. Limit to 2-3 font families and use font-display: swap.`,
    });
  }

  // Large total page size (>3MB)
  if (totalSize > 3 * 1024 * 1024) {
    opps.push({
      title: "Reduce total page weight",
      savings: formatBytes(totalSize - 3 * 1024 * 1024),
      impact: "high",
      description: `Total page size is ${formatBytes(totalSize)}. Enable text compression (gzip/brotli), minify resources, and remove unused code.`,
    });
  }

  // Slow FCP
  if (coreWebVitals.fcp.rating !== "good") {
    opps.push({
      title: "Improve First Contentful Paint",
      savings: `${Math.round(metrics.fcp - 1800)}ms`,
      impact: "medium",
      description: "FCP exceeds 1.8s threshold. Eliminate render-blocking resources, inline critical CSS, and preconnect to required origins.",
    });
  }

  return opps;
}

function buildPerfData(targetUrl: string, metrics: PageMetrics): PerformanceData {
  const categories: Record<string, { count: number; sizeBytes: number; files: AssetFile[] }> = {
    scripts: { count: 0, sizeBytes: 0, files: [] },
    stylesheets: { count: 0, sizeBytes: 0, files: [] },
    images: { count: 0, sizeBytes: 0, files: [] },
    fonts: { count: 0, sizeBytes: 0, files: [] },
    other: { count: 0, sizeBytes: 0, files: [] },
  };

  function fileNameFromUrl(u: string): string {
    try {
      const pathname = new URL(u).pathname;
      return pathname.split("/").pop() || pathname || u;
    } catch {
      return u.split("/").pop() || u;
    }
  }

  for (const r of metrics.resources) {
    const type = r.initiatorType;
    let cat: string;
    if (type === "script") {
      cat = "scripts";
    } else if (type === "link" || type === "css") {
      cat = /\.(woff2?|ttf|otf|eot)(\?|$)/i.test(r.name) ? "fonts" : "stylesheets";
    } else if (
      type === "img" ||
      type === "image" ||
      /\.(png|jpe?g|gif|svg|webp|avif|ico)(\?|$)/i.test(r.name)
    ) {
      cat = "images";
    } else if (/\.(woff2?|ttf|otf|eot)(\?|$)/i.test(r.name)) {
      cat = "fonts";
    } else {
      cat = "other";
    }
    categories[cat].count++;
    categories[cat].sizeBytes += r.transferSize;
    categories[cat].files.push({
      name: fileNameFromUrl(r.name),
      url: r.name,
      size: formatBytes(r.transferSize),
      sizeBytes: r.transferSize,
    });
  }

  // Sort files by size descending within each category
  for (const cat of Object.values(categories)) {
    cat.files.sort((a, b) => b.sizeBytes - a.sizeBytes);
  }

  const totalSize = Object.values(categories).reduce((s, c) => s + c.sizeBytes, 0);
  const score = computeScore(metrics);

  const coreWebVitals = {
    lcp: {
      value: metrics.lcp >= 1000 ? `${(metrics.lcp / 1000).toFixed(1)}s` : `${Math.round(metrics.lcp)}ms`,
      numericValue: metrics.lcp,
      rating: rateMetric("lcp", metrics.lcp),
      description: "Time until the largest content element is visible",
    },
    fcp: {
      value: metrics.fcp >= 1000 ? `${(metrics.fcp / 1000).toFixed(1)}s` : `${Math.round(metrics.fcp)}ms`,
      numericValue: metrics.fcp,
      rating: rateMetric("fcp", metrics.fcp),
      description: "Time until first content is painted on screen",
    },
    tbt: {
      value: metrics.tbt >= 1000 ? `${(metrics.tbt / 1000).toFixed(1)}s` : `${Math.round(metrics.tbt)}ms`,
      numericValue: metrics.tbt,
      rating: rateMetric("tbt", metrics.tbt),
      description: "Total time the main thread was blocked by long tasks",
    },
    cls: {
      value: metrics.cls.toFixed(3),
      numericValue: metrics.cls,
      rating: rateMetric("cls", metrics.cls),
      description: "Visual stability \u2014 measures unexpected layout shifts",
    },
  };

  return {
    url: targetUrl,
    score,
    summary: `Score ${score}/100. LCP: ${coreWebVitals.lcp.value}, FCP: ${coreWebVitals.fcp.value}, TBT: ${coreWebVitals.tbt.value}, CLS: ${coreWebVitals.cls.value}. Size: ${formatBytes(totalSize)}.`,
    metrics: {
      ttfb: Math.round(metrics.ttfb),
      fcp: Math.round(metrics.fcp),
      lcp: Math.round(metrics.lcp),
      tbt: Math.round(metrics.tbt),
      cls: metrics.cls,
      domContentLoaded: Math.round(metrics.domContentLoaded),
      loadTime: Math.round(metrics.loadTime),
      totalSize,
    },
    coreWebVitals,
    opportunities: generateOpportunities(metrics, categories, totalSize, coreWebVitals),
    assets: {
      scripts: { count: categories.scripts.count, size: formatBytes(categories.scripts.sizeBytes), sizeBytes: categories.scripts.sizeBytes, files: categories.scripts.files },
      stylesheets: { count: categories.stylesheets.count, size: formatBytes(categories.stylesheets.sizeBytes), sizeBytes: categories.stylesheets.sizeBytes, files: categories.stylesheets.files },
      images: { count: categories.images.count, size: formatBytes(categories.images.sizeBytes), sizeBytes: categories.images.sizeBytes, files: categories.images.files },
      fonts: { count: categories.fonts.count, size: formatBytes(categories.fonts.sizeBytes), sizeBytes: categories.fonts.sizeBytes, files: categories.fonts.files },
      other: { count: categories.other.count, size: formatBytes(categories.other.sizeBytes), sizeBytes: categories.other.sizeBytes, files: categories.other.files },
    },
  };
}

async function scanDevice(
  browser: Awaited<ReturnType<typeof launchBrowser>>,
  device: DeviceProfile,
  targetUrl: string,
  customThrottle?: ThrottleProfile
): Promise<DevicePerformanceResult> {
  const ctxOpts = getStealthContextOptions(device);
  const context = await browser.newContext(ctxOpts);
  const page = await context.newPage();
  await applyStealthScripts(page);

  // ── Inject PerformanceObservers BEFORE page load ────────────
  await page.addInitScript(() => {
    const g = globalThis as unknown as Record<string, unknown>;
    g.__wg_lcp = 0;
    g.__wg_cls = 0;
    g.__wg_longTasks = [] as { start: number; duration: number }[];
    g.__wg_layoutShifts = [] as { time: number; value: number; element?: string }[];
    g.__wg_inp = 0;
    g.__wg_interactions = [] as number[];

    try {
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          g.__wg_lcp = entry.startTime;
        }
      }).observe({ type: "largest-contentful-paint", buffered: true });
    } catch { /* unsupported */ }

    try {
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const lsEntry = entry as unknown as { hadRecentInput: boolean; value: number; sources?: { node?: Element }[] };
          if (!lsEntry.hadRecentInput) {
            g.__wg_cls = (g.__wg_cls as number) + lsEntry.value;
            const shift: { time: number; value: number; element?: string } = {
              time: entry.startTime,
              value: lsEntry.value,
            };
            if (lsEntry.sources?.[0]?.node) {
              try { shift.element = (lsEntry.sources[0].node as Element).tagName; } catch { /* */ }
            }
            (g.__wg_layoutShifts as typeof shift[]).push(shift);
          }
        }
      }).observe({ type: "layout-shift", buffered: true });
    } catch { /* unsupported */ }

    try {
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          (g.__wg_longTasks as { start: number; duration: number }[]).push({
            start: entry.startTime,
            duration: entry.duration,
          });
        }
      }).observe({ type: "longtask", buffered: true });
    } catch { /* unsupported */ }

    // INP tracking via event timing API
    try {
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const dur = (entry as unknown as { duration: number }).duration;
          if (dur > 0) {
            (g.__wg_interactions as number[]).push(dur);
            // INP is the worst interaction, ignoring the very worst if >50 interactions
            const sorted = [...(g.__wg_interactions as number[])].sort((a, b) => b - a);
            const idx = sorted.length > 50 ? 1 : 0;
            g.__wg_inp = sorted[idx] || 0;
          }
        }
      }).observe({ type: "event", buffered: true });
    } catch { /* unsupported */ }
  });

  // ── Apply network & CPU throttling via CDP ──────────────────
  const throttle = getThrottleForRequest(device.type, customThrottle);
  const cdp = await context.newCDPSession(page);

  // Track actual transfer sizes via CDP (more reliable than Performance API
  // which returns 0 for cross-origin resources without Timing-Allow-Origin)
  const cdpSizes = new Map<string, number>();
  const cdpUrls = new Map<string, string>();
  const cdpTypes = new Map<string, string>();
  cdp.on("Network.responseReceived", (event: Record<string, unknown>) => {
    const resp = event.response as Record<string, unknown>;
    const reqId = event.requestId as string;
    cdpUrls.set(reqId, resp.url as string);
    cdpTypes.set(reqId, (event.type as string || "").toLowerCase());
  });
  cdp.on("Network.loadingFinished", (event: Record<string, unknown>) => {
    const reqId = event.requestId as string;
    cdpSizes.set(reqId, (event.encodedDataLength as number) || 0);
  });
  await cdp.send("Network.enable");

  await cdp.send("Network.emulateNetworkConditions", {
    offline: false,
    downloadThroughput: throttle.downloadThroughput,
    uploadThroughput: throttle.uploadThroughput,
    latency: throttle.latency,
  });
  if (throttle.cpuRate > 1) {
    await cdp.send("Emulation.setCPUThrottlingRate", { rate: throttle.cpuRate });
  }

  // ── Navigate ────────────────────────────────────────────────
  const nav = await stealthGoto(page, targetUrl, { waitUntil: "networkidle", timeout: 60000 });
  if (!nav.success) {
    await context.close();
    throw new Error(`Blocked by ${nav.challengeDetected} on ${targetUrl}. The site requires interactive CAPTCHA.`);
  }
  // Let LCP / CLS / Long Tasks settle after load
  await page.waitForTimeout(1500);

  // ── Collect metrics ─────────────────────────────────────────
  const metrics: PageMetrics = await page.evaluate(() => {
    const g = globalThis as unknown as Record<string, unknown>;
    const navEntry = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming;
    const paintEntries = performance.getEntriesByType("paint");
    const fcpEntry = paintEntries.find((e) => e.name === "first-contentful-paint");

    // Prefer observer-measured LCP, fall back to Performance API
    let lcp = (g.__wg_lcp as number) || 0;
    if (!lcp) {
      try {
        const lcpEntries = performance.getEntriesByType("largest-contentful-paint");
        if (lcpEntries.length > 0) lcp = lcpEntries[lcpEntries.length - 1].startTime;
      } catch { lcp = 0; }
    }

    // CLS from observer
    const cls = (g.__wg_cls as number) || 0;

    // TBT = sum of (duration - 50ms) for all long tasks > 50ms
    const longTasksRaw = (g.__wg_longTasks as { start: number; duration: number }[]) || [];
    const tbt = longTasksRaw
      .filter((t) => t.duration > 50)
      .reduce((sum, t) => sum + (t.duration - 50), 0);

    // INP from observer
    const inp = (g.__wg_inp as number) || 0;

    // Layout shifts with details
    const layoutShifts = (g.__wg_layoutShifts as { time: number; value: number; element?: string }[]) || [];

    const resourceEntries = performance.getEntriesByType("resource") as PerformanceResourceTiming[];
    return {
      ttfb: navEntry ? navEntry.responseStart - navEntry.requestStart : 0,
      fcp: fcpEntry ? fcpEntry.startTime : 0,
      lcp,
      tbt,
      cls,
      domContentLoaded: navEntry ? navEntry.domContentLoadedEventEnd - navEntry.fetchStart : 0,
      loadTime: navEntry ? navEntry.loadEventEnd - navEntry.fetchStart : 0,
      resources: resourceEntries.map((r) => ({
        name: r.name,
        transferSize: r.transferSize || r.encodedBodySize || r.decodedBodySize || 0,
        initiatorType: r.initiatorType,
      })),
      inp,
      layoutShifts,
      longTasks: longTasksRaw,
    };
  });

  // Supplement resource sizes with CDP data (handles cross-origin resources
  // where Performance API reports transferSize: 0)
  const cdpResourceMap = new Map<string, number>();
  for (const [reqId, size] of cdpSizes) {
    const url = cdpUrls.get(reqId);
    if (url && size > 0) cdpResourceMap.set(url, size);
  }
  for (const r of metrics.resources) {
    if (r.transferSize === 0) {
      const cdpSize = cdpResourceMap.get(r.name);
      if (cdpSize) r.transferSize = cdpSize;
    }
  }
  // Add resources tracked by CDP but missing from Performance API
  const perfUrls = new Set(metrics.resources.map((r) => r.name));
  for (const [reqId, url] of cdpUrls) {
    if (url && !perfUrls.has(url) && !url.startsWith("data:")) {
      const size = cdpSizes.get(reqId) ?? 0;
      const type = cdpTypes.get(reqId) ?? "";
      const initiatorType =
        type === "script" ? "script" :
        type === "stylesheet" ? "css" :
        type === "image" ? "img" :
        type === "font" ? "link" :
        "other";
      metrics.resources.push({ name: url, transferSize: size, initiatorType });
    }
  }

  // ── Reset throttling before screenshot ──────────────────────
  await cdp.send("Network.emulateNetworkConditions", {
    offline: false,
    downloadThroughput: -1,
    uploadThroughput: -1,
    latency: 0,
  });
  if (throttle.cpuRate > 1) {
    await cdp.send("Emulation.setCPUThrottlingRate", { rate: 1 });
  }

  const screenshotBuf = await page.screenshot({ fullPage: true, type: "jpeg", quality: 70 });
  const screenshot = `data:image/jpeg;base64,${screenshotBuf.toString("base64")}`;

  await context.close();

  return { device, screenshot, data: buildPerfData(targetUrl, metrics) };
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { url, devices, throttleProfile: reqThrottle, runs: reqRuns } = body as {
    url?: unknown;
    devices?: unknown;
    throttleProfile?: ThrottleProfile;
    runs?: number;
  };

  if (!url || typeof url !== "string") {
    return NextResponse.json({ error: "URL is required" }, { status: 400 });
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url.startsWith("http") ? url : `https://${url}`);
  } catch {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }

  const selectedDevices: DeviceProfile[] =
    Array.isArray(devices) && devices.length > 0
      ? DEVICE_PROFILES.filter((d) => (devices as string[]).includes(d.type))
      : DEVICE_PROFILES;

  if (selectedDevices.length === 0) {
    return NextResponse.json({ error: "No valid devices specified" }, { status: 400 });
  }

  const numRuns = Math.min(Math.max(1, reqRuns || 1), 5);

  let browser: Awaited<ReturnType<typeof launchBrowser>> | null = null;
  try {
    browser = await launchBrowser();
    const targetUrl = parsedUrl.toString();

    if (numRuns > 1) {
      // Multi-run mode: run multiple times and compute stats
      const allRunResults: DevicePerformanceResult[][] = [];

      for (let run = 0; run < numRuns; run++) {
        const runResults = await Promise.all(
          selectedDevices.map((device) => scanDevice(browser!, device, targetUrl, reqThrottle))
        );
        allRunResults.push(runResults);
      }

      // Use the last run's results as the primary display data
      const primaryResults = allRunResults[allRunResults.length - 1];

      // Compute multi-run stats (for the first device)
      const scores = allRunResults.map((run) => run[0].data.score);
      const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
      const variance = scores.reduce((sum, s) => sum + Math.pow(s - avg, 2), 0) / scores.length;

      const multiRunStats: MultiRunStats = {
        runs: numRuns,
        scores,
        average: Math.round(avg),
        best: Math.max(...scores),
        worst: Math.min(...scores),
        variance: Math.round(variance * 100) / 100,
        standardDeviation: Math.round(Math.sqrt(variance) * 100) / 100,
        metricAverages: {
          lcp: Math.round(allRunResults.reduce((s, r) => s + r[0].data.metrics.lcp, 0) / numRuns),
          fcp: Math.round(allRunResults.reduce((s, r) => s + r[0].data.metrics.fcp, 0) / numRuns),
          tbt: Math.round(allRunResults.reduce((s, r) => s + r[0].data.metrics.tbt, 0) / numRuns),
          cls: Math.round((allRunResults.reduce((s, r) => s + r[0].data.metrics.cls, 0) / numRuns) * 1000) / 1000,
          ttfb: Math.round(allRunResults.reduce((s, r) => s + r[0].data.metrics.ttfb, 0) / numRuns),
        },
      };

      // Build CWV timeline from the latest run
      const latestData = primaryResults[0].data;
      const cwvTimeline: CWVTimeline = buildCwvTimeline(latestData);

      await browser.close();
      browser = null;

      return NextResponse.json({
        results: primaryResults,
        multiRunStats,
        cwvTimeline,
      }, {
        headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
      });
    }

    // Single run mode
    const results = await Promise.all(
      selectedDevices.map((device) => scanDevice(browser!, device, targetUrl, reqThrottle))
    );

    // Build CWV timeline
    const cwvTimeline: CWVTimeline = buildCwvTimeline(results[0].data);

    await browser.close();
    browser = null;

    return NextResponse.json({
      results,
      cwvTimeline,
    }, {
      headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
    });
  } catch (err) {
    if (browser) {
      try { await browser.close(); } catch { /* ignore */ }
    }
    const message = err instanceof Error ? err.message : "Scan failed";
    if (message.includes("browserType.launch")) {
      return NextResponse.json(
        { error: "Chromium not installed. Run: npx playwright install chromium" },
        { status: 500 }
      );
    }
    return NextResponse.json({ error: `Scan failed: ${message}` }, { status: 500 });
  }
}

function rateInp(value: number): "good" | "needs-improvement" | "poor" {
  if (value <= 200) return "good";
  if (value <= 500) return "needs-improvement";
  return "poor";
}

function buildCwvTimeline(data: PerformanceData): CWVTimeline {
  const events: TimelineEvent[] = [];

  if (data.metrics.ttfb > 0) {
    events.push({
      label: "TTFB",
      time: data.metrics.ttfb,
      type: "ttfb",
      value: `${data.metrics.ttfb}ms`,
    });
  }
  if (data.metrics.fcp > 0) {
    events.push({
      label: "First Contentful Paint",
      time: data.metrics.fcp,
      type: "fcp",
      rating: data.coreWebVitals.fcp.rating,
      value: data.coreWebVitals.fcp.value,
    });
  }
  if (data.metrics.lcp > 0) {
    events.push({
      label: "Largest Contentful Paint",
      time: data.metrics.lcp,
      type: "lcp",
      rating: data.coreWebVitals.lcp.rating,
      value: data.coreWebVitals.lcp.value,
    });
  }
  if (data.metrics.domContentLoaded > 0) {
    events.push({
      label: "DOM Content Loaded",
      time: data.metrics.domContentLoaded,
      type: "dom",
      value: `${data.metrics.domContentLoaded}ms`,
    });
  }
  if (data.metrics.loadTime > 0) {
    events.push({
      label: "Page Load",
      time: data.metrics.loadTime,
      type: "load",
      value: `${data.metrics.loadTime}ms`,
    });
  }

  events.sort((a, b) => a.time - b.time);

  const totalDuration = Math.max(data.metrics.loadTime, data.metrics.lcp, data.metrics.fcp) + 500;

  // INP metric (using 0 if not measured — lab environment may not trigger interactions)
  const inpValue = 0; // INP is measured from actual user interactions, lab data won't have this
  const inp = {
    value: inpValue > 0 ? `${inpValue}ms` : "N/A (lab)",
    numericValue: inpValue,
    rating: rateInp(inpValue),
    description: "Responsiveness to user interactions (requires real interactions)",
  };

  return {
    events,
    totalDuration,
    layoutShifts: [],
    longTasks: [],
    inp,
  };
}
