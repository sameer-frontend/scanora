import { NextRequest, NextResponse } from "next/server";
import type { BundleAnalysis, BundleChunk, DetectedTechnology, TechCategory } from "@/lib/types";
import {
  launchBrowser,
  applyStealthScripts,
  stealthGoto,
  getStealthContextOptions,
} from "@/lib/browser-helpers";
import { DEVICE_PROFILES } from "@/lib/types";

export const maxDuration = 300;

function categorizeResource(url: string): BundleChunk["type"] {
  if (/\.js(\?|$)/i.test(url)) return "js";
  if (/\.css(\?|$)/i.test(url)) return "css";
  if (/\.(png|jpe?g|gif|svg|webp|avif|ico)(\?|$)/i.test(url)) return "image";
  if (/\.(woff2?|ttf|otf|eot)(\?|$)/i.test(url)) return "font";
  return "other";
}

function getChunkName(url: string): string {
  try {
    const pathname = new URL(url).pathname;
    return pathname.split("/").pop() || pathname || url;
  } catch {
    return url.split("/").pop() || url;
  }
}

function isFirstLoadChunk(name: string): boolean {
  // Common Next.js patterns for framework/first-load chunks
  return /^(framework|main|webpack|polyfills|_app|layout|page|pages\/_app)/i.test(name) ||
    name.includes("chunk-") ||
    name.includes("commons");
}

function detectRoute(url: string): string | undefined {
  try {
    const pathname = new URL(url).pathname;
    // Common Next.js chunk naming: /chunks/pages/about-xxx.js
    const match = pathname.match(/pages\/([^.]+)/);
    if (match) return `/${match[1]}`;
    return undefined;
  } catch {
    return undefined;
  }
}

// ── Technology Detection (Wappalyzer-like) ────────────────────

interface TechSignature {
  name: string;
  category: TechCategory;
  website?: string;
  // Detect from script URLs
  scriptPatterns?: RegExp[];
  // Detect from HTML meta / generator tags
  metaPatterns?: { name?: string; content?: RegExp }[];
  // Detect from window globals (JS evaluation)
  globals?: string[];
  // Detect from resource URLs
  resourcePatterns?: RegExp[];
  // Detect from HTML content
  htmlPatterns?: RegExp[];
}

