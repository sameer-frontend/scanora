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
import {
  launchBrowser,
  applyStealthScripts,
  stealthGoto,
  getStealthContextOptions,
  sanitizeBrowserError,
} from "@/lib/browser-helpers";

export const maxDuration = 300;

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

function wcagTagToId(tags: string[]): string {
  for (const tag of tags) {
    const match = tag.match(/^wcag(\d)(\d)(\d+)$/);
    if (match) return `${match[1]}.${match[2]}.${match[3]}`;
  }
  return "";
}

function getPrinciple(tags: string[]): string {
  for (const tag of tags) {
    if (TAG_TO_PRINCIPLE[tag]) return TAG_TO_PRINCIPLE[tag];
  }
  const wcag = wcagTagToId(tags);
  if (wcag.startsWith("1.")) return "perceivable";
  if (wcag.startsWith("2.")) return "operable";
  if (wcag.startsWith("3.")) return "understandable";
  if (wcag.startsWith("4.")) return "robust";
  return "robust";
}

function wcagDocUrl(wcagId: string): string {
  const slug = WCAG_SLUGS[wcagId];
  return slug
    ? `https://www.w3.org/WAI/WCAG22/Understanding/${slug}`
    : "https://www.w3.org/WAI/WCAG22/quickref/";
}

function buildA11yData(targetUrl: string, axeResults: AxeResults): AccessibilityData {
  const pageHash = createHash("sha256").update(targetUrl).digest("hex").slice(0, 8);

  const issues: AccessibilityIssue[] = axeResults.violations.flatMap((violation) =>
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
      };
    })
  );

  const stats = {
    critical: issues.filter((i) => i.severity === "critical").length,
    serious: issues.filter((i) => i.severity === "serious").length,
    moderate: issues.filter((i) => i.severity === "moderate").length,
    minor: issues.filter((i) => i.severity === "minor").length,
  };

  const principleCounts = { perceivable: 0, operable: 0, understandable: 0, robust: 0 };
  for (const v of axeResults.violations) {
    const p = getPrinciple(v.tags) as keyof typeof principleCounts;
    if (p in principleCounts) principleCounts[p] += v.nodes.length;
  }

  const totalIssues = issues.length;
  const passedCount = axeResults.passes.length;
  const totalChecks = passedCount + axeResults.violations.length + axeResults.incomplete.length;
  const score = totalChecks > 0 ? Math.round((passedCount / totalChecks) * 100) : 100;

  const maxIssues = Math.max(...Object.values(principleCounts), 1);
  const principles = {
    perceivable: {
      score: Math.max(0, Math.round(100 - (principleCounts.perceivable / maxIssues) * 50)),
      issueCount: principleCounts.perceivable,
    },
    operable: {
      score: Math.max(0, Math.round(100 - (principleCounts.operable / maxIssues) * 50)),
      issueCount: principleCounts.operable,
    },
    understandable: {
      score: Math.max(0, Math.round(100 - (principleCounts.understandable / maxIssues) * 50)),
      issueCount: principleCounts.understandable,
    },
    robust: {
      score: Math.max(0, Math.round(100 - (principleCounts.robust / maxIssues) * 50)),
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
): Promise<DeviceAccessibilityResult> {
  const context = await browser.newContext(getStealthContextOptions(device));
  const page = await context.newPage();
  await applyStealthScripts(page);

  const nav = await stealthGoto(page, targetUrl, { waitUntil: "networkidle", timeout: 60000 });
  if (!nav.success) {
    await context.close();
    throw new Error(
      `Blocked by ${nav.challengeDetected} on ${targetUrl}. The site requires interactive CAPTCHA.`
    );
  }

  const screenshotBuf = await page.screenshot({ fullPage: true, type: "jpeg", quality: 70 });
  const screenshot = `data:image/jpeg;base64,${screenshotBuf.toString("base64")}`;

  await page.addScriptTag({
    path: join(process.cwd(), "node_modules", "axe-core", "axe.min.js"),
  });

  const axeResults: AxeResults = await page.evaluate(() =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).axe.run(document, {
      runOnly: {
        type: "tag",
        values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"],
      },
    })
  );

  await context.close();
  return { device, screenshot, data: buildA11yData(targetUrl, axeResults) };
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { url, devices } = body as { url?: unknown; devices?: unknown };

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

  let browser: Awaited<ReturnType<typeof launchBrowser>> | null = null;
  try {
    browser = await launchBrowser();
    const targetUrl = parsedUrl.toString();

    const results = await Promise.all(
      selectedDevices.map((device) => scanDevice(browser!, device, targetUrl))
    );

    await browser.close();
    browser = null;

    return NextResponse.json(results, {
      headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
    });
  } catch (err) {
    if (browser) {
      try { await browser.close(); } catch { /* ignore */ }
    }
    return NextResponse.json({ error: sanitizeBrowserError(err) }, { status: 500 });
  }
}
