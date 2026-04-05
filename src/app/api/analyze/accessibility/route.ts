import { NextRequest, NextResponse } from "next/server";
import { join } from "path";
import { createHash } from "crypto";
import type {
  AccessibilityData,
  AccessibilityIssue,
  DeviceAccessibilityResult,
  DeviceProfile,
  WcagPrinciple,
} from "@/lib/types";
import { DEVICE_PROFILES } from "@/lib/types";
import { fetchSitemapUrls } from "@/lib/sitemap";
import {
  launchBrowser,
  applyStealthScripts,
  stealthGoto,
  getStealthContextOptions,
} from "@/lib/browser-helpers";

/** Strip trailing slash + fragment so /foo/ and /foo are treated as the same page */
function normalizeUrl(raw: string): string {
  try {
    const u = new URL(raw);
    u.hash = "";
    if (u.pathname.length > 1 && u.pathname.endsWith("/")) {
      u.pathname = u.pathname.slice(0, -1);
    }
    return u.toString();
  } catch {
    return raw;
  }
}

interface AxeNode {
  html: string;
  target: string[];
  failureSummary?: string;
}

interface AxeViolation {
  id: string;
  impact?: string;
  help: string;
  description: string;
  helpUrl: string;
  tags: string[];
  nodes: AxeNode[];
}

interface AxeResults {
  violations: AxeViolation[];
  passes: { id: string }[];
  incomplete: { id: string }[];
}

const TAG_TO_PRINCIPLE: Record<string, string> = {
  wcag2a: "",
  wcag2aa: "",
  wcag2aaa: "",
  wcag21a: "",
  wcag21aa: "",
  wcag22aa: "",
  "cat.text-alternatives": "perceivable",
  "cat.color": "perceivable",
  "cat.semantics": "perceivable",
  "cat.sensory-and-visual-cues": "perceivable",
  "cat.tables": "perceivable",
  "cat.time-and-media": "perceivable",
  "cat.structure": "perceivable",
  "cat.forms": "operable",
  "cat.keyboard": "operable",
  "cat.navigation": "operable",
  "cat.name-role-value": "robust",
  "cat.parsing": "robust",
  "cat.aria": "robust",
  "cat.language": "understandable",
};

function wcagTagToId(tags: string[]): string {
  for (const tag of tags) {
    const match = tag.match(/^wcag(\d)(\d)(\d+)$/);
    if (match) return `${match[1]}.${match[2]}.${match[3]}`;
  }
  return "";
}

function getPrinciple(tags: string[]): string {
  for (const tag of tags) {
    if (TAG_TO_PRINCIPLE[tag] && TAG_TO_PRINCIPLE[tag] !== "")
      return TAG_TO_PRINCIPLE[tag];
  }
  const wcag = wcagTagToId(tags);
  if (wcag.startsWith("1.")) return "perceivable";
  if (wcag.startsWith("2.")) return "operable";
  if (wcag.startsWith("3.")) return "understandable";
  if (wcag.startsWith("4.")) return "robust";
  return "robust";
}

// Map WCAG success criterion numbers to W3C Understanding doc slugs
const WCAG_SLUGS: Record<string, string> = {
  "1.1.1": "non-text-content",
  "1.2.1": "audio-only-and-video-only-prerecorded",
  "1.2.2": "captions-prerecorded",
  "1.2.3": "audio-description-or-media-alternative-prerecorded",
  "1.2.5": "audio-description-prerecorded",
  "1.3.1": "info-and-relationships",
  "1.3.2": "meaningful-sequence",
  "1.3.3": "sensory-characteristics",
  "1.3.4": "orientation",
  "1.3.5": "identify-input-purpose",
  "1.4.1": "use-of-color",
  "1.4.2": "audio-control",
  "1.4.3": "contrast-minimum",
  "1.4.4": "resize-text",
  "1.4.5": "images-of-text",
  "1.4.10": "reflow",
  "1.4.11": "non-text-contrast",
  "1.4.12": "text-spacing",
  "1.4.13": "content-on-hover-or-focus",
  "2.1.1": "keyboard",
  "2.1.2": "no-keyboard-trap",
  "2.1.4": "character-key-shortcuts",
  "2.2.1": "timing-adjustable",
  "2.2.2": "pause-stop-hide",
  "2.3.1": "three-flashes-or-below-threshold",
  "2.4.1": "bypass-blocks",
  "2.4.2": "page-titled",
  "2.4.3": "focus-order",
  "2.4.4": "link-purpose-in-context",
  "2.4.5": "multiple-ways",
  "2.4.6": "headings-and-labels",
  "2.4.7": "focus-visible",
  "2.4.11": "focus-not-obscured-minimum",
  "2.5.1": "pointer-gestures",
  "2.5.2": "pointer-cancellation",
  "2.5.3": "label-in-name",
  "2.5.4": "motion-actuation",
  "2.5.7": "dragging-movements",
  "2.5.8": "target-size-minimum",
  "3.1.1": "language-of-page",
  "3.1.2": "language-of-parts",
  "3.2.1": "on-focus",
  "3.2.2": "on-input",
  "3.2.6": "consistent-help",
  "3.3.1": "error-identification",
  "3.3.2": "labels-or-instructions",
  "3.3.3": "error-suggestion",
  "3.3.4": "error-prevention-legal-financial-data",
  "3.3.7": "redundant-entry",
  "3.3.8": "accessible-authentication-minimum",
  "4.1.2": "name-role-value",
  "4.1.3": "status-messages",
};

