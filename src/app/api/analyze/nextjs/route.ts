import { NextRequest, NextResponse } from "next/server";
import type { NextJsAnalysis, NextJsInsight } from "@/lib/types";
import { DEVICE_PROFILES } from "@/lib/types";
import {
  launchBrowser,
  applyStealthScripts,
  stealthGoto,
  getStealthContextOptions,
} from "@/lib/browser-helpers";

export const maxDuration = 300;

interface PageAnalysisData {
  isNextJs: boolean;
  version: string;
  buildId: string;
  renderingMode: string;
  images: {
    total: number;
    nextImages: number;
    regularImages: { src: string; width: number; height: number; hasWidth: boolean; hasHeight: boolean; loading: string }[];
  };
  scripts: {
    total: number;
    nextScripts: number;
    inlineScripts: number;
    totalInlineSize: number;
    sources: string[];
  };
  hydration: {
    hasNextData: boolean;
    nextDataSize: number;
    hasReactRoot: boolean;
    serverRendered: boolean;
    totalDomNodes: number;
  };
  chunks: {
    total: number;
    names: string[];
    totalSize: number;
  };
  headers: Record<string, string>;
}

function extractPageData(): PageAnalysisData {
  const isNextJs = !!(
    document.getElementById("__next") ||
    document.getElementById("__NEXT_DATA__") ||
    document.querySelector('script[src*="/_next/"]') ||
    document.querySelector('link[href*="/_next/"]')
  );

  // Version detection
  let version = "";
  let buildId = "";
  const nextDataScript = document.getElementById("__NEXT_DATA__");
  if (nextDataScript) {
    try {
      const data = JSON.parse(nextDataScript.textContent || "{}");
      buildId = data.buildId || "";
      if (data.nextExport) version = "static-export";
    } catch { /* */ }
  }

  // Detect rendering mode via indicators
  let renderingMode = "unknown";
  if (nextDataScript) {
    try {
      const data = JSON.parse(nextDataScript.textContent || "{}");
      if (data.gssp) renderingMode = "dynamic"; // getServerSideProps
      else if (data.gsp) renderingMode = "static"; // getStaticProps
      else if (data.isFallback !== undefined) renderingMode = "isr";
      else renderingMode = "static";
    } catch { /* */ }
  }
  // App Router indicators
  if (!nextDataScript && document.getElementById("__next")) {
    renderingMode = "mixed"; // App Router uses streaming/RSC
  }

  // Image analysis
  const allImgs = document.querySelectorAll("img");
  let nextImages = 0;
  const regularImages: PageAnalysisData["images"]["regularImages"] = [];

  allImgs.forEach((img) => {
    const isNextImage = img.hasAttribute("data-nimg") ||
      img.closest("[data-nimg]") !== null ||
      (img.getAttribute("src") || "").includes("/_next/image");

    if (isNextImage) {
      nextImages++;
    } else {
      regularImages.push({
        src: (img.getAttribute("src") || "").slice(0, 200),
        width: img.naturalWidth,
        height: img.naturalHeight,
        hasWidth: img.hasAttribute("width"),
        hasHeight: img.hasAttribute("height"),
        loading: img.getAttribute("loading") || "eager",
      });
    }
  });

  // Script analysis
  const allScripts = document.querySelectorAll("script");
  let nextScripts = 0;
  let inlineScripts = 0;
  let totalInlineSize = 0;
  const sources: string[] = [];

  allScripts.forEach((script) => {
    const src = script.getAttribute("src");
    if (src) {
      sources.push(src);
      if (src.includes("/_next/")) nextScripts++;
    } else if (script.textContent) {
      inlineScripts++;
      totalInlineSize += script.textContent.length;
    }
  });

  // Hydration analysis
  const hasReactRoot = !!document.getElementById("__next");
  const serverRendered = !!document.querySelector("[data-reactroot]") || hasReactRoot;
  const totalDomNodes = document.querySelectorAll("*").length;

  let nextDataSize = 0;
  if (nextDataScript?.textContent) {
    nextDataSize = nextDataScript.textContent.length;
  }

  // Chunk analysis
  const nextChunks = document.querySelectorAll('script[src*="/_next/"]');
  const chunkNames: string[] = [];
  nextChunks.forEach((s) => {
    const src = s.getAttribute("src") || "";
    const name = src.split("/").pop() || src;
    chunkNames.push(name);
  });

  return {
    isNextJs,
    version,
    buildId,
    renderingMode,
    images: {
      total: allImgs.length,
      nextImages,
      regularImages,
    },
    scripts: {
      total: allScripts.length,
      nextScripts,
      inlineScripts,
      totalInlineSize,
      sources,
    },
    hydration: {
      hasNextData: !!nextDataScript,
      nextDataSize,
      hasReactRoot,
      serverRendered,
      totalDomNodes,
    },
    chunks: {
      total: nextChunks.length,
      names: chunkNames,
      totalSize: 0,
    },
    headers: {},
  };
}