const TECH_SIGNATURES: TechSignature[] = [
  // Frameworks
  { name: "React", category: "framework", website: "https://react.dev", globals: ["__REACT_DEVTOOLS_GLOBAL_HOOK__", "__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED"], scriptPatterns: [/react(?:\.production|\.development|\.min)?\.js/i], htmlPatterns: [/data-reactroot/i, /data-reactid/i] },
  { name: "Next.js", category: "framework", website: "https://nextjs.org", globals: ["__NEXT_DATA__", "__next"], scriptPatterns: [/_next\//i], htmlPatterns: [/__NEXT_DATA__/i], metaPatterns: [{ name: "next-head-count" }] },
  { name: "Vue.js", category: "framework", website: "https://vuejs.org", globals: ["__VUE__", "Vue"], scriptPatterns: [/vue(?:\.runtime|\.global|\.min)?\.js/i], htmlPatterns: [/data-v-[a-f0-9]/i] },
  { name: "Nuxt", category: "framework", website: "https://nuxt.com", globals: ["__NUXT__", "$nuxt"], scriptPatterns: [/_nuxt\//i] },
  { name: "Angular", category: "framework", website: "https://angular.dev", globals: ["ng"], htmlPatterns: [/ng-version/i, /\[ng-/i, /ng-app/i], scriptPatterns: [/angular(?:\.min)?\.js/i] },
  { name: "Svelte", category: "framework", website: "https://svelte.dev", htmlPatterns: [/svelte-[a-z0-9]/i], scriptPatterns: [/svelte/i] },
  { name: "Gatsby", category: "framework", website: "https://www.gatsbyjs.com", globals: ["___gatsby"], scriptPatterns: [/gatsby/i] },
  { name: "Remix", category: "framework", website: "https://remix.run", globals: ["__remixContext"], htmlPatterns: [/__remixContext/i] },
  { name: "Astro", category: "framework", website: "https://astro.build", htmlPatterns: [/astro-island/i, /astro-slot/i], metaPatterns: [{ name: "generator", content: /astro/i }] },
  { name: "jQuery", category: "library", website: "https://jquery.com", globals: ["jQuery", "$"], scriptPatterns: [/jquery(?:\.min)?\.js/i] },
  { name: "Ember.js", category: "framework", website: "https://emberjs.com", globals: ["Ember"], scriptPatterns: [/ember/i] },

  // UI Libraries
  { name: "Tailwind CSS", category: "ui", website: "https://tailwindcss.com", htmlPatterns: [/(?:^|\s)(?:flex|grid|text-|bg-|p-|m-|w-|h-|rounded|shadow|border)(?:\s|")/i], resourcePatterns: [/tailwind/i] },
  { name: "Bootstrap", category: "ui", website: "https://getbootstrap.com", scriptPatterns: [/bootstrap(?:\.bundle|\.min)?\.js/i], resourcePatterns: [/bootstrap(?:\.min)?\.css/i], htmlPatterns: [/class="[^"]*\b(?:container|row|col-(?:sm|md|lg|xl))\b/i] },
  { name: "Material UI", category: "ui", website: "https://mui.com", htmlPatterns: [/MuiBox|Mui[A-Z]/i], scriptPatterns: [/@mui\//i] },
  { name: "Chakra UI", category: "ui", website: "https://chakra-ui.com", htmlPatterns: [/chakra-ui/i], scriptPatterns: [/chakra/i] },
  { name: "Ant Design", category: "ui", website: "https://ant.design", htmlPatterns: [/class="ant-/i], scriptPatterns: [/antd/i] },

  // Build Tools
  { name: "Webpack", category: "build-tool", website: "https://webpack.js.org", globals: ["webpackJsonp", "webpackChunk", "__webpack_require__"], scriptPatterns: [/webpack/i] },
  { name: "Vite", category: "build-tool", website: "https://vitejs.dev", scriptPatterns: [/@vite\//i, /vite\/modulepreload/i], htmlPatterns: [/type="module"[^>]*src="[^"]*\/@vite/i] },
  { name: "Turbopack", category: "build-tool", website: "https://turbo.build/pack", scriptPatterns: [/turbopack/i] },
  { name: "Parcel", category: "build-tool", website: "https://parceljs.org", scriptPatterns: [/parcel/i] },

  // Analytics
  { name: "Google Analytics", category: "analytics", website: "https://analytics.google.com", globals: ["ga", "gtag", "dataLayer"], scriptPatterns: [/google-analytics\.com\/analytics/i, /googletagmanager\.com\/gtag/i, /gtag\/js/i] },
  { name: "Google Tag Manager", category: "analytics", website: "https://tagmanager.google.com", scriptPatterns: [/googletagmanager\.com\/gtm/i], htmlPatterns: [/GTM-[A-Z0-9]+/i] },
  { name: "Hotjar", category: "analytics", website: "https://www.hotjar.com", globals: ["hj", "_hjSettings"], scriptPatterns: [/hotjar\.com/i, /static\.hotjar\.com/i] },
  { name: "Mixpanel", category: "analytics", website: "https://mixpanel.com", globals: ["mixpanel"], scriptPatterns: [/mixpanel/i] },
  { name: "Segment", category: "analytics", website: "https://segment.com", globals: ["analytics"], scriptPatterns: [/cdn\.segment\.com/i, /segment\.io/i] },
  { name: "Plausible", category: "analytics", website: "https://plausible.io", scriptPatterns: [/plausible\.io/i] },
  { name: "Meta Pixel", category: "analytics", website: "https://www.facebook.com/business", globals: ["fbq"], scriptPatterns: [/connect\.facebook\.net/i] },

  // CDN
  { name: "Cloudflare", category: "cdn", website: "https://www.cloudflare.com", resourcePatterns: [/cdnjs\.cloudflare\.com/i], scriptPatterns: [/cloudflare/i, /cdn-cgi/i] },
  { name: "Vercel", category: "hosting", website: "https://vercel.com", resourcePatterns: [/vercel\.app/i, /vercel\.com/i, /_vercel\//i], htmlPatterns: [/__vercel/i] },
  { name: "Netlify", category: "hosting", website: "https://www.netlify.com", resourcePatterns: [/netlify/i] },
  { name: "AWS CloudFront", category: "cdn", website: "https://aws.amazon.com/cloudfront/", resourcePatterns: [/cloudfront\.net/i] },
  { name: "Fastly", category: "cdn", resourcePatterns: [/fastly/i] },
  { name: "Akamai", category: "cdn", resourcePatterns: [/akamai/i, /akamaized\.net/i] },

  // CMS
  { name: "WordPress", category: "cms", website: "https://wordpress.org", scriptPatterns: [/wp-content/i, /wp-includes/i], htmlPatterns: [/wp-content/i], metaPatterns: [{ name: "generator", content: /wordpress/i }] },
  { name: "Shopify", category: "cms", website: "https://www.shopify.com", globals: ["Shopify"], scriptPatterns: [/cdn\.shopify\.com/i], htmlPatterns: [/shopify/i] },
  { name: "Wix", category: "cms", website: "https://www.wix.com", scriptPatterns: [/static\.wixstatic\.com/i, /parastorage\.com/i], htmlPatterns: [/wix/i] },
  { name: "Squarespace", category: "cms", website: "https://www.squarespace.com", scriptPatterns: [/squarespace/i], htmlPatterns: [/squarespace/i] },
  { name: "Webflow", category: "cms", website: "https://webflow.com", scriptPatterns: [/webflow/i], htmlPatterns: [/wf-page/i] },
  { name: "Drupal", category: "cms", website: "https://www.drupal.org", globals: ["Drupal"], scriptPatterns: [/drupal/i], metaPatterns: [{ name: "generator", content: /drupal/i }] },

  // Font Services
  { name: "Google Fonts", category: "font-service", website: "https://fonts.google.com", resourcePatterns: [/fonts\.googleapis\.com/i, /fonts\.gstatic\.com/i] },
  { name: "Adobe Fonts", category: "font-service", website: "https://fonts.adobe.com", resourcePatterns: [/use\.typekit\.net/i] },
  { name: "Font Awesome", category: "ui", website: "https://fontawesome.com", resourcePatterns: [/fontawesome/i, /font-awesome/i] },

  // Libraries
  { name: "Lodash", category: "library", website: "https://lodash.com", globals: ["_"], scriptPatterns: [/lodash(?:\.min)?\.js/i] },
  { name: "Moment.js", category: "library", website: "https://momentjs.com", globals: ["moment"], scriptPatterns: [/moment(?:\.min)?\.js/i] },
  { name: "GSAP", category: "library", website: "https://gsap.com", globals: ["gsap"], scriptPatterns: [/gsap/i] },
  { name: "Three.js", category: "library", website: "https://threejs.org", globals: ["THREE"], scriptPatterns: [/three(?:\.min)?\.js/i] },
  { name: "D3.js", category: "library", website: "https://d3js.org", globals: ["d3"], scriptPatterns: [/d3(?:\.min)?\.js/i] },
  { name: "Framer Motion", category: "library", website: "https://www.framer.com/motion/", scriptPatterns: [/framer-motion/i] },
  { name: "Axios", category: "library", website: "https://axios-http.com", globals: ["axios"], scriptPatterns: [/axios/i] },

  // Security
  { name: "reCAPTCHA", category: "security", website: "https://www.google.com/recaptcha", globals: ["grecaptcha"], scriptPatterns: [/recaptcha/i, /google\.com\/recaptcha/i] },
  { name: "hCaptcha", category: "security", website: "https://www.hcaptcha.com", globals: ["hcaptcha"], scriptPatterns: [/hcaptcha\.com/i] },
  { name: "Cloudflare Turnstile", category: "security", website: "https://www.cloudflare.com/products/turnstile/", scriptPatterns: [/challenges\.cloudflare\.com\/turnstile/i] },
];

async function detectTechnologies(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  page: any,
  resourceUrls: string[],
): Promise<DetectedTechnology[]> {
  const detected = new Map<string, DetectedTechnology>();

  // Get page HTML + meta tags via single evaluate
  const pageInfo = await page.evaluate(() => {
    const html = document.documentElement.outerHTML;
    const metas: { name: string; content: string }[] = [];
    document.querySelectorAll("meta").forEach((m) => {
      const name = m.getAttribute("name") || m.getAttribute("property") || "";
      const content = m.getAttribute("content") || "";
      if (name || content) metas.push({ name: name.toLowerCase(), content });
    });
    return { html: html.slice(0, 200000), metas };
  });

  // Check globals via evaluate
  const globalChecks: string[] = [];
  for (const sig of TECH_SIGNATURES) {
    if (sig.globals) globalChecks.push(...sig.globals);
  }
  const foundGlobals = await page.evaluate((checks: string[]): Record<string, boolean> => {
    const results: Record<string, boolean> = {};
    for (const g of checks) {
      try {
        results[g] = typeof eval(g) !== "undefined";
      } catch {
        results[g] = false;
      }
    }
    return results;
  }, globalChecks);

  for (const sig of TECH_SIGNATURES) {
    let confidence = 0;
    let version: string | undefined;

    // Check globals
    if (sig.globals) {
      for (const g of sig.globals) {
        if (foundGlobals[g]) { confidence += 40; break; }
      }
    }

    // Check script/resource URLs
    if (sig.scriptPatterns) {
      for (const pattern of sig.scriptPatterns) {
        if (resourceUrls.some((u) => pattern.test(u))) { confidence += 30; break; }
      }
    }
    if (sig.resourcePatterns) {
      for (const pattern of sig.resourcePatterns) {
        if (resourceUrls.some((u) => pattern.test(u))) { confidence += 25; break; }
      }
    }

    // Check HTML patterns
    if (sig.htmlPatterns) {
      for (const pattern of sig.htmlPatterns) {
        if (pattern.test(pageInfo.html)) { confidence += 25; break; }
      }
    }

    // Check meta tags
    if (sig.metaPatterns) {
      for (const mp of sig.metaPatterns) {
        const meta = pageInfo.metas.find((m: { name: string; content: string }) =>
          (!mp.name || m.name === mp.name) && (!mp.content || mp.content.test(m.content))
        );
        if (meta) {
          confidence += 30;
          // Try to extract version from generator meta
          if (mp.name === "generator") {
            const vMatch = meta.content.match(/[\d]+(?:\.[\d]+)+/);
            if (vMatch) version = vMatch[0];
          }
          break;
        }
      }
    }

    if (confidence > 0) {
      confidence = Math.min(confidence, 100);
      const existing = detected.get(sig.name);
      if (!existing || existing.confidence < confidence) {
        detected.set(sig.name, {
          name: sig.name,
          category: sig.category,
          confidence,
          version,
          website: sig.website,
        });
      }
    }
  }

  return Array.from(detected.values()).sort((a, b) => b.confidence - a.confidence);
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

    // Enable CDP for coverage
    const cdp = await context.newCDPSession(page);

    // Track transfer sizes
    const transferSizes = new Map<string, number>();
    cdp.on("Network.responseReceived", (event: Record<string, unknown>) => {
      const resp = event.response as Record<string, unknown>;
      const url = resp.url as string;
      if (url) transferSizes.set(url, 0);
    });
    cdp.on("Network.loadingFinished", (event: Record<string, unknown>) => {
      const size = (event.encodedDataLength as number) || 0;
      // Find URL by request ID
      transferSizes.forEach((_, key) => {
        if (!transferSizes.get(key)) transferSizes.set(key, size);
      });
    });
    await cdp.send("Network.enable");

    // Start JS/CSS coverage
    await cdp.send("Profiler.enable");
    await cdp.send("Profiler.startPreciseCoverage", {
      callCount: false,
      detailed: true,
    });
    await cdp.send("DOM.enable");
    await cdp.send("CSS.enable");
    await cdp.send("CSS.startRuleUsageTracking");

    // Navigate
    const nav = await stealthGoto(page, targetUrl, { waitUntil: "networkidle", timeout: 60000 });
    if (!nav.success) {
      await context.close();
      throw new Error(`Blocked by ${nav.challengeDetected}`);
    }
    await page.waitForTimeout(2000);

    // Collect JS coverage
    const jsCoverage = await cdp.send("Profiler.takePreciseCoverage") as {
      result: { url: string; functions: { ranges: { startOffset: number; endOffset: number; count: number }[] }[] }[];
    };

    // Collect resource sizes
    const resources = await page.evaluate(() => {
      return (performance.getEntriesByType("resource") as PerformanceResourceTiming[]).map((r) => ({
        url: r.name,
        transferSize: r.transferSize || r.encodedBodySize || 0,
        decodedSize: r.decodedBodySize || 0,
        type: r.initiatorType,
      }));
    });

    // Detect technologies (Wappalyzer-like)
    const technologies = await detectTechnologies(page, resources.map((r) => r.url));

    await context.close();
    await browser.close();
    browser = null;

    // Process chunks
    const chunks: BundleChunk[] = [];
    let totalJsSize = 0;
    let totalCssSize = 0;
    let totalTransferSize = 0;

    for (const r of resources) {
      const type = categorizeResource(r.url);
      const name = getChunkName(r.url);
      const gzipEstimate = Math.round(r.transferSize * 0.35); // rough gzip estimate

      chunks.push({
        name,
        size: r.decodedSize || r.transferSize,
        gzipSize: r.transferSize || gzipEstimate,
        type,
        isFirstLoad: isFirstLoadChunk(name),
        route: detectRoute(r.url),
      });

      totalTransferSize += r.transferSize;
      if (type === "js") totalJsSize += r.transferSize;
      if (type === "css") totalCssSize += r.transferSize;
    }

    chunks.sort((a, b) => b.size - a.size);

    // Compute unused JS coverage
    const unusedJs: BundleAnalysis["unusedJs"] = [];
    for (const script of jsCoverage.result) {
      if (!script.url || script.url.startsWith("data:")) continue;

      let totalBytes = 0;
      let usedBytes = 0;
      for (const fn of script.functions) {
        for (const range of fn.ranges) {
          const size = range.endOffset - range.startOffset;
          totalBytes += size;
          if (range.count > 0) usedBytes += size;
        }
      }

      if (totalBytes > 0) {
        const unusedBytes = totalBytes - usedBytes;
        const percentUnused = Math.round((unusedBytes / totalBytes) * 100);
        if (percentUnused > 20 && unusedBytes > 1024) {
          unusedJs.push({
            url: script.url,
            totalBytes,
            unusedBytes,
            percentUnused,
          });
        }
      }
    }
    unusedJs.sort((a, b) => b.unusedBytes - a.unusedBytes);

    // Build treemap data
    const treemapData: BundleAnalysis["treemapData"] = [];
    const byType: Record<string, BundleChunk[]> = {};
    for (const chunk of chunks) {
      if (!byType[chunk.type]) byType[chunk.type] = [];
      byType[chunk.type].push(chunk);
    }
    for (const [type, typeChunks] of Object.entries(byType)) {
      treemapData.push({
        name: type.toUpperCase(),
        size: typeChunks.reduce((s, c) => s + c.size, 0),
        children: typeChunks.slice(0, 20).map((c) => ({ name: c.name, size: c.size })),
      });
    }

    const result: BundleAnalysis = {
      url: targetUrl,
      totalJsSize,
      totalCssSize,
      totalTransferSize,
      chunks: chunks.slice(0, 50), // Top 50 chunks
      unusedJs: unusedJs.slice(0, 20),
      duplicateModules: [], // Would need source map analysis for this
      treemapData,
      technologies,
    };

    return NextResponse.json(result);
  } catch (err) {
    if (browser) {
      try { await browser.close(); } catch { /* ignore */ }
    }
    const message = err instanceof Error ? err.message : "Bundle analysis failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