function wcagDocUrl(wcagId: string): string {
  const slug = WCAG_SLUGS[wcagId];
  if (slug) return `https://www.w3.org/WAI/WCAG22/Understanding/${slug}`;
  return "https://www.w3.org/WAI/WCAG22/quickref/";
}

function buildA11yData(
  targetUrl: string,
  axeResults: AxeResults,
  pageUrl?: string
): AccessibilityData {
  // Create a short page hash to ensure unique IDs across pages in full-site mode
  const pageHash = pageUrl
    ? createHash("sha256").update(pageUrl).digest("hex").slice(0, 8)
    : "0";
  const issues: AccessibilityIssue[] = axeResults.violations.flatMap(
    (violation) =>
      violation.nodes.map((node, idx) => {
        const wcagId = wcagTagToId(violation.tags) || violation.id;
        return {
          id: `${violation.id}-${pageHash}-${idx}`,
          severity: (violation.impact || "moderate") as AccessibilityIssue["severity"],
          wcag: wcagId,
          principle: getPrinciple(violation.tags) as WcagPrinciple,
          title: violation.help,
          description: violation.description,
          element: node.html,
          target: node.target.join(", "),
          count: 1,
          fix: node.failureSummary || violation.helpUrl,
          helpUrl: violation.helpUrl,
          wcagUrl: wcagDocUrl(wcagId),
          ...(pageUrl ? { pageUrl } : {}),
        };
      })
  );

  const stats = {
    critical: issues.filter((i) => i.severity === "critical").length,
    serious: issues.filter((i) => i.severity === "serious").length,
    moderate: issues.filter((i) => i.severity === "moderate").length,
    minor: issues.filter((i) => i.severity === "minor").length,
  };

  const principleCounts = {
    perceivable: 0,
    operable: 0,
    understandable: 0,
    robust: 0,
  };
  for (const v of axeResults.violations) {
    const p = getPrinciple(v.tags) as keyof typeof principleCounts;
    if (p in principleCounts) principleCounts[p] += v.nodes.length;
  }

  const totalIssues = issues.length;
  const passedCount = axeResults.passes.length;
  const totalChecks =
    passedCount + axeResults.violations.length + axeResults.incomplete.length;
  const score =
    totalChecks > 0 ? Math.round((passedCount / totalChecks) * 100) : 100;

  const maxIssuesForPrinciple = Math.max(
    ...Object.values(principleCounts),
    1
  );
  const principles = {
    perceivable: {
      score: Math.max(
        0,
        Math.round(100 - (principleCounts.perceivable / maxIssuesForPrinciple) * 50)
      ),
      issueCount: principleCounts.perceivable,
    },
    operable: {
      score: Math.max(
        0,
        Math.round(100 - (principleCounts.operable / maxIssuesForPrinciple) * 50)
      ),
      issueCount: principleCounts.operable,
    },
    understandable: {
      score: Math.max(
        0,
        Math.round(100 - (principleCounts.understandable / maxIssuesForPrinciple) * 50)
      ),
      issueCount: principleCounts.understandable,
    },
    robust: {
      score: Math.max(
        0,
        Math.round(100 - (principleCounts.robust / maxIssuesForPrinciple) * 50)
      ),
      issueCount: principleCounts.robust,
    },
  };

  return {
    url: targetUrl,
    score,
    summary: `Found ${totalIssues} issue${totalIssues !== 1 ? "s" : ""} across ${axeResults.violations.length} rule${axeResults.violations.length !== 1 ? "s" : ""}. ${passedCount} checks passed.`,
    principles,
    issues,
    stats,
  };
}

