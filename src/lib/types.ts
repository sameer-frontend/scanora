export type WcagPrinciple = "perceivable" | "operable" | "understandable" | "robust";

export interface AccessibilityIssue {
  id: string;
  severity: "critical" | "serious" | "moderate" | "minor";
  wcag: string;
  principle: WcagPrinciple;
  title: string;
  description: string;
  element: string;
  target: string;
  count: number;
  fix: string;
  pageUrl?: string;
  helpUrl?: string;
  wcagUrl?: string;
}

export interface AccessibilityPrinciple {
  score: number;
  issueCount: number;
}

export interface AccessibilityData {
  url: string;
  score: number;
  summary: string;
  principles: {
    perceivable: AccessibilityPrinciple;
    operable: AccessibilityPrinciple;
    understandable: AccessibilityPrinciple;
    robust: AccessibilityPrinciple;
  };
  issues: AccessibilityIssue[];
  stats: {
    critical: number;
    serious: number;
    moderate: number;
    minor: number;
  };
}

export interface CoreWebVital {
  value: string;
  numericValue: number;
  rating: "good" | "needs-improvement" | "poor";
  description: string;
}

export interface PerformanceOpportunity {
  title: string;
  savings: string;
  impact: "high" | "medium" | "low";
  description: string;
}

export interface AssetFile {
  name: string;
  url: string;
  size: string;
  sizeBytes: number;
}

export interface AssetBreakdown {
  count: number;
  size: string;
  sizeBytes: number;
  files: AssetFile[];
}

export interface PerformanceData {
  url: string;
  score: number;
  summary: string;
  metrics: {
    ttfb: number;
    fcp: number;
    lcp: number;
    tbt: number;
    cls: number;
    domContentLoaded: number;
    loadTime: number;
    totalSize: number;
  };
  coreWebVitals: {
    lcp: CoreWebVital;
    fcp: CoreWebVital;
    tbt: CoreWebVital;
    cls: CoreWebVital;
  };
  opportunities: PerformanceOpportunity[];
  assets: {
    scripts: AssetBreakdown;
    stylesheets: AssetBreakdown;
    images: AssetBreakdown;
    fonts: AssetBreakdown;
    other: AssetBreakdown;
  };
}

// ── Device / Multi-viewport types ──────────────────────────────

export type DeviceType = "mobile" | "tablet" | "laptop" | "desktop";

export interface DeviceProfile {
  name: string;
  type: DeviceType;
  width: number;
  height: number;
  deviceScaleFactor: number;
  isMobile: boolean;
  userAgent?: string;
}

export const DEVICE_PROFILES: DeviceProfile[] = [
  {
    name: "Mobile",
    type: "mobile",
    width: 375,
    height: 812,
    deviceScaleFactor: 3,
    isMobile: true,
    userAgent:
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
  },
  {
    name: "Tablet",
    type: "tablet",
    width: 768,
    height: 1024,
    deviceScaleFactor: 2,
    isMobile: true,
    userAgent:
      "Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
  },
  {
    name: "Laptop",
    type: "laptop",
    width: 1366,
    height: 768,
    deviceScaleFactor: 1,
    isMobile: false,
  },
  {
    name: "Desktop",
    type: "desktop",
    width: 1920,
    height: 1080,
    deviceScaleFactor: 1,
    isMobile: false,
  },
];

export interface DeviceAccessibilityResult {
  device: DeviceProfile;
  screenshot: string; // base64 data URI
  data: AccessibilityData;
}

export interface DevicePerformanceResult {
  device: DeviceProfile;
  screenshot: string; // base64 data URI
  data: PerformanceData;
}

// ── SEO types ──────────────────────────────────────────────────

export interface SeoMetaTag {
  name: string;
  content: string;
  status: "good" | "warning" | "error" | "info";
  recommendation?: string;
}

export interface SeoHeading {
  level: number;
  text: string;
  order: number;
}

export interface SeoHeadingAnalysis {
  headings: SeoHeading[];
  hasH1: boolean;
  h1Count: number;
  hierarchyValid: boolean;
  issues: string[];
}

export interface SeoLinkAnalysis {
  internal: number;
  external: number;
  broken: string[];
  noFollow: number;
  withoutText: number;
  issues: string[];
}

export interface SeoImageAnalysis {
  total: number;
  withAlt: number;
  withoutAlt: number;
  largeImages: { src: string; width: number; height: number }[];
  issues: string[];
}

export interface SeoOpenGraph {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: string;
  siteName?: string;
  missing: string[];
}

export interface SeoTwitterCard {
  card?: string;
  title?: string;
  description?: string;
  image?: string;
  missing: string[];
}

export interface SeoStructuredData {
  types: string[];
  count: number;
  hasJsonLd: boolean;
}

export interface SeoCanonical {
  url?: string;
  isValid: boolean;
  issue?: string;
}

export interface SeoIssue {
  id: string;
  severity: "critical" | "warning" | "info" | "pass";
  category: string;
  title: string;
  description: string;
  value?: string;
}

export interface SeoData {
  url: string;
  score: number;
  title: { value: string; length: number; status: "good" | "warning" | "error" };
  metaDescription: { value: string; length: number; status: "good" | "warning" | "error" };
  canonical: SeoCanonical;
  headings: SeoHeadingAnalysis;
  links: SeoLinkAnalysis;
  images: SeoImageAnalysis;
  openGraph: SeoOpenGraph;
  twitterCard: SeoTwitterCard;
  metaTags: SeoMetaTag[];
  structuredData: SeoStructuredData;
  robots: { index: boolean; follow: boolean; raw?: string };
  viewport: { hasTag: boolean; content?: string };
  language: { hasLang: boolean; value?: string };
  issues: SeoIssue[];
  summary: string;
}

export interface DeviceSeoResult {
  device: DeviceProfile;
  screenshot: string;
  data: SeoData;
}
