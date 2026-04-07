import { NextRequest, NextResponse } from "next/server";
import type {
  ABComparisonResult,
  PerformanceData,
  DeviceProfile,
  ThrottleProfile,
} from "@/lib/types";
import { DEVICE_PROFILES } from "@/lib/types";
import {
  launchBrowser,
  applyStealthScripts,
  stealthGoto,
  getStealthContextOptions,
} from "@/lib/browser-helpers";

export const maxDuration = 300;

// Simplified performance scan for A/B comparison (no screenshots needed for speed)
async function quickPerfScan(
  browser: Awaited<ReturnType<typeof launchBrowser>>,
  device: DeviceProfile,
  targetUrl: string
): Promise<{ data: PerformanceData; screenshot: string }> {
  const context = await browser.newContext(getStealthContextOptions(device));
  const page = await context.newPage();
  await applyStealthScripts(page);

  await page.addInitScript(() => {
    const g = globalThis as unknown as Record<string, unknown>;
    g.__wg_lcp = 0;
    g.__wg_cls = 0;
    g.__wg_longTasks = [] as number[];

    try {
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          g.__wg_lcp = entry.startTime;
        }
      }).observe({ type: "largest-contentful-paint", buffered: true });
    } catch { /* */ }

    try {
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!(entry as unknown as { hadRecentInput: boolean }).hadRecentInput) {
            g.__wg_cls = (g.__wg_cls as number) + (entry as unknown as { value: number }).value;
          }
        }
      }).observe({ type: "layout-shift", buffered: true });
    } catch { /* */ }

    try {
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          (g.__wg_longTasks as number[]).push(entry.duration);
        }
      }).observe({ type: "longtask", buffered: true });
    } catch { /* */ }
  });

  const nav = await stealthGoto(page, targetUrl, { waitUntil: "networkidle", timeout: 60000 });
  if (!nav.success) {
    await context.close();
    throw new Error(`Blocked by ${nav.challengeDetected} on ${targetUrl}`);
  }
  await page.waitForTimeout(1500);

  const metrics = await page.evaluate(() => {
    const g = globalThis as unknown as Record<string, unknown>;
    const navEntry = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming;
    const paintEntries = performance.getEntriesByType("paint");
    const fcpEntry = paintEntries.find((e) => e.name === "first-contentful-paint");

    let lcp = (g.__wg_lcp as number) || 0;
    if (!lcp) {
      try {
        const lcpEntries = performance.getEntriesByType("largest-contentful-paint");
        if (lcpEntries.length > 0) lcp = lcpEntries[lcpEntries.length - 1].startTime;
      } catch { lcp = 0; }
    }

    const cls = (g.__wg_cls as number) || 0;
    const longTasks = (g.__wg_longTasks as number[]) || [];
    const tbt = longTasks.filter((d) => d > 50).reduce((sum, d) => sum + (d - 50), 0);

    const resources = performance.getEntriesByType("resource") as PerformanceResourceTiming[];
    const totalSize = resources.reduce((s, r) => s + (r.transferSize || 0), 0);

    return {
      ttfb: navEntry ? navEntry.responseStart - navEntry.requestStart : 0,
      fcp: fcpEntry ? fcpEntry.startTime : 0,
      lcp,
      tbt,
      cls,
      domContentLoaded: navEntry ? navEntry.domContentLoadedEventEnd - navEntry.fetchStart : 0,
      loadTime: navEntry ? navEntry.loadEventEnd - navEntry.fetchStart : 0,
      totalSize,
    };
  });

  const screenshotBuf = await page.screenshot({ type: "jpeg", quality: 60 });
  const screenshot = `data:image/jpeg;base64,${screenshotBuf.toString("base64")}`;

  await context.close();

  function rateMetric(name: string, value: number): "good" | "needs-improvement" | "poor" {
    const thresholds: Record<string, [number, number]> = {
      lcp: [2500, 4000], fcp: [1800, 3000], tbt: [200, 600], cls: [0.1, 0.25],
    };
    const [good, poor] = thresholds[name] || [0, 0];
    if (value <= good) return "good";
    if (value <= poor) return "needs-improvement";
    return "poor";
  }

  function formatMs(ms: number): string {
    return ms >= 1000 ? `${(ms / 1000).toFixed(1)}s` : `${Math.round(ms)}ms`;
  }

  // Score using same Lighthouse-style approach
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

  function scoreMetric(value: number, p10: number, median: number): number {
    if (value <= 0) return 1;
    const sigma = Math.log(median / p10) / 1.2816;
    if (sigma <= 0) return 1;
    const z = (Math.log(value) - Math.log(median)) / (sigma * Math.SQRT2);
    return Math.max(0, Math.min(1, 0.5 * erfc(z)));
  }

  const fcp = scoreMetric(metrics.fcp, 1800, 3000);
  const lcp = scoreMetric(metrics.lcp, 2500, 4000);
  const tbt = scoreMetric(metrics.tbt, 200, 600);
  const cls = scoreMetric(metrics.cls, 0.1, 0.25);
  const si = scoreMetric((metrics.fcp + metrics.lcp) / 2, 3387, 5800);
  const score = Math.round((fcp * 0.10 + si * 0.10 + lcp * 0.25 + tbt * 0.30 + cls * 0.25) * 100);

  const data: PerformanceData = {
    url: targetUrl,
    score,
    summary: `Score ${score}/100`,
    metrics: {
      ttfb: Math.round(metrics.ttfb),
      fcp: Math.round(metrics.fcp),
      lcp: Math.round(metrics.lcp),
      tbt: Math.round(metrics.tbt),
      cls: metrics.cls,
      domContentLoaded: Math.round(metrics.domContentLoaded),
      loadTime: Math.round(metrics.loadTime),
      totalSize: metrics.totalSize,
    },
    coreWebVitals: {
      lcp: { value: formatMs(metrics.lcp), numericValue: metrics.lcp, rating: rateMetric("lcp", metrics.lcp), description: "" },
      fcp: { value: formatMs(metrics.fcp), numericValue: metrics.fcp, rating: rateMetric("fcp", metrics.fcp), description: "" },
      tbt: { value: formatMs(metrics.tbt), numericValue: metrics.tbt, rating: rateMetric("tbt", metrics.tbt), description: "" },
      cls: { value: metrics.cls.toFixed(3), numericValue: metrics.cls, rating: rateMetric("cls", metrics.cls), description: "" },
    },
    opportunities: [],
    assets: {
      scripts: { count: 0, size: "0", sizeBytes: 0, files: [] },
      stylesheets: { count: 0, size: "0", sizeBytes: 0, files: [] },
      images: { count: 0, size: "0", sizeBytes: 0, files: [] },
      fonts: { count: 0, size: "0", sizeBytes: 0, files: [] },
      other: { count: 0, size: "0", sizeBytes: 0, files: [] },
    },
  };

  return { data, screenshot };
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { urlA, urlB, device: deviceType } = body as {
    urlA?: string;
    urlB?: string;
    device?: string;
    throttleProfile?: ThrottleProfile;
  };

  if (!urlA || !urlB || typeof urlA !== "string" || typeof urlB !== "string") {
    return NextResponse.json({ error: "Both urlA and urlB are required" }, { status: 400 });
  }

  let parsedA: URL, parsedB: URL;
  try {
    parsedA = new URL(urlA.startsWith("http") ? urlA : `https://${urlA}`);
    parsedB = new URL(urlB.startsWith("http") ? urlB : `https://${urlB}`);
  } catch {
    return NextResponse.json({ error: "Invalid URL(s)" }, { status: 400 });
  }

  const device = DEVICE_PROFILES.find((d) => d.type === (deviceType || "desktop")) || DEVICE_PROFILES[3];

  let browser: Awaited<ReturnType<typeof launchBrowser>> | null = null;
  try {
    browser = await launchBrowser();

    const [resultA, resultB] = await Promise.all([
      quickPerfScan(browser, device, parsedA.toString()),
      quickPerfScan(browser, device, parsedB.toString()),
    ]);

    await browser.close();
    browser = null;

    const a = resultA.data;
    const b = resultB.data;

    const scoreDiff = b.score - a.score;
    const lcpDiff = b.metrics.lcp - a.metrics.lcp;
    const fcpDiff = b.metrics.fcp - a.metrics.fcp;
    const clsDiff = b.metrics.cls - a.metrics.cls;
    const tbtDiff = b.metrics.tbt - a.metrics.tbt;
    const totalSizeDiff = b.metrics.totalSize - a.metrics.totalSize;

    const winner = scoreDiff > 5 ? "B" as const : scoreDiff < -5 ? "A" as const : "tie" as const;

    const improvementAreas: ABComparisonResult["comparison"]["improvementAreas"] = [];

    function addArea(metric: string, aVal: number, bVal: number, lowerIsBetter: boolean) {
      if (aVal === 0 && bVal === 0) return;
      const ref = Math.max(Math.abs(aVal), 1);
      const pctChange = ((bVal - aVal) / ref) * 100;
      const improved = lowerIsBetter ? bVal < aVal : bVal > aVal;
      improvementAreas.push({
        metric,
        percentChange: Math.round(pctChange * 10) / 10,
        improved,
      });
    }

    addArea("Score", a.score, b.score, false);
    addArea("LCP", a.metrics.lcp, b.metrics.lcp, true);
    addArea("FCP", a.metrics.fcp, b.metrics.fcp, true);
    addArea("CLS", a.metrics.cls, b.metrics.cls, true);
    addArea("TBT", a.metrics.tbt, b.metrics.tbt, true);
    addArea("Total Size", a.metrics.totalSize, b.metrics.totalSize, true);

    const result: ABComparisonResult = {
      urlA: { url: parsedA.toString(), performance: a, screenshot: resultA.screenshot },
      urlB: { url: parsedB.toString(), performance: b, screenshot: resultB.screenshot },
      comparison: {
        scoreDiff,
        lcpDiff,
        fcpDiff,
        clsDiff,
        tbtDiff,
        totalSizeDiff,
        winner,
        improvementAreas,
      },
    };

    return NextResponse.json(result);
  } catch (err) {
    if (browser) {
      try { await browser.close(); } catch { /* ignore */ }
    }
    const message = err instanceof Error ? err.message : "Comparison failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