async function scanDevice(
  browser: Awaited<ReturnType<typeof launchBrowser>>,
  device: DeviceProfile,
  targetUrl: string
): Promise<{ screenshot: string; axeResults: AxeResults; links: string[] }> {
  const context = await browser.newContext(getStealthContextOptions(device));
  const page = await context.newPage();
  await applyStealthScripts(page);

  const nav = await stealthGoto(page, targetUrl, { waitUntil: "networkidle", timeout: 60000 });
  if (!nav.success) {
    await context.close();
    throw new Error(`Blocked by ${nav.challengeDetected} on ${targetUrl}. The site requires interactive CAPTCHA.`);
  }

  const screenshotBuf = await page.screenshot({
    fullPage: true,
    type: "jpeg",
    quality: 70,
  });
  const screenshot = `data:image/jpeg;base64,${screenshotBuf.toString("base64")}`;

  // Collect same-origin links for full-site crawl
  const origin = new URL(targetUrl).origin;
  const links: string[] = await page.evaluate((orig: string) => {
    return Array.from(document.querySelectorAll("a[href]"))
      .map((a) => {
        try {
          return new URL((a as HTMLAnchorElement).href, document.location.href).href;
        } catch {
          return "";
        }
      })
      .filter(
        (href) =>
          href.startsWith(orig) &&
          !href.includes("#") &&
          !href.match(/\.(pdf|zip|png|jpg|jpeg|gif|svg|webp|mp4|mp3)$/i)
      );
  }, origin);

  await page.addScriptTag({
    path: join(process.cwd(), "node_modules", "axe-core", "axe.min.js"),
  });

  const axeResults: AxeResults = await page.evaluate(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (window as any).axe.run(document, {
      runOnly: {
        type: "tag",
        values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"],
      },
    });
  });

  await context.close();
  return { screenshot, axeResults, links: [...new Set(links.map(normalizeUrl))] };
}

/** Scan a single page (reuses existing context pattern but without screenshot) */
async function scanPage(
  browser: Awaited<ReturnType<typeof launchBrowser>>,
  device: DeviceProfile,
  targetUrl: string
): Promise<AxeResults> {
  const context = await browser.newContext(getStealthContextOptions(device));
  const page = await context.newPage();
  await applyStealthScripts(page);

  const nav = await stealthGoto(page, targetUrl, { waitUntil: "networkidle", timeout: 60000 });
  if (!nav.success) {
    await context.close();
    throw new Error(`Blocked by ${nav.challengeDetected} on ${targetUrl}`);
  }

  await page.addScriptTag({
    path: join(process.cwd(), "node_modules", "axe-core", "axe.min.js"),
  });

  const axeResults: AxeResults = await page.evaluate(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (window as any).axe.run(document, {
      runOnly: {
        type: "tag",
        values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"],
      },
    });
  });

  await context.close();
  return axeResults;
}

/** Merge accessibility data from multiple pages into one combined result */
function mergeA11yData(
  primaryUrl: string,
  pages: { url: string; axeResults: AxeResults }[]
): AccessibilityData {
  let allIssues: AccessibilityIssue[] = [];
  let totalPasses = 0;
  let totalViolations = 0;
  let totalIncomplete = 0;

  const principleCounts = { perceivable: 0, operable: 0, understandable: 0, robust: 0 };

  for (const pg of pages) {
    const pageIssues = buildA11yData(primaryUrl, pg.axeResults, pg.url).issues;
    allIssues = allIssues.concat(pageIssues);

    totalPasses += pg.axeResults.passes.length;
    totalViolations += pg.axeResults.violations.length;
    totalIncomplete += pg.axeResults.incomplete.length;

    for (const v of pg.axeResults.violations) {
      const p = getPrinciple(v.tags) as keyof typeof principleCounts;
      if (p in principleCounts) principleCounts[p] += v.nodes.length;
    }
  }

  const stats = {
    critical: allIssues.filter((i) => i.severity === "critical").length,
    serious: allIssues.filter((i) => i.severity === "serious").length,
    moderate: allIssues.filter((i) => i.severity === "moderate").length,
    minor: allIssues.filter((i) => i.severity === "minor").length,
  };

  const totalChecks = totalPasses + totalViolations + totalIncomplete;
  const score = totalChecks > 0 ? Math.round((totalPasses / totalChecks) * 100) : 100;

  const maxIssuesForPrinciple = Math.max(...Object.values(principleCounts), 1);
  const principles = {
    perceivable: {
      score: Math.max(0, Math.round(100 - (principleCounts.perceivable / maxIssuesForPrinciple) * 50)),
      issueCount: principleCounts.perceivable,
    },
    operable: {
      score: Math.max(0, Math.round(100 - (principleCounts.operable / maxIssuesForPrinciple) * 50)),
      issueCount: principleCounts.operable,
    },
    understandable: {
      score: Math.max(0, Math.round(100 - (principleCounts.understandable / maxIssuesForPrinciple) * 50)),
      issueCount: principleCounts.understandable,
    },
    robust: {
      score: Math.max(0, Math.round(100 - (principleCounts.robust / maxIssuesForPrinciple) * 50)),
      issueCount: principleCounts.robust,
    },
  };

  const pageCount = pages.length;
  return {
    url: primaryUrl,
    score,
    summary: `Found ${allIssues.length} issue${allIssues.length !== 1 ? "s" : ""} across ${pageCount} page${pageCount !== 1 ? "s" : ""}. ${totalPasses} checks passed.`,
    principles,
    issues: allIssues,
    stats,
  };
}

