/**
 * Browser helpers for Playwright: stealth configuration and captcha/challenge bypass.
 * Used by all API scan routes to handle Cloudflare, Google reCAPTCHA, and similar bot protections.
 */

import type { Page, BrowserContext, Browser } from "playwright-core";
import { chromium } from "playwright-core";

/**
 * Stealth browser context options to avoid bot detection.
 * Removes common Playwright/automation fingerprints.
 */
export function getStealthArgs(): string[] {
  return [
    "--disable-blink-features=AutomationControlled",
    "--disable-features=IsolateOrigins,site-per-process",
    "--no-first-run",
    "--no-default-browser-check",
    "--disable-infobars",
    "--window-size=1920,1080",
  ];
}

/**
 * Launch Chromium in a way that works both locally and on Vercel serverless.
 * Uses @sparticuz/chromium on Vercel, falls back to local Chromium for development.
 */
export async function launchBrowser(): Promise<Browser> {
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    const sparticuzChromium = (await import("@sparticuz/chromium")).default;
    return chromium.launch({
      args: [...sparticuzChromium.args, ...getStealthArgs()],
      executablePath: await sparticuzChromium.executablePath(),
      headless: true,
    });
  }
  return chromium.launch({ headless: true, args: getStealthArgs() });
}

/**
 * Apply stealth patches to a page to evade bot detection.
 * Must be called BEFORE page.goto().
 */
export async function applyStealthScripts(page: Page): Promise<void> {
  await page.addInitScript(() => {
    // Override navigator.webdriver
    Object.defineProperty(navigator, "webdriver", {
      get: () => false,
    });

    // Override chrome property
    const w = window as unknown as Record<string, unknown>;
    w.chrome = {
      runtime: {},
      loadTimes: function () {},
      csi: function () {},
      app: {},
    };

    // Override permissions query
    const originalQuery = window.navigator.permissions.query;
    window.navigator.permissions.query = (parameters: PermissionDescriptor) =>
      parameters.name === "notifications"
        ? Promise.resolve({ state: Notification.permission, onchange: null } as PermissionStatus)
        : originalQuery(parameters);

    // Override plugins length
    Object.defineProperty(navigator, "plugins", {
      get: () => [1, 2, 3, 4, 5],
    });

    // Override languages
    Object.defineProperty(navigator, "languages", {
      get: () => ["en-US", "en"],
    });
  });
}

/** Known challenge page patterns */
const CHALLENGE_PATTERNS = [
  // Cloudflare
  { selector: "#challenge-running", name: "Cloudflare Challenge" },
  { selector: "#challenge-stage", name: "Cloudflare Challenge" },
  { selector: "#cf-challenge-running", name: "Cloudflare Challenge" },
  { selector: ".cf-browser-verification", name: "Cloudflare Verification" },
  { selector: "#cf-wrapper", name: "Cloudflare Protection" },
  // Generic CAPTCHA
  { selector: ".g-recaptcha", name: "Google reCAPTCHA" },
  { selector: "#captcha-form", name: "CAPTCHA" },
  { selector: "[data-hcaptcha-sitekey]", name: "hCaptcha" },
  { selector: ".h-captcha", name: "hCaptcha" },
];

/**
 * Detect if the current page is showing a bot challenge / CAPTCHA.
 * Returns the challenge name if detected, or null.
 */
export async function detectChallenge(page: Page): Promise<string | null> {
  for (const pattern of CHALLENGE_PATTERNS) {
    const el = await page.$(pattern.selector);
    if (el) return pattern.name;
  }

  // Check page title for common challenge indicators
  const title = await page.title();
  if (/just a moment|attention required|checking your browser/i.test(title)) {
    return "Cloudflare Challenge";
  }

  return null;
}

/**
 * Wait for a challenge page to resolve automatically.
 * Cloudflare's "Just a moment" typically resolves within ~5 seconds.
 * Returns true if the challenge was bypassed, false if it persists (requires manual CAPTCHA).
 */
export async function waitForChallengeBypass(
  page: Page,
  maxWaitMs = 15000
): Promise<boolean> {
  const challenge = await detectChallenge(page);
  if (!challenge) return true; // No challenge detected

  const startTime = Date.now();
  const checkInterval = 1000;

  while (Date.now() - startTime < maxWaitMs) {
    await page.waitForTimeout(checkInterval);

    // Check if challenge is still present
    const stillBlocked = await detectChallenge(page);
    if (!stillBlocked) return true; // Challenge resolved

    // Check if the page navigated (challenge redirect)
    const currentTitle = await page.title();
    if (!/just a moment|attention required|checking your browser/i.test(currentTitle)) {
      // Title changed — likely resolved
      await page.waitForTimeout(1000); // brief settle
      return true;
    }
  }

  return false; // Challenge persisted — likely requires interactive CAPTCHA
}

/**
 * Navigate to a URL with stealth and challenge bypass.
 * This wraps page.goto with challenge detection and waiting.
 * Returns an object indicating success and any challenge info.
 */
export async function stealthGoto(
  page: Page,
  url: string,
  options: { waitUntil?: "load" | "domcontentloaded" | "networkidle"; timeout?: number } = {}
): Promise<{ success: boolean; challengeDetected: string | null }> {
  const { waitUntil = "domcontentloaded", timeout = 60000 } = options;

  try {
    await page.goto(url, { waitUntil, timeout });
  } catch (navError) {
    const msg = navError instanceof Error ? navError.message : "";
    if (msg.includes("chrome-error") || msg.includes("ERR_") || msg.includes("net::")) {
      throw new Error(`Could not load ${url}: ${msg.split("Call log")[0].trim()}`);
    }
    // Retry with less strict wait
    try {
      await page.goto(url, { waitUntil: "domcontentloaded", timeout });
    } catch {
      throw new Error(`Could not load ${url} after retry`);
    }
  }

  // Check for challenge page
  const challenge = await detectChallenge(page);
  if (challenge) {
    const bypassed = await waitForChallengeBypass(page);
    if (!bypassed) {
      return { success: false, challengeDetected: challenge };
    }
    // After bypass, wait for the actual page to settle
    try {
      await page.waitForLoadState("networkidle", { timeout: 15000 });
    } catch {
      await page.waitForTimeout(2000);
    }
    return { success: true, challengeDetected: challenge };
  }

  return { success: true, challengeDetected: null };
}

/**
 * Create a stealth browser context with proper anti-detection settings.
 */
export function getStealthContextOptions(device: {
  userAgent?: string;
  width: number;
  height: number;
  deviceScaleFactor: number;
  isMobile: boolean;
}) {
  return {
    userAgent:
      device.userAgent ||
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    viewport: { width: device.width, height: device.height },
    deviceScaleFactor: device.deviceScaleFactor,
    isMobile: device.isMobile,
    ignoreHTTPSErrors: true,
    serviceWorkers: "block" as const,
    locale: "en-US",
    timezoneId: "America/New_York",
    javaScriptEnabled: true,
  };
}