function analyzeInsights(data: PageAnalysisData, responseHeaders: Record<string, string>): NextJsInsight[] {
  const insights: NextJsInsight[] = [];
  let id = 0;

  // ── Image Optimization ──────────────────────────────────────
  const unoptimizedImages = data.images.regularImages;
  if (unoptimizedImages.length > 0) {
    const largeUnoptimized = unoptimizedImages.filter(
      (img) => img.width > 100 && img.height > 100
    );

    if (largeUnoptimized.length > 0) {
      insights.push({
        id: `nextjs-${++id}`,
        category: "image-optimization",
        severity: "warning",
        title: `${largeUnoptimized.length} image(s) not using next/image`,
        description: `Found ${largeUnoptimized.length} images that could benefit from Next.js Image optimization (auto WebP/AVIF, responsive sizes, lazy loading).`,
        recommendation: "Replace <img> tags with next/image's <Image> component for automatic optimization.",
        savings: `~${Math.round(largeUnoptimized.length * 40)}% size reduction potential`,
      });
    }

    // Images without width/height
    const noSize = unoptimizedImages.filter((img) => !img.hasWidth || !img.hasHeight);
    if (noSize.length > 0) {
      insights.push({
        id: `nextjs-${++id}`,
        category: "image-optimization",
        severity: "warning",
        title: `${noSize.length} image(s) missing width/height`,
        description: "Images without explicit dimensions cause layout shifts (CLS).",
        recommendation: "Add width and height attributes, or use next/image which handles this automatically.",
      });
    }

    // Eagerly loaded images below fold
    const eagerBelow = unoptimizedImages.filter(
      (img) => img.loading !== "lazy" && unoptimizedImages.indexOf(img) > 2
    );
    if (eagerBelow.length > 0) {
      insights.push({
        id: `nextjs-${++id}`,
        category: "image-optimization",
        severity: "info",
        title: `${eagerBelow.length} image(s) could use lazy loading`,
        description: "Non-critical images loaded eagerly. Use loading='lazy' or next/image's priority prop.",
        recommendation: "Add loading='lazy' to images below the fold, or use next/image which lazy loads by default.",
      });
    }
  }

  if (data.images.nextImages > 0) {
    insights.push({
      id: `nextjs-${++id}`,
      category: "image-optimization",
      severity: "pass",
      title: `${data.images.nextImages} image(s) using next/image`,
      description: "These images benefit from automatic optimization, lazy loading, and responsive sizing.",
    });
  }

  // ── Hydration Analysis ──────────────────────────────────────
  if (data.hydration.nextDataSize > 50 * 1024) {
    insights.push({
      id: `nextjs-${++id}`,
      category: "hydration",
      severity: "critical",
      title: "Excessive __NEXT_DATA__ payload",
      description: `__NEXT_DATA__ is ${(data.hydration.nextDataSize / 1024).toFixed(1)}KB. This data is sent to the client for hydration and blocks interactivity.`,
      recommendation: "Reduce data fetched in getServerSideProps/getStaticProps. Only send data needed for the initial render. Consider using App Router's server components.",
      savings: `${(data.hydration.nextDataSize / 1024).toFixed(0)}KB potential reduction`,
    });
  } else if (data.hydration.nextDataSize > 20 * 1024) {
    insights.push({
      id: `nextjs-${++id}`,
      category: "hydration",
      severity: "warning",
      title: "Large __NEXT_DATA__ payload",
      description: `__NEXT_DATA__ is ${(data.hydration.nextDataSize / 1024).toFixed(1)}KB. Consider reducing the amount of data passed to the client.`,
      recommendation: "Only include data needed for initial render. Strip unnecessary fields. Use react-query or SWR for client-side data.",
    });
  } else if (data.hydration.hasNextData) {
    insights.push({
      id: `nextjs-${++id}`,
      category: "hydration",
      severity: "pass",
      title: "__NEXT_DATA__ payload is acceptable",
      description: `__NEXT_DATA__ is ${(data.hydration.nextDataSize / 1024).toFixed(1)}KB — within recommended limits.`,
    });
  }

  if (data.hydration.totalDomNodes > 1500) {
    insights.push({
      id: `nextjs-${++id}`,
      category: "hydration",
      severity: data.hydration.totalDomNodes > 3000 ? "critical" : "warning",
      title: `Excessive DOM size (${data.hydration.totalDomNodes} nodes)`,
      description: "Large DOM trees slow down hydration, layout calculations, and memory usage.",
      recommendation: "Virtualize long lists, use pagination, or lazy-load content below the fold.",
    });
  }

  // ── Rendering Mode ──────────────────────────────────────────
  if (data.renderingMode === "dynamic") {
    insights.push({
      id: `nextjs-${++id}`,
      category: "rendering",
      severity: "info",
      title: "Page uses Server-Side Rendering (SSR)",
      description: "This page is rendered on every request (getServerSideProps). Consider if static generation or ISR would be faster.",
      recommendation: "If content doesn't change per-request, switch to getStaticProps with revalidate for ISR.",
    });
  } else if (data.renderingMode === "static") {
    insights.push({
      id: `nextjs-${++id}`,
      category: "rendering",
      severity: "pass",
      title: "Page is statically generated",
      description: "This page is pre-rendered at build time — optimal for performance.",
    });
  } else if (data.renderingMode === "mixed") {
    insights.push({
      id: `nextjs-${++id}`,
      category: "rendering",
      severity: "pass",
      title: "App Router with React Server Components",
      description: "Page uses Next.js App Router. Server Components reduce client-side JavaScript.",
    });
  }

  // ── Bundle Size Checks ──────────────────────────────────────
  if (data.scripts.totalInlineSize > 50 * 1024) {
    insights.push({
      id: `nextjs-${++id}`,
      category: "bundle",
      severity: "warning",
      title: "Large inline scripts detected",
      description: `${(data.scripts.totalInlineSize / 1024).toFixed(1)}KB of inline JavaScript. This blocks rendering and can't be cached.`,
      recommendation: "Move inline scripts to external files. Use next/script with strategy='lazyOnload' for non-critical scripts.",
    });
  }

  if (data.chunks.total > 30) {
    insights.push({
      id: `nextjs-${++id}`,
      category: "bundle",
      severity: "info",
      title: `${data.chunks.total} JavaScript chunks loaded`,
      description: "High number of script chunks. While code splitting is good, too many chunks add HTTP overhead.",
      recommendation: "Review dynamic imports and ensure chunks are properly consolidated.",
    });
  }

  // ── Response Headers ────────────────────────────────────────
  const cacheControl = responseHeaders["cache-control"] || "";
  if (cacheControl.includes("no-store") || cacheControl.includes("no-cache")) {
    insights.push({
      id: `nextjs-${++id}`,
      category: "config",
      severity: "info",
      title: "Page not cached",
      description: `Cache-Control: ${cacheControl}. Consider adding caching headers for better performance.`,
      recommendation: "Use stale-while-revalidate or ISR for content that doesn't change frequently.",
    });
  }

  const xPoweredBy = responseHeaders["x-powered-by"] || "";
  if (xPoweredBy.includes("Next.js")) {
    insights.push({
      id: `nextjs-${++id}`,
      category: "config",
      severity: "info",
      title: "X-Powered-By header exposed",
      description: "The X-Powered-By: Next.js header reveals your tech stack.",
      recommendation: "Set poweredByHeader: false in next.config.js for security best practice.",
    });
  }

  return insights;
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { url } = body as { url?: string };

  if (!url || typeof url !== "string") {
    return NextResponse.json({ error: "URL is required" }, { status: 400 });
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url.startsWith("http") ? url : `https://${url}`);
  } catch {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }

  const targetUrl = parsedUrl.toString();
  const device = DEVICE_PROFILES.find((d) => d.type === "desktop") || DEVICE_PROFILES[0];

  let browser: Awaited<ReturnType<typeof launchBrowser>> | null = null;
  try {
    browser = await launchBrowser();
    const context = await browser.newContext(getStealthContextOptions(device));
    const page = await context.newPage();
    await applyStealthScripts(page);

    // Collect response headers
    const responseHeaders: Record<string, string> = {};
    page.on("response", (resp) => {
      if (resp.url() === targetUrl || resp.url() === targetUrl + "/") {
        const headers = resp.headers();
        for (const [key, value] of Object.entries(headers)) {
          responseHeaders[key.toLowerCase()] = value;
        }
      }
    });

    const nav = await stealthGoto(page, targetUrl, { waitUntil: "networkidle", timeout: 60000 });
    if (!nav.success) {
      await context.close();
      throw new Error(`Blocked by ${nav.challengeDetected}`);
    }
    await page.waitForTimeout(2000);

    // Extract page analysis data
    const analysisData = await page.evaluate(extractPageData);
    analysisData.headers = responseHeaders;

    await context.close();
    await browser.close();
    browser = null;

    const insights = analyzeInsights(analysisData, responseHeaders);

    // Compute score
    let score = 100;
    for (const insight of insights) {
      if (insight.severity === "critical") score -= 15;
      else if (insight.severity === "warning") score -= 8;
      else if (insight.severity === "info") score -= 2;
    }
    score = Math.max(0, Math.min(100, score));

    const result: NextJsAnalysis = {
      url: targetUrl,
      isNextJs: analysisData.isNextJs,
      version: analysisData.version || undefined,
      renderingMode: (analysisData.renderingMode as NextJsAnalysis["renderingMode"]) || undefined,
      insights,
      stats: {
        totalImages: analysisData.images.total,
        nextImages: analysisData.images.nextImages,
        unoptimizedImages: analysisData.images.regularImages.length,
        clientComponents: 0, // Would need deeper analysis
        serverIndicators: analysisData.renderingMode === "mixed" ? 1 : 0,
        hydrationSize: analysisData.hydration.nextDataSize,
        bundleChunks: analysisData.chunks.total,
      },
      score,
    };

    return NextResponse.json(result);
  } catch (err) {
    if (browser) {
      try { await browser.close(); } catch { /* ignore */ }
    }
    const message = err instanceof Error ? err.message : "Analysis failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