// ── Streaming full-site scan ─────────────────────────────────
function streamFullSiteScan(
  parsedUrl: URL,
  selectedDevices: DeviceProfile[]
) {
  const targetUrl = parsedUrl.toString();

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      const emit = (data: unknown) => {
        try {
          controller.enqueue(encoder.encode(JSON.stringify(data) + "\n"));
        } catch { /* stream closed by client */ }
      };

      let sitemapPages: string[] = [];
      try {
        sitemapPages = await fetchSitemapUrls(parsedUrl.origin);
      } catch { /* fall back to link crawling */ }

      let browser: Awaited<ReturnType<typeof launchBrowser>> | null = null;
      try {
        browser = await launchBrowser();
        const PAGE_CONCURRENCY = 5;

        await Promise.all(
          selectedDevices.map(async (device) => {
            const { screenshot, axeResults, links } = await scanDevice(browser!, device, targetUrl);

            const normTarget = normalizeUrl(targetUrl);
            const discoveredPages = [...new Set(
              (sitemapPages.length > 0 ? sitemapPages : links)
                .map(normalizeUrl)
                .filter((l) => l !== normTarget)
            )];

            // Emit main page result immediately
            emit({
              type: "init",
              deviceType: device.type,
              device,
              screenshot,
              data: buildA11yData(targetUrl, axeResults, targetUrl),
              pagesTotal: discoveredPages.length + 1,
            });

            if (discoveredPages.length > 0) {
              let idx = 0;
              async function worker() {
                while (idx < discoveredPages.length) {
                  const pageUrl = discoveredPages[idx++];
                  try {
                    const pageAxe = await scanPage(browser!, device, pageUrl);
                    emit({
                      type: "page",
                      deviceType: device.type,
                      page: { url: pageUrl, data: buildA11yData(targetUrl, pageAxe, pageUrl) },
                    });
                  } catch { /* skip failed pages */ }
                }
              }
              await Promise.all(
                Array.from({ length: Math.min(PAGE_CONCURRENCY, discoveredPages.length) }, () => worker())
              );
            }

            emit({ type: "device-done", deviceType: device.type });
          })
        );

        emit({ type: "done" });
        await browser.close();
      } catch (err) {
        if (browser) try { await browser.close(); } catch {}
        emit({ type: "error", error: err instanceof Error ? err.message : "Scan failed" });
      }

      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-store, no-cache",
    },
  });
}

export async function POST(req: NextRequest) {
  const { url, devices, scanMode } = await req.json();

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
      ? DEVICE_PROFILES.filter((d) => devices.includes(d.type))
      : DEVICE_PROFILES;

  if (scanMode === "full-site") {
    return streamFullSiteScan(parsedUrl, selectedDevices);
  }

  let browser: Awaited<ReturnType<typeof launchBrowser>> | null = null;
  try {
    browser = await launchBrowser();
    const targetUrl = parsedUrl.toString();
    const activeBrowser = browser;

    // Single-page mode — scan all devices in parallel
    const results = await Promise.all(selectedDevices.map(async (device): Promise<DeviceAccessibilityResult> => {
      const { screenshot, axeResults, links: _links } = await scanDevice(activeBrowser, device, targetUrl);
      const data = buildA11yData(targetUrl, axeResults, targetUrl);
      return { device, screenshot, data };
    }));

    await browser.close();
    browser = null;

    return NextResponse.json(results, {
      headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
    });
  } catch (err) {
    if (browser) {
      try { await browser.close(); } catch { }
    }
    const message = err instanceof Error ? err.message : "Scan failed";
    if (message.includes("browserType.launch")) {
      return NextResponse.json(
        { error: "Chromium not installed. Run: npx playwright install chromium" },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { error: `Scan failed: ${message}` },
      { status: 500 }
    );
  }
}
