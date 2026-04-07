"use client";
import { Suspense, lazy, useState } from "react";
import {
  Search,
  Download,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Info,
  FileText,
  Heading1,
  Link2,
  ImageIcon,
  Share2,
  Code2,
  Globe,
  Eye,
  ExternalLink,
  Tag,
  Smartphone,
  RotateCcw,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScanLoadingState, ScanErrorState } from "@/components/dashboard/scan-states";
import { ScanForm } from "@/components/dashboard/scan-form";
import { useScan } from "@/lib/scan-context";
import type { DeviceSeoResult, SeoData, SeoDeepAudit } from "@/lib/types";
import { cn } from "@/lib/utils";

const ScoreRing = lazy(() => import("@/components/dashboard/score-ring").then(m => ({ default: m.ScoreRing })));
const ScreenshotCard = lazy(() => import("@/components/dashboard/screenshot-card").then(m => ({ default: m.ScreenshotCard })));

function LazyFallback() {
  return <div className="h-32 animate-pulse rounded-xl bg-slate-800/40" />;
}

const severityConfig: Record<string, { icon: typeof CheckCircle2; color: string; bg: string; border: string; label: string }> = {
  critical: { icon: XCircle, color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/20", label: "Critical" },
  warning: { icon: AlertTriangle, color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20", label: "Warning" },
  info: { icon: Info, color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20", label: "Info" },
  pass: { icon: CheckCircle2, color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20", label: "Passed" },
};

const statusColors: Record<string, string> = {
  good: "text-emerald-400",
  warning: "text-amber-400",
  error: "text-red-400",
};

type FilterTab = "all" | "critical" | "warning" | "info" | "pass";

/* Per-page SEO detail sections */
function PageSeoSections({
  pageData,
}: {
  pageData: SeoData;
}) {
  const [auditTab, setAuditTab] = useState<FilterTab>("all");

  const issues = pageData.issues;
  const filteredIssues = auditTab === "all" ? issues : issues.filter((i) => i.severity === auditTab);
  const critCount = issues.filter((i) => i.severity === "critical").length;
  const warnCount = issues.filter((i) => i.severity === "warning").length;
  const infoCount = issues.filter((i) => i.severity === "info").length;
  const passCount = issues.filter((i) => i.severity === "pass").length;

  return (
    <div className="space-y-4">
      {/* Heading Structure */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <Heading1 className="h-5 w-5 text-orange-400" />
              <CardTitle className="text-base">Heading Structure</CardTitle>
              {!pageData.headings.hasH1 && <Badge variant="destructive" className="text-[10px]">No H1</Badge>}
              {!pageData.headings.hierarchyValid && <Badge variant="warning" className="text-[10px]">Broken Hierarchy</Badge>}
              {pageData.headings.hasH1 && pageData.headings.h1Count === 1 && pageData.headings.hierarchyValid && (
                <Badge variant="success" className="text-[10px]">Valid</Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {pageData.headings.headings.length === 0 ? (
            <p className="text-sm text-slate-500">No headings found on the page.</p>
          ) : (
            <div className="space-y-1">
              {pageData.headings.headings.map((h, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-slate-800/30"
                  style={{ paddingLeft: `${(h.level - 1) * 20 + 8}px` }}
                >
                  <Badge
                    variant={h.level === 1 ? "success" : "secondary"}
                    className="text-[10px] shrink-0 w-8 justify-center"
                  >
                    H{h.level}
                  </Badge>
                  <span className="text-sm text-slate-300 truncate">{h.text}</span>
                </div>
              ))}
            </div>
          )}
          {pageData.headings.issues.length > 0 && (
            <div className="mt-3 space-y-1">
              {pageData.headings.issues.map((issue, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-amber-400">
                  <AlertTriangle className="h-3 w-3 shrink-0" /> {issue}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Open Graph and Twitter Card */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <Share2 className="h-5 w-5 text-orange-400" />
                <CardTitle className="text-base">Open Graph</CardTitle>
                <Badge variant={pageData.openGraph.missing.length === 0 ? "success" : "warning"} className="text-[10px]">
                  {5 - pageData.openGraph.missing.length}/5
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {([
                ["og:title", pageData.openGraph.title],
                ["og:description", pageData.openGraph.description],
                ["og:image", pageData.openGraph.image],
                ["og:url", pageData.openGraph.url],
                ["og:type", pageData.openGraph.type],
                ["og:site_name", pageData.openGraph.siteName],
              ] as [string, string | undefined][]).map(([name, value]) => (
                <div key={name} className="flex items-start gap-2 rounded-md bg-slate-800/20 px-3 py-2">
                  <span className="text-xs font-mono text-slate-500 shrink-0 w-28">{name}</span>
                  {value ? (
                    name === "og:image" ? (
                      <a href={value} target="_blank" rel="noopener noreferrer" className="text-xs text-emerald-400 truncate hover:underline flex items-center gap-1">
                        <ExternalLink className="h-3 w-3 shrink-0" />{value.slice(0, 60)}
                      </a>
                    ) : (
                      <span className="text-xs text-slate-300 truncate">{value}</span>
                    )
                  ) : (
                    <span className="text-xs text-red-400">Missing</span>
                  )}
                </div>
              ))}
            </div>
            {pageData.openGraph.image && (
              <div className="mt-3 rounded-lg overflow-hidden border border-slate-800">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={pageData.openGraph.image} alt="OG Image Preview" className="w-full h-auto max-h-48 object-contain" />
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <Share2 className="h-5 w-5 text-orange-400" />
                <CardTitle className="text-base">Twitter / X Card</CardTitle>
                <Badge variant={pageData.twitterCard.missing.length === 0 ? "success" : "warning"} className="text-[10px]">
                  {4 - pageData.twitterCard.missing.length}/4
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {([
                ["twitter:card", pageData.twitterCard.card],
                ["twitter:title", pageData.twitterCard.title],
                ["twitter:description", pageData.twitterCard.description],
                ["twitter:image", pageData.twitterCard.image],
              ] as [string, string | undefined][]).map(([name, value]) => (
                <div key={name} className="flex items-start gap-2 rounded-md bg-slate-800/20 px-3 py-2">
                  <span className="text-xs font-mono text-slate-500 shrink-0 w-32">{name}</span>
                  {value ? (
                    <span className="text-xs text-slate-300 truncate">{value}</span>
                  ) : (
                    <span className="text-xs text-red-400">Missing</span>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Links and Images */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Link2 className="h-5 w-5 text-orange-400" />
              <CardTitle className="text-base">Link Analysis</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-slate-800/30 p-3 text-center">
                <div className="text-2xl font-bold text-emerald-400">{pageData.links.internal}</div>
                <div className="text-[10px] text-slate-500">Internal Links</div>
              </div>
              <div className="rounded-lg bg-slate-800/30 p-3 text-center">
                <div className="text-2xl font-bold text-blue-400">{pageData.links.external}</div>
                <div className="text-[10px] text-slate-500">External Links</div>
              </div>
              <div className="rounded-lg bg-slate-800/30 p-3 text-center">
                <div className={cn("text-2xl font-bold", pageData.links.noFollow > 0 ? "text-amber-400" : "text-slate-500")}>{pageData.links.noFollow}</div>
                <div className="text-[10px] text-slate-500">Nofollow</div>
              </div>
              <div className="rounded-lg bg-slate-800/30 p-3 text-center">
                <div className={cn("text-2xl font-bold", pageData.links.withoutText > 0 ? "text-red-400" : "text-slate-500")}>{pageData.links.withoutText}</div>
                <div className="text-[10px] text-slate-500">No Anchor Text</div>
              </div>
            </div>
            {pageData.links.issues.length > 0 && (
              <div className="mt-3 space-y-1">
                {pageData.links.issues.map((issue, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-amber-400">
                    <AlertTriangle className="h-3 w-3 shrink-0" /> {issue}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5 text-orange-400" />
              <CardTitle className="text-base">Image Analysis</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              <div className="rounded-lg bg-slate-800/30 p-2 sm:p-3 text-center">
                <div className="text-xl sm:text-2xl font-bold text-white">{pageData.images.total}</div>
                <div className="text-[10px] text-slate-500">Total</div>
              </div>
              <div className="rounded-lg bg-slate-800/30 p-3 text-center">
                <div className="text-2xl font-bold text-emerald-400">{pageData.images.withAlt}</div>
                <div className="text-[10px] text-slate-500">With Alt</div>
              </div>
              <div className="rounded-lg bg-slate-800/30 p-3 text-center">
                <div className={cn("text-2xl font-bold", pageData.images.withoutAlt > 0 ? "text-red-400" : "text-slate-500")}>{pageData.images.withoutAlt}</div>
                <div className="text-[10px] text-slate-500">Missing Alt</div>
              </div>
            </div>
            {pageData.images.total > 0 && (
              <div className="mt-3">
                <div className="flex items-center justify-between text-xs text-white mb-1">
                  <span>Alt text coverage</span>
                  <span className={pageData.images.withoutAlt === 0 ? "text-emerald-400" : "text-amber-400"}>
                    {pageData.images.total > 0 ? Math.round((pageData.images.withAlt / pageData.images.total) * 100) : 100}%
                  </span>
                </div>
                <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all",
                      pageData.images.withoutAlt === 0 ? "bg-emerald-500" : "bg-amber-500"
                    )}
                    style={{ width: `${pageData.images.total > 0 ? (pageData.images.withAlt / pageData.images.total) * 100 : 100}%` }}
                  />
                </div>
              </div>
            )}
            {pageData.images.issues.length > 0 && (
              <div className="mt-3 space-y-1">
                {pageData.images.issues.map((issue, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-amber-400">
                    <AlertTriangle className="h-3 w-3 shrink-0" /> {issue}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Technical SEO Row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Globe className="h-4 w-4 text-orange-400" />
              <span className="text-xs font-medium text-white">Canonical URL</span>
            </div>
            {pageData.canonical.url ? (
              <a href={pageData.canonical.url} target="_blank" rel="noopener noreferrer" className="text-xs text-emerald-400 hover:underline break-all">
                {pageData.canonical.url}
              </a>
            ) : (
              <span className="text-xs text-red-400">Not set</span>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Smartphone className="h-4 w-4 text-orange-400" />
              <span className="text-xs font-medium text-white">Viewport</span>
            </div>
            {pageData.viewport.hasTag ? (
              <span className="text-xs text-emerald-400">{pageData.viewport.content}</span>
            ) : (
              <span className="text-xs text-red-400">Missing</span>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Globe className="h-4 w-4 text-orange-400" />
              <span className="text-xs font-medium text-white">Language</span>
            </div>
            {pageData.language.hasLang ? (
              <span className="text-xs text-emerald-400">lang=&quot;{pageData.language.value}&quot;</span>
            ) : (
              <span className="text-xs text-red-400">Missing lang attribute</span>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Code2 className="h-4 w-4 text-orange-400" />
              <span className="text-xs font-medium text-white">Structured Data</span>
            </div>
            {pageData.structuredData.hasJsonLd ? (
              <div>
                <span className="text-xs text-emerald-400">{pageData.structuredData.count} JSON-LD block(s)</span>
                {pageData.structuredData.types.length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {pageData.structuredData.types.map((t, i) => (
                      <Badge key={i} variant="secondary" className="text-[10px]">{t}</Badge>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <span className="text-xs text-slate-500">No structured data</span>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Meta Tags */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <Tag className="h-5 w-5 text-orange-400" />
              <CardTitle className="text-base">All Meta Tags</CardTitle>
              <Badge variant="secondary" className="text-[10px]">{pageData.metaTags.length}</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {pageData.metaTags.length === 0 ? (
            <p className="text-sm text-slate-500">No meta tags found.</p>
          ) : (
            <div className="space-y-1 max-h-64 overflow-y-auto">
              {pageData.metaTags.map((tag, i) => (
                <div key={i} className="flex items-start gap-3 rounded-md bg-slate-800/20 px-3 py-2">
                  <span className="text-xs font-mono text-slate-500 shrink-0 min-w-32 truncate">{tag.name}</span>
                  <span className="text-xs text-slate-300 flex-1 break-all">{tag.content}</span>
                  {tag.status === "good" && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />}
                  {tag.status === "warning" && <AlertTriangle className="h-3.5 w-3.5 text-amber-400 shrink-0" />}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Audit Results */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">SEO Audit Results</CardTitle>
            <Badge variant="secondary">{issues.length} checks</Badge>
          </div>
          <div className="flex gap-2 mt-3 flex-wrap">
            {([
              ["all", "All", issues.length],
              ["critical", "Critical", critCount],
              ["warning", "Warnings", warnCount],
              ["info", "Info", infoCount],
              ["pass", "Passed", passCount],
            ] as [FilterTab, string, number][]).map(([tab, label, count]) => (
              <button
                key={tab}
                onClick={() => setAuditTab(tab)}
                className={cn(
                  "rounded-md px-3 py-1.5 text-xs font-medium transition-all border",
                  auditTab === tab
                    ? "bg-orange-500/10 border-orange-500/25 text-orange-400"
                    : "bg-slate-900/50 border-slate-800 text-white hover:text-white"
                )}
              >
                {label} ({count})
              </button>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {filteredIssues.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-4">No issues in this category.</p>
            ) : (
              filteredIssues.map((issue) => {
                const cfg = severityConfig[issue.severity] ?? severityConfig.info;
                const SevIcon = cfg.icon;
                return (
                  <div key={issue.id} className={cn("rounded-lg border p-4", cfg.border, cfg.bg)}>
                    <div className="flex items-start gap-3">
                      <SevIcon className={cn("h-4 w-4 mt-0.5 shrink-0", cfg.color)} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="text-sm font-medium text-white">{issue.title}</span>
                          <Badge variant="secondary" className="text-[10px]">{issue.category}</Badge>
                        </div>
                        <p className="text-xs text-white">{issue.description}</p>
                        {issue.value && (
                          <div className="mt-2 rounded-md bg-slate-900/60 px-3 py-2 text-xs font-mono text-slate-300 break-all max-h-20 overflow-y-auto">
                            {issue.value}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* Main SEO page */
export default function SeoPage() {
  const {
    seoData: results,
    seoLoading: loading,
    seoError: error,
    seoScannedUrl: scannedUrl,
    scanSeo,
    accessibilityData,
    performanceData,
    clearSeo,
    seoDeepAudit,
  } = useScan();

  const [screenshotOpen, setScreenshotOpen] = useState(false);

  const activeResult: DeviceSeoResult | undefined = results?.[0];

  // Empty state
  if (!results && !loading && !error) {
    return (
      <ScanForm
        onScan={scanSeo}
        scanning={loading}
        accentColor="orange"
        icon={Search}
        title="SEO Audit"
        description="Enter a URL to run a comprehensive SEO analysis including meta tags, headings, Open Graph, and structured data."
        scannedUrl={scannedUrl}
        hideDevicePicker
        showAdvancedOptions={false}
      />
    );
  }

  // Loading
  if (loading) {
    return (
      <ScanLoadingState
        accentColor="orange"
        title="Analyzing SEO&#8230;"
        description="Scanning meta tags, headings, Open Graph, structured data, and more."
      />
    );
  }

  // Error
  if (error) {
    return (
      <ScanErrorState
        error={error}
        onRetry={clearSeo}
        onNewUrl={scanSeo}
      />
    );
  }

  if (!results || !activeResult) return null;

  const data = activeResult.data;

  const critCount = data.issues.filter((i) => i.severity === "critical").length;
  const warnCount = data.issues.filter((i) => i.severity === "warning").length;
  const infoCount = data.issues.filter((i) => i.severity === "info").length;
  const passCount = data.issues.filter((i) => i.severity === "pass").length;
  const avgScore = data.score;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/10 border border-orange-500/20">
            <Search className="h-5 w-5 text-orange-400" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white">SEO Analyzer</h1>
            <p className="text-white text-xs sm:text-sm">Meta &#183; Headings &#183; Open Graph &#183; Structured Data &#183; Links &#183; Images</p>
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button variant="outline" size="sm" onClick={clearSeo}>
            <RotateCcw className="h-4 w-4 mr-1" /> Try New Scan
          </Button>
          <Button variant="outline" size="sm" onClick={() => {
            import("@/lib/export-pdf").then(({ exportPdfReport }) =>
              exportPdfReport({ url: scannedUrl, scope: "seo", accessibilityData, performanceData, seoData: results })
            );
          }}>
            <Download className="h-4 w-4 mr-1" /> Export PDF
          </Button>
        </div>
      </div>

      {/* Score + Screenshot + Key Info */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        {/* Screenshot */}
        <div className="lg:col-span-2">
          <Suspense fallback={<LazyFallback />}>
            <ScreenshotCard
              screenshot={activeResult.screenshot}
              deviceName={activeResult.device.name}
              deviceType={activeResult.device.type}
              altText={`Screenshot of ${data.url}`}
              accentColor="orange"
              screenshotOpen={screenshotOpen}
              onToggleScreenshot={() => setScreenshotOpen(!screenshotOpen)}
              collapsedMaxH="max-h-70"
              showDownload={false}
            />
          </Suspense>
        </div>

        {/* Score */}
        <div>
          <Card className="h-full">
            <CardContent className="flex flex-col items-center justify-center p-6">
              <div className="text-xs font-medium uppercase tracking-wider text-white mb-3">
                SEO Score
              </div>
              <Suspense fallback={<div className="h-35 w-35 animate-pulse rounded-full bg-slate-800/40" />}>
                <ScoreRing score={avgScore} size={140} />
              </Suspense>
              <div className="mt-4 grid grid-cols-2 gap-2 w-full text-center text-xs">
                <div className="rounded-md bg-red-500/10 border border-red-500/20 p-1.5">
                  <div className="text-red-400 font-bold">{critCount}</div>
                  <div className="text-white">Critical</div>
                </div>
                <div className="rounded-md bg-amber-500/10 border border-amber-500/20 p-1.5">
                  <div className="text-amber-400 font-bold">{warnCount}</div>
                  <div className="text-white">Warnings</div>
                </div>
                <div className="rounded-md bg-blue-500/10 border border-blue-500/20 p-1.5">
                  <div className="text-blue-400 font-bold">{infoCount}</div>
                  <div className="text-white">Info</div>
                </div>
                <div className="rounded-md bg-emerald-500/10 border border-emerald-500/20 p-1.5">
                  <div className="text-emerald-400 font-bold">{passCount}</div>
                  <div className="text-white">Passed</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Key SEO Elements */}
        <div className="space-y-3">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <FileText className="h-4 w-4 text-orange-400" />
                <span className="text-xs font-medium text-white">Title Tag</span>
                <span className={cn("text-xs font-bold ml-auto", statusColors[data.title.status])}>
                  {data.title.length} chars
                </span>
              </div>
              <p className="text-sm text-white line-clamp-2">{data.title.value || "\u2014"}</p>
              <div className="mt-1 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all",
                    data.title.status === "good" ? "bg-emerald-500" : data.title.status === "warning" ? "bg-amber-500" : "bg-red-500"
                  )}
                  style={{ width: `${Math.min(100, (data.title.length / 60) * 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-slate-600 mt-0.5">
                <span>0</span><span>30</span><span>60</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <Tag className="h-4 w-4 text-orange-400" />
                <span className="text-xs font-medium text-white">Meta Description</span>
                <span className={cn("text-xs font-bold ml-auto", statusColors[data.metaDescription.status])}>
                  {data.metaDescription.length} chars
                </span>
              </div>
              <p className="text-xs text-slate-300 line-clamp-3">{data.metaDescription.value || "\u2014 Missing \u2014"}</p>
              <div className="mt-1 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all",
                    data.metaDescription.status === "good" ? "bg-emerald-500" : data.metaDescription.status === "warning" ? "bg-amber-500" : "bg-red-500"
                  )}
                  style={{ width: `${Math.min(100, (data.metaDescription.length / 160) * 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-slate-600 mt-0.5">
                <span>0</span><span>120</span><span>160</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Quick Stats Row */}
      <div>
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-6">
          {[
            { label: "Headings", value: data.headings.headings.length.toString(), icon: Heading1, ok: data.headings.hasH1 && data.headings.hierarchyValid },
            { label: "Links", value: `${data.links.internal + data.links.external}`, icon: Link2, ok: data.links.issues.length === 0 },
            { label: "Images", value: data.images.total.toString(), icon: ImageIcon, ok: data.images.withoutAlt === 0 },
            { label: "Open Graph", value: `${5 - data.openGraph.missing.length}/5`, icon: Share2, ok: data.openGraph.missing.length === 0 },
            { label: "Schema", value: data.structuredData.hasJsonLd ? `${data.structuredData.count}` : "None", icon: Code2, ok: data.structuredData.hasJsonLd },
            { label: "Robots", value: data.robots.index ? "Indexable" : "Noindex", icon: Eye, ok: data.robots.index },
          ].map((stat) => (
            <Card key={stat.label}>
              <CardContent className="p-4 flex items-center gap-3">
                <div className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-lg",
                  stat.ok ? "bg-emerald-500/10" : "bg-amber-500/10"
                )}>
                  <stat.icon className={cn("h-4 w-4", stat.ok ? "text-emerald-400" : "text-amber-400")} />
                </div>
                <div>
                  <div className="text-lg font-bold text-white">{stat.value}</div>
                  <div className="text-[10px] text-slate-500">{stat.label}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Per-page detail sections */}
      <div>
        <PageSeoSections
          pageData={data}
        />
      </div>

      {/* Deep Audit Sections */}
      {seoDeepAudit && <DeepAuditSections deepAudit={seoDeepAudit} />}

    </div>
  );
}

/* Deep Audit additional sections */
function DeepAuditSections({ deepAudit }: { deepAudit: SeoDeepAudit }) {
  return (
    <div className="space-y-4 mt-6">
      {/* Content Stats */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-orange-400" />
            <CardTitle className="text-base">Content Analysis</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-lg bg-slate-800/30 p-3 text-center">
              <div className="text-2xl font-bold text-white">{deepAudit.contentStats.wordCount.toLocaleString()}</div>
              <div className="text-[10px] text-slate-500">Words</div>
            </div>
            <div className="rounded-lg bg-slate-800/30 p-3 text-center">
              <div className="text-2xl font-bold text-white">{deepAudit.contentStats.readingTime} min</div>
              <div className="text-[10px] text-slate-500">Reading Time</div>
            </div>
            <div className="rounded-lg bg-slate-800/30 p-3 text-center">
              <div className="text-2xl font-bold text-white">{deepAudit.contentStats.paragraphCount}</div>
              <div className="text-[10px] text-slate-500">Paragraphs</div>
            </div>
            <div className="rounded-lg bg-slate-800/30 p-3 text-center">
              <div className="text-2xl font-bold text-white">{deepAudit.contentStats.avgSentenceLength}</div>
              <div className="text-[10px] text-slate-500">Avg Sentence Len</div>
            </div>
          </div>
          {deepAudit.contentStats.wordCount < 300 && (
            <div className="mt-3 flex items-center gap-2 text-xs text-amber-400">
              <AlertTriangle className="h-3 w-3 shrink-0" />
              Content is thin ({deepAudit.contentStats.wordCount} words). Aim for 300+ words for better SEO.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Keyword Analysis */}
      {deepAudit.keywords.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Search className="h-5 w-5 text-orange-400" />
              <CardTitle className="text-base">Top Keywords</CardTitle>
              <Badge variant="secondary" className="text-[10px]">{deepAudit.keywords.length}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-1.5">
              {deepAudit.keywords.slice(0, 15).map((kw, i) => (
                <div key={i} className="flex items-center gap-2 rounded-md bg-slate-800/20 px-3 py-2">
                  <span className="text-xs font-mono text-white font-medium flex-1">{kw.keyword}</span>
                  <span className="text-[10px] text-slate-400">{kw.count}× ({kw.density}%)</span>
                  <div className="flex gap-1">
                    {kw.inTitle && <Badge variant="success" className="text-[9px] px-1">Title</Badge>}
                    {kw.inH1 && <Badge variant="success" className="text-[9px] px-1">H1</Badge>}
                    {kw.inMetaDescription && <Badge variant="success" className="text-[9px] px-1">Meta</Badge>}
                    {kw.inUrl && <Badge variant="success" className="text-[9px] px-1">URL</Badge>}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Structured Data Validation */}
      {deepAudit.structuredDataValidation.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Code2 className="h-5 w-5 text-orange-400" />
              <CardTitle className="text-base">Structured Data Validation</CardTitle>
              <Badge variant="secondary" className="text-[10px]">{deepAudit.structuredDataValidation.length} schemas</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {deepAudit.structuredDataValidation.map((schema, i) => (
                <div key={i} className={cn(
                  "rounded-lg border p-3",
                  schema.isValid ? "border-emerald-500/20 bg-emerald-500/5" : "border-red-500/20 bg-red-500/5"
                )}>
                  <div className="flex items-center gap-2 mb-2">
                    {schema.isValid ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-400" />
                    )}
                    <span className="text-sm font-medium text-white">{schema.type}</span>
                    <Badge variant={schema.isValid ? "success" : "destructive"} className="text-[10px]">
                      {schema.isValid ? "Valid" : "Issues Found"}
                    </Badge>
                  </div>
                  {schema.errors.length > 0 && (
                    <div className="space-y-1 mb-2">
                      {schema.errors.map((err, j) => (
                        <div key={j} className="flex items-center gap-2 text-xs text-red-400">
                          <XCircle className="h-3 w-3 shrink-0" /> {err}
                        </div>
                      ))}
                    </div>
                  )}
                  {schema.warnings.length > 0 && (
                    <div className="space-y-1">
                      {schema.warnings.map((warn, j) => (
                        <div key={j} className="flex items-center gap-2 text-xs text-amber-400">
                          <AlertTriangle className="h-3 w-3 shrink-0" /> {warn}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Internal Links */}
      {deepAudit.internalLinks.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Link2 className="h-5 w-5 text-orange-400" />
              <CardTitle className="text-base">Internal Link Map</CardTitle>
              <Badge variant="secondary" className="text-[10px]">{deepAudit.internalLinks.length} unique</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-1 max-h-64 overflow-y-auto">
              {deepAudit.internalLinks.slice(0, 50).map((link, i) => (
                <div key={i} className="flex items-center gap-2 rounded-md bg-slate-800/20 px-3 py-1.5">
                  <span className="text-xs text-emerald-400 font-mono truncate flex-1">{link.to}</span>
                  {link.text && <span className="text-[10px] text-slate-500 truncate max-w-40">{link.text}</span>}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
