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
  screenshot: string | null; // base64 data URI or null if capture failed
  data: AccessibilityData;
}

export interface DevicePerformanceResult {
  device: DeviceProfile;
  screenshot: string | null; // base64 data URI or null if capture failed
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

// ── Multi-Run Averaging types ──────────────────────────────────

export interface MultiRunStats {
  runs: number;
  scores: number[];
  average: number;
  best: number;
  worst: number;
  variance: number;
  standardDeviation: number;
  metricAverages?: Record<string, number>;
}

export interface MultiRunPerformanceResult {
  device: DeviceProfile;
  screenshot: string;
  stats: MultiRunStats;
  runs: PerformanceData[];
  averagedData: PerformanceData;
}

export interface MultiRunAccessibilityResult {
  device: DeviceProfile;
  screenshot: string;
  stats: MultiRunStats;
  runs: AccessibilityData[];
  averagedData: AccessibilityData;
}

// ── Device Throttling Profiles ────────────────────────────────

export type ThrottleProfile = "low-end-android" | "mid-range-android" | "iphone" | "desktop-high" | "custom";

export interface ThrottlePreset {
  id: ThrottleProfile;
  label: string;
  icon: string;
  cpuSlowdown: number;
  networkProfile: string;
  description: string;
}

export const THROTTLE_PRESETS: ThrottlePreset[] = [
  { id: "low-end-android", label: "Low-end Android", icon: "📱", cpuSlowdown: 6, networkProfile: "slow-3g", description: "Moto G4 · Slow 3G · 6× CPU" },
  { id: "mid-range-android", label: "Mid-range Android", icon: "📱", cpuSlowdown: 4, networkProfile: "slow-4g", description: "Pixel 5 · Slow 4G · 4× CPU" },
  { id: "iphone", label: "iPhone", icon: "📱", cpuSlowdown: 2, networkProfile: "4g", description: "iPhone 15 · 4G LTE · 2× CPU" },
  { id: "desktop-high", label: "Desktop High-end", icon: "🖥️", cpuSlowdown: 1, networkProfile: "cable", description: "Fast desktop · Cable · No throttle" },
];

// ── Core Web Vitals Timeline ──────────────────────────────────

export interface TimelineEvent {
  label: string;
  time: number;
  type: "fcp" | "lcp" | "cls" | "inp" | "ttfb" | "dom" | "load" | "long-task";
  rating?: "good" | "needs-improvement" | "poor";
  value?: string;
}

export interface CWVTimeline {
  events: TimelineEvent[];
  totalDuration: number;
  layoutShifts: { time: number; value: number; element?: string }[];
  longTasks: { start: number; duration: number }[];
  inp: CoreWebVital;
}

// ── Bundle Analyzer ───────────────────────────────────────────

export interface BundleChunk {
  name: string;
  size: number;
  gzipSize: number;
  type: "js" | "css" | "image" | "font" | "other";
  isFirstLoad: boolean;
  route?: string;
}

export type TechCategory =
  | "framework"
  | "cms"
  | "cdn"
  | "analytics"
  | "library"
  | "ui"
  | "build-tool"
  | "hosting"
  | "font-service"
  | "security"
  | "other";

export interface DetectedTechnology {
  name: string;
  category: TechCategory;
  version?: string;
  confidence: number;  // 0–100
  website?: string;
}

export interface BundleAnalysis {
  url: string;
  totalJsSize: number;
  totalCssSize: number;
  totalTransferSize: number;
  chunks: BundleChunk[];
  unusedJs: { url: string; totalBytes: number; unusedBytes: number; percentUnused: number }[];
  duplicateModules: { name: string; count: number; totalSize: number }[];
  treemapData: { name: string; size: number; children?: { name: string; size: number }[] }[];
  technologies: DetectedTechnology[];
}

// ── SEO Deep Audit ────────────────────────────────────────────

export interface StructuredDataValidation {
  type: string;
  isValid: boolean;
  errors: string[];
  warnings: string[];
  fields: Record<string, unknown>;
}

export interface InternalLink {
  from: string;
  to: string;
  text: string;
  status?: number;
}

export interface KeywordAnalysis {
  keyword: string;
  count: number;
  density: number;
  inTitle: boolean;
  inH1: boolean;
  inMetaDescription: boolean;
  inUrl: boolean;
}

export interface BrokenLink {
  url: string;
  statusCode: number;
  anchorText: string;
  foundOn: string;
}

export interface SeoDeepAudit {
  structuredDataValidation: StructuredDataValidation[];
  internalLinks: InternalLink[];
  keywords: KeywordAnalysis[];
  brokenLinks: BrokenLink[];
  contentStats: {
    wordCount: number;
    readingTime: number;
    paragraphCount: number;
    avgSentenceLength: number;
  };
}

// ── Next.js Specific Insights ─────────────────────────────────

export interface NextJsInsight {
  id: string;
  category: "image-optimization" | "component-pattern" | "hydration" | "rendering" | "bundle" | "config";
  severity: "critical" | "warning" | "info" | "pass";
  title: string;
  description: string;
  recommendation?: string;
  element?: string;
  savings?: string;
}

export interface NextJsAnalysis {
  url: string;
  isNextJs: boolean;
  version?: string;
  renderingMode?: "static" | "dynamic" | "isr" | "mixed";
  insights: NextJsInsight[];
  stats: {
    totalImages: number;
    nextImages: number;
    unoptimizedImages: number;
    clientComponents: number;
    serverIndicators: number;
    hydrationSize: number;
    bundleChunks: number;
  };
  score: number;
}

// ── A/B Performance Testing ───────────────────────────────────

export interface ABComparisonResult {
  urlA: { url: string; performance: PerformanceData; screenshot: string };
  urlB: { url: string; performance: PerformanceData; screenshot: string };
  comparison: {
    scoreDiff: number;
    lcpDiff: number;
    fcpDiff: number;
    clsDiff: number;
    tbtDiff: number;
    totalSizeDiff: number;
    winner: "A" | "B" | "tie";
    improvementAreas: { metric: string; percentChange: number; improved: boolean }[];
  };
}
