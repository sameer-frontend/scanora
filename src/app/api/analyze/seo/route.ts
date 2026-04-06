import { NextRequest, NextResponse } from "next/server";
import type {
  SeoData,
  SeoHeading,
  SeoMetaTag,
  SeoOpenGraph,
  SeoTwitterCard,
  SeoIssue,
  DeviceSeoResult,
  DeviceProfile,
} from "@/lib/types";

import { DEVICE_PROFILES } from "@/lib/types";
import {
  launchBrowser,
  applyStealthScripts,
  stealthGoto,
  getStealthContextOptions,
} from "@/lib/browser-helpers";

export const maxDuration = 300;

// ── Page-level SEO extraction (runs inside browser) ─────────────────────

interface RawSeoData {
  title: string;
  metaDescription: string;
  canonical: string;
  headings: { level: number; text: string }[];
  links: {
    internal: number;
    external: number;
    noFollow: number;
    withoutText: number;
    hrefs: string[];
  };
  images: {
    total: number;
    withAlt: number;
    withoutAlt: number;
    large: { src: string; width: number; height: number }[];
  };
  og: Record<string, string>;
  twitter: Record<string, string>;
  metaTags: { name: string; content: string }[];
  structuredData: { types: string[]; count: number; hasJsonLd: boolean };
  robots: string;
  viewport: string;
  lang: string;
  charset: string;
  hreflang: { lang: string; href: string }[];
  favicon: boolean;
  isHttps: boolean;
}

function extractSeoData(pageUrl: string): RawSeoData {
  const origin = new URL(pageUrl).origin;

  // Title
  const title = document.title || "";

  // Meta description
  const descTag = document.querySelector('meta[name="description"]');
  const metaDescription = descTag?.getAttribute("content") || "";

  // Canonical
  const canonicalTag = document.querySelector('link[rel="canonical"]');
  const canonical = canonicalTag?.getAttribute("href") || "";

  // Headings
  const headings: { level: number; text: string }[] = [];
  document.querySelectorAll("h1, h2, h3, h4, h5, h6").forEach((el) => {
    headings.push({
      level: parseInt(el.tagName[1]),
      text: (el.textContent || "").trim().slice(0, 200),
    });
  });

  // Links
  const anchors = document.querySelectorAll("a[href]");
  let internal = 0;
  let external = 0;
  let noFollow = 0;
  let withoutText = 0;
  const hrefs: string[] = [];
  anchors.forEach((a) => {
    const href = a.getAttribute("href") || "";
    hrefs.push(href);
    try {
      const url = new URL(href, pageUrl);
      if (url.origin === origin) internal++;
      else external++;
    } catch {
      internal++; // relative
    }
    if (a.getAttribute("rel")?.includes("nofollow")) noFollow++;
    if (!(a.textContent || "").trim() && !a.querySelector("img")) withoutText++;
  });

  // Images
  const imgs = document.querySelectorAll("img");
  let withAlt = 0;
  let withoutAlt = 0;
  const large: { src: string; width: number; height: number }[] = [];
  imgs.forEach((img) => {
    const alt = img.getAttribute("alt");
    if (alt && alt.trim()) withAlt++;
    else withoutAlt++;
    if (img.naturalWidth > 1500 || img.naturalHeight > 1500) {
      large.push({
        src: (img.getAttribute("src") || "").slice(0, 200),
        width: img.naturalWidth,
        height: img.naturalHeight,
      });
    }
  });

  // Open Graph
  const og: Record<string, string> = {};
  document.querySelectorAll('meta[property^="og:"]').forEach((el) => {
    const prop = el.getAttribute("property")?.replace("og:", "") || "";
    og[prop] = el.getAttribute("content") || "";
  });

  // Twitter Card
  const twitter: Record<string, string> = {};
  document.querySelectorAll('meta[name^="twitter:"]').forEach((el) => {
    const name = el.getAttribute("name")?.replace("twitter:", "") || "";
    twitter[name] = el.getAttribute("content") || "";
  });

  // Other meta tags
  const metaTags: { name: string; content: string }[] = [];
  document.querySelectorAll("meta[name], meta[property]").forEach((el) => {
    const name =
      el.getAttribute("name") || el.getAttribute("property") || "";
    const content = el.getAttribute("content") || "";
    if (name && content) metaTags.push({ name, content });
  });

  // Structured Data
  const jsonLdScripts = document.querySelectorAll(
    'script[type="application/ld+json"]'
  );
  const types: string[] = [];
  let hasJsonLd = false;
  jsonLdScripts.forEach((script) => {
    hasJsonLd = true;
    try {
      const data = JSON.parse(script.textContent || "{}");
      if (data["@type"]) types.push(data["@type"]);
      if (Array.isArray(data["@graph"])) {
        data["@graph"].forEach((item: Record<string, string>) => {
          if (item["@type"]) types.push(item["@type"]);
        });
      }
    } catch { /* invalid JSON-LD */ }
  });

  // Robots
  const robotsTag = document.querySelector('meta[name="robots"]');
  const robots = robotsTag?.getAttribute("content") || "";

  // Viewport
  const viewportTag = document.querySelector('meta[name="viewport"]');
  const viewport = viewportTag?.getAttribute("content") || "";

  // Language
  const lang = document.documentElement.getAttribute("lang") || "";

  // Charset
  const charsetMeta = document.querySelector("meta[charset]");
  const charset = charsetMeta?.getAttribute("charset") || "";

  // Hreflang
  const hreflang: { lang: string; href: string }[] = [];
  document.querySelectorAll('link[rel="alternate"][hreflang]').forEach((el) => {
    hreflang.push({
      lang: el.getAttribute("hreflang") || "",
      href: el.getAttribute("href") || "",
    });
  });

  // Favicon
  const faviconLink = document.querySelector('link[rel="icon"], link[rel="shortcut icon"]');
  const favicon = !!faviconLink;

  // HTTPS
  const isHttps = new URL(pageUrl).protocol === "https:";

  return {
    title,
    metaDescription,
    canonical,
    headings,
    links: { internal, external, noFollow, withoutText, hrefs },
    images: { total: imgs.length, withAlt, withoutAlt, large },
    og,
    twitter,
    metaTags,
    structuredData: { types, count: jsonLdScripts.length, hasJsonLd },
    robots,
    viewport,
    lang,
    charset,
    hreflang,
    favicon,
    isHttps,
  };
}

// ── Analyze raw data into scored SeoData ──────────────────────

function analyzeSeo(raw: RawSeoData, pageUrl: string): SeoData {
  const issues: SeoIssue[] = [];
  let score = 100;
  let issueId = 0;

  const addIssue = (
    severity: SeoIssue["severity"],
    category: string,
    title: string,
    description: string,
    penalty: number,
    value?: string
  ) => {
    issues.push({ id: `seo-${++issueId}`, severity, category, title, description, value });
    if (severity === "critical") score -= penalty;
    else if (severity === "warning") score -= penalty;
  };

  // ── Title ───────────────────────────────────────────────────
  const titleLen = raw.title.length;
  let titleStatus: "good" | "warning" | "error" = "good";
  if (!raw.title) {
    titleStatus = "error";
    addIssue("critical", "Title", "Missing page title", "The page has no <title> tag. This is critical for SEO.", 15);
  } else if (titleLen < 30) {
    titleStatus = "warning";
    addIssue("warning", "Title", "Title too short", `Title is ${titleLen} characters. Aim for 50-60 characters for best SEO.`, 5, raw.title);
  } else if (titleLen > 60) {
    titleStatus = "warning";
    addIssue("warning", "Title", "Title too long", `Title is ${titleLen} characters. It may be truncated in search results. Keep under 60.`, 5, raw.title);
  } else {
    issues.push({ id: `seo-${++issueId}`, severity: "pass", category: "Title", title: "Title tag is optimal", description: `Title is ${titleLen} characters (50-60 recommended).`, value: raw.title });
  }

  // ── Meta Description ────────────────────────────────────────
  const descLen = raw.metaDescription.length;
  let descStatus: "good" | "warning" | "error" = "good";
  if (!raw.metaDescription) {
    descStatus = "error";
    addIssue("critical", "Meta Description", "Missing meta description", "No meta description found. Search engines will auto-generate one, often poorly.", 15);
  } else if (descLen < 120) {
    descStatus = "warning";
    addIssue("warning", "Meta Description", "Meta description too short", `Description is ${descLen} characters. Aim for 150-160 for full visibility in SERP.`, 5, raw.metaDescription);
  } else if (descLen > 160) {
    descStatus = "warning";
    addIssue("warning", "Meta Description", "Meta description too long", `Description is ${descLen} characters. It may be truncated. Keep under 160.`, 3, raw.metaDescription);
  } else {
    issues.push({ id: `seo-${++issueId}`, severity: "pass", category: "Meta Description", title: "Meta description is optimal", description: `Description is ${descLen} characters (150-160 recommended).`, value: raw.metaDescription });
  }

  // ── Canonical ───────────────────────────────────────────────
  let canonicalValid = true;
  let canonicalIssue: string | undefined;
  if (!raw.canonical) {
    canonicalValid = false;
    canonicalIssue = "No canonical URL specified";
    addIssue("warning", "Canonical", "Missing canonical tag", "Without a canonical tag, search engines may index duplicate pages.", 5);
  } else {
    try {
      const cu = new URL(raw.canonical, pageUrl);
      if (cu.origin !== new URL(pageUrl).origin) {
        canonicalIssue = "Canonical points to a different domain";
        addIssue("warning", "Canonical", "Cross-domain canonical", `Canonical URL points to ${cu.origin}, which differs from the page origin.`, 3);
      } else {
        issues.push({ id: `seo-${++issueId}`, severity: "pass", category: "Canonical", title: "Canonical tag present", description: `Canonical: ${raw.canonical}` });
      }
    } catch {
      canonicalValid = false;
      canonicalIssue = "Invalid canonical URL";
      addIssue("warning", "Canonical", "Invalid canonical URL", `The canonical URL "${raw.canonical}" is malformed.`, 5);
    }
  }

  // ── Headings ────────────────────────────────────────────────
  const hList: SeoHeading[] = raw.headings.map((h, i) => ({ ...h, order: i }));
  const h1s = hList.filter((h) => h.level === 1);
  const headingIssues: string[] = [];
  const hasH1 = h1s.length > 0;

  if (!hasH1) {
    headingIssues.push("No H1 tag found");
    addIssue("critical", "Headings", "Missing H1 tag", "Every page should have exactly one H1 tag for SEO.", 10);
  } else if (h1s.length > 1) {
    headingIssues.push(`Multiple H1 tags found (${h1s.length})`);
    addIssue("warning", "Headings", "Multiple H1 tags", `Found ${h1s.length} H1 tags. Best practice is exactly one H1 per page.`, 5);
  } else {
    issues.push({ id: `seo-${++issueId}`, severity: "pass", category: "Headings", title: "Single H1 tag present", description: `H1: "${h1s[0].text.slice(0, 80)}"` });
  }

  // Check hierarchy
  let hierarchyValid = true;
  for (let i = 1; i < hList.length; i++) {
    if (hList[i].level > hList[i - 1].level + 1) {
      hierarchyValid = false;
      headingIssues.push(`Heading hierarchy skips levels (H${hList[i - 1].level} → H${hList[i].level})`);
      break;
    }
  }
  if (!hierarchyValid) {
    addIssue("warning", "Headings", "Heading hierarchy broken", "Heading levels skip (e.g., H2 → H4). Maintain sequential hierarchy.", 3);
  }

  // ── Links ───────────────────────────────────────────────────
  const linkIssues: string[] = [];
  if (raw.links.withoutText > 0) {
    linkIssues.push(`${raw.links.withoutText} link(s) without anchor text`);
    addIssue("warning", "Links", "Links missing anchor text", `${raw.links.withoutText} links have no descriptive text. This hurts SEO and accessibility.`, 3);
  }
  if (raw.links.internal === 0) {
    linkIssues.push("No internal links found");
    addIssue("warning", "Links", "No internal links", "Internal linking helps search engines discover and rank pages.", 5);
  }

  // ── Images ──────────────────────────────────────────────────
  const imageIssues: string[] = [];
  if (raw.images.withoutAlt > 0) {
    imageIssues.push(`${raw.images.withoutAlt} image(s) missing alt text`);
    const penalty = raw.images.withoutAlt > 5 ? 8 : 4;
    addIssue("warning", "Images", "Images missing alt text", `${raw.images.withoutAlt} of ${raw.images.total} images lack alt attributes. Alt text is crucial for SEO and accessibility.`, penalty);
  } else if (raw.images.total > 0) {
    issues.push({ id: `seo-${++issueId}`, severity: "pass", category: "Images", title: "All images have alt text", description: `All ${raw.images.total} images have alt attributes.` });
  }

  // ── Open Graph ──────────────────────────────────────────────
  const ogMissing: string[] = [];
  if (!raw.og.title) ogMissing.push("og:title");
  if (!raw.og.description) ogMissing.push("og:description");
  if (!raw.og.image) ogMissing.push("og:image");
  if (!raw.og.url) ogMissing.push("og:url");
  if (!raw.og.type) ogMissing.push("og:type");

  if (ogMissing.length > 0) {
    const penalty = ogMissing.length >= 3 ? 8 : 4;
    addIssue("warning", "Open Graph", "Missing Open Graph tags", `Missing: ${ogMissing.join(", ")}. These are important for social media sharing.`, penalty);
  } else {
    issues.push({ id: `seo-${++issueId}`, severity: "pass", category: "Open Graph", title: "Open Graph tags complete", description: "All essential OG tags are present." });
  }

  const openGraph: SeoOpenGraph = {
    title: raw.og.title,
    description: raw.og.description,
    image: raw.og.image,
    url: raw.og.url,
    type: raw.og.type,
    siteName: raw.og.site_name,
    missing: ogMissing,
  };

  // ── Twitter Card ────────────────────────────────────────────
  const twMissing: string[] = [];
  if (!raw.twitter.card) twMissing.push("twitter:card");
  if (!raw.twitter.title) twMissing.push("twitter:title");
  if (!raw.twitter.description) twMissing.push("twitter:description");
  if (!raw.twitter.image) twMissing.push("twitter:image");

  if (twMissing.length > 0) {
    addIssue("info", "Twitter Card", "Incomplete Twitter Card tags", `Missing: ${twMissing.join(", ")}. Add these for better Twitter/X previews.`, 0);
  } else {
    issues.push({ id: `seo-${++issueId}`, severity: "pass", category: "Twitter Card", title: "Twitter Card tags complete", description: "All Twitter Card tags are present." });
  }

  const twitterCard: SeoTwitterCard = {
    card: raw.twitter.card,
    title: raw.twitter.title,
    description: raw.twitter.description,
    image: raw.twitter.image,
    missing: twMissing,
  };

  // ── Meta tags collection ────────────────────────────────────
  const metaTags: SeoMetaTag[] = [];

  metaTags.push({
    name: "charset",
    content: raw.charset || "Not specified",
    status: raw.charset ? "good" : "warning",
    recommendation: raw.charset ? undefined : "Add <meta charset=\"UTF-8\"> to the <head>.",
  });

  for (const tag of raw.metaTags) {
    const n = tag.name.toLowerCase();
    if (["description", "viewport", "robots"].includes(n)) continue; // handled separately
    let status: SeoMetaTag["status"] = "info";
    if (n.startsWith("og:") || n.startsWith("twitter:")) status = "good";
    metaTags.push({ name: tag.name, content: tag.content.slice(0, 300), status });
  }

  // ── Robots ──────────────────────────────────────────────────
  let robotsIndex = true;
  let robotsFollow = true;
  if (raw.robots) {
    const lower = raw.robots.toLowerCase();
    if (lower.includes("noindex")) {
      robotsIndex = false;
      addIssue("critical", "Robots", "Page set to noindex", "This page will NOT appear in search results due to noindex directive.", 15);
    }
    if (lower.includes("nofollow")) {
      robotsFollow = false;
      addIssue("warning", "Robots", "Page set to nofollow", "Links on this page won't pass SEO value due to nofollow directive.", 5);
    }
  }

  // ── Viewport ────────────────────────────────────────────────
  if (!raw.viewport) {
    addIssue("critical", "Viewport", "Missing viewport meta tag", "Without a viewport tag, the page won't be mobile-friendly. This impacts mobile SEO ranking.", 10);
  } else {
    issues.push({ id: `seo-${++issueId}`, severity: "pass", category: "Viewport", title: "Viewport tag present", description: `viewport: ${raw.viewport}` });
  }

  // ── Language ────────────────────────────────────────────────
  if (!raw.lang) {
    addIssue("warning", "Language", "Missing lang attribute", "The <html> tag has no lang attribute. Add lang=\"en\" (or your language) for SEO and accessibility.", 3);
  } else {
    issues.push({ id: `seo-${++issueId}`, severity: "pass", category: "Language", title: "Language attribute set", description: `lang="${raw.lang}"` });
  }

  // ── HTTPS ───────────────────────────────────────────────────
  if (!raw.isHttps) {
    addIssue("critical", "Security", "Page not served over HTTPS", "HTTPS is a confirmed Google ranking signal. Migrate to HTTPS to improve SEO and user trust.", 10);
  } else {
    issues.push({ id: `seo-${++issueId}`, severity: "pass", category: "Security", title: "HTTPS enabled", description: "Page is served over a secure HTTPS connection." });
  }

  // ── Favicon ─────────────────────────────────────────────────
  if (!raw.favicon) {
    addIssue("warning", "Favicon", "Missing favicon", "No favicon link found. A favicon improves brand recognition in browser tabs and bookmarks.", 3);
  } else {
    issues.push({ id: `seo-${++issueId}`, severity: "pass", category: "Favicon", title: "Favicon present", description: "A favicon link tag is defined." });
  }

  // ── Structured Data ─────────────────────────────────────────
  if (!raw.structuredData.hasJsonLd) {
    addIssue("info", "Structured Data", "No JSON-LD structured data", "Adding schema.org structured data (JSON-LD) can enhance search result snippets.", 0);
  } else {
    issues.push({
      id: `seo-${++issueId}`,
      severity: "pass",
      category: "Structured Data",
      title: "Structured data found",
      description: `${raw.structuredData.count} JSON-LD block(s): ${raw.structuredData.types.join(", ") || "unknown types"}`,
    });
  }

  score = Math.max(0, Math.min(100, score));

  const passCount = issues.filter((i) => i.severity === "pass").length;
  const critCount = issues.filter((i) => i.severity === "critical").length;
  const warnCount = issues.filter((i) => i.severity === "warning").length;

  return {
    url: pageUrl,
    score,
    title: { value: raw.title, length: titleLen, status: titleStatus },
    metaDescription: { value: raw.metaDescription, length: descLen, status: descStatus },
    canonical: { url: raw.canonical || undefined, isValid: canonicalValid, issue: canonicalIssue },
    headings: { headings: hList, hasH1, h1Count: h1s.length, hierarchyValid, issues: headingIssues },
    links: {
      internal: raw.links.internal,
      external: raw.links.external,
      broken: [],
      noFollow: raw.links.noFollow,
      withoutText: raw.links.withoutText,
      issues: linkIssues,
    },
    images: {
      total: raw.images.total,
      withAlt: raw.images.withAlt,
      withoutAlt: raw.images.withoutAlt,
      largeImages: raw.images.large,
      issues: imageIssues,
    },
    openGraph,
    twitterCard,
    metaTags,
    structuredData: raw.structuredData,
    robots: { index: robotsIndex, follow: robotsFollow, raw: raw.robots || undefined },
    viewport: { hasTag: !!raw.viewport, content: raw.viewport || undefined },
    language: { hasLang: !!raw.lang, value: raw.lang || undefined },
    issues,
    summary: `SEO Score ${score}/100. ${passCount} passed, ${critCount} critical, ${warnCount} warnings.`,
  };
}

// ── Scan a single device ──────────────────────────────────────

async function scanDevice(
  browser: Awaited<ReturnType<typeof launchBrowser>>,
  device: DeviceProfile,
  targetUrl: string
): Promise<DeviceSeoResult> {
  const context = await browser.newContext(getStealthContextOptions(device));
  const page = await context.newPage();
  await applyStealthScripts(page);

  const nav = await stealthGoto(page, targetUrl, { waitUntil: "domcontentloaded", timeout: 60000 });
  if (!nav.success) {
    await context.close();
    throw new Error(
      `Blocked by ${nav.challengeDetected} on ${targetUrl}. The site requires interactive CAPTCHA.`
    );
  }

  // Brief wait for images to load for alt-text analysis
  await page.waitForTimeout(500);

  const raw: RawSeoData = await page.evaluate(extractSeoData, targetUrl);

  const screenshotBuf = await page.screenshot({ fullPage: true, type: "jpeg", quality: 70 });
  const screenshot = `data:image/jpeg;base64,${screenshotBuf.toString("base64")}`;

  await context.close();

  return { device, screenshot, data: analyzeSeo(raw, targetUrl) };
}



// ── POST handler ──────────────────────────────────────────────

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
