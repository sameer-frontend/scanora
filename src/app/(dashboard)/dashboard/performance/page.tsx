"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import {
  Zap,
  Image as ImageIcon,
  FileCode2,
  Download,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Globe,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { WebGuardScoreRing } from "@/components/dashboard/score-ring";
import { ScanEmptyState, ScanLoadingState, ScanErrorState } from "@/components/dashboard/scan-states";
import { DeviceTabs } from "@/components/dashboard/device-tabs";
import { ScreenshotCard } from "@/components/dashboard/screenshot-card";
import { CrossDeviceComparison } from "@/components/dashboard/cross-device-comparison";
import { useScan } from "@/lib/scan-context";
import { fadeUp } from "@/lib/constants";
import type { DeviceType, DevicePerformanceResult, PerformanceData, AssetFile } from "@/lib/types";
import { cn } from "@/lib/utils";

const ratingColors: Record<string, { text: string; bg: string; border: string }> = {
  good: { text: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
  "needs-improvement": { text: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20" },
  poor: { text: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/20" },
};

const assetConfig: Record<string, { icon: typeof FileCode2; color: string; gradient: string }> = {
  scripts: { icon: FileCode2, color: "text-amber-400", gradient: "from-amber-500 to-yellow-500" },
  stylesheets: { icon: FileCode2, color: "text-blue-400", gradient: "from-blue-500 to-indigo-500" },
  images: { icon: ImageIcon, color: "text-violet-400", gradient: "from-violet-500 to-purple-500" },
  fonts: { icon: FileCode2, color: "text-cyan-400", gradient: "from-cyan-500 to-teal-500" },
  other: { icon: FileCode2, color: "text-slate-400", gradient: "from-slate-500 to-slate-400" },
};

const assetLabels: Record<string, string> = {
  scripts: "JavaScript",
  stylesheets: "CSS",
  images: "Images",
  fonts: "Fonts",
  other: "Other",
};

/* ── Per-page performance detail sections ─────────────────────── */
function PagePerfSections({ pageData }: { pageData: PerformanceData }) {
  const [expandedAssets, setExpandedAssets] = useState<Set<string>>(new Set());

  const vitals = [
    { name: "LCP", fullName: "Largest Contentful Paint", threshold: "≤ 2.5s", ...pageData.coreWebVitals.lcp },
    { name: "FCP", fullName: "First Contentful Paint", threshold: "≤ 1.8s", ...pageData.coreWebVitals.fcp },
    { name: "TBT", fullName: "Total Blocking Time", threshold: "≤ 200ms", ...pageData.coreWebVitals.tbt },
    { name: "CLS", fullName: "Cumulative Layout Shift", threshold: "≤ 0.1", ...pageData.coreWebVitals.cls },
  ];

  const totalSizeBytes = Object.values(pageData.assets).reduce((s, a) => s + a.sizeBytes, 0);

  return (
    <div className="space-y-4">
      {/* Score + Summary */}
      <div className="flex items-center gap-4 rounded-lg border border-slate-800/50 bg-slate-800/20 p-4">
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-white mb-1">Performance Score</div>
          <p className="text-sm line-clamp-2">{pageData.summary}</p>
        </div>
        <div className="grid grid-cols-2 gap-2 text-center shrink-0">
          <div className="rounded-md bg-slate-900/60 px-3 py-1.5">
            <div className="text-sm font-bold text-white">{pageData.metrics.loadTime}ms</div>
            <div className="text-xs text-white">Load</div>
          </div>
          <div className="rounded-md bg-slate-900/60 px-3 py-1.5">
            <div className="text-sm font-bold text-white">{totalSizeBytes < 1024 * 1024 ? `${(totalSizeBytes / 1024).toFixed(0)} KB` : `${(totalSizeBytes / (1024 * 1024)).toFixed(1)} MB`}</div>
            <div className="text-xs text-white">Size</div>
          </div>
        </div>
      </div>

      {/* Core Web Vitals */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {vitals.map((vital) => {
          const rating = ratingColors[vital.rating] ?? ratingColors.good;
          return (
            <div key={vital.name} className="rounded-lg border border-slate-800/50 bg-slate-800/20 p-3">
              <div className="flex items-center justify-between mb-1">
                <Badge variant={vital.rating === "good" ? "success" : "warning"} className="text-[10px]">
                  {vital.rating === "good" ? <CheckCircle2 className="h-3 w-3 mr-1" /> : <AlertTriangle className="h-3 w-3 mr-1" />}
                  {vital.rating.replace("-", " ")}
                </Badge>
                <span className="text-xs text-white">{vital.threshold}</span>
              </div>
              <div className="text-xs mt-1">{vital.name}</div>
              <div className={cn("text-xl font-bold", rating.text)}>{vital.value}</div>
              <div className="text-xs text-white">{vital.fullName}</div>
            </div>
          );
        })}
      </div>

      {/* Timing Metrics */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: "TTFB", value: `${pageData.metrics.ttfb}ms`, sub: "Time to First Byte" },
          { label: "DOM Ready", value: `${pageData.metrics.domContentLoaded}ms`, sub: "DOM Content Loaded" },
          { label: "Full Load", value: `${pageData.metrics.loadTime}ms`, sub: "Total Load Time" },
          {
            label: "Page Size",
            value: totalSizeBytes < 1024 * 1024
              ? `${(totalSizeBytes / 1024).toFixed(0)} KB`
              : `${(totalSizeBytes / (1024 * 1024)).toFixed(1)} MB`,
            sub: "Total Transfer Size",
          },
        ].map((m) => (
          <div key={m.label} className="rounded-lg border border-slate-800/50 bg-slate-800/20 p-3">
            <div className="text-lg font-bold text-white">{m.value}</div>
            <div className="text-xs mt-0.5">{m.sub}</div>
          </div>
        ))}
      </div>

      {/* Opportunities */}
      {pageData.opportunities.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="h-4 w-4 text-amber-400" />
            <span className="text-sm font-medium text-white">Optimization Opportunities</span>
            <Badge variant="secondary" className="text-xs">{pageData.opportunities.length}</Badge>
          </div>
          {pageData.opportunities.map((opp, i) => (
            <div key={i} className="rounded-lg border border-slate-800/50 bg-slate-800/20 p-3 hover:bg-slate-800/40 transition-colors">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-sm font-medium text-white">{opp.title}</h4>
                    <Badge variant={opp.impact === "high" ? "destructive" : opp.impact === "medium" ? "warning" : "secondary"}>
                      {opp.impact}
                    </Badge>
                  </div>
                  <p className="text-xs">{opp.description}</p>
                </div>
                {opp.savings && (
                  <div className="text-right shrink-0">
                    <div className="text-sm font-bold text-emerald-400">-{opp.savings}</div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Asset Breakdown */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {(Object.keys(pageData.assets) as (keyof typeof pageData.assets)[]).map((key) => {
          const asset = pageData.assets[key];
          const cfg = assetConfig[key] ?? assetConfig.other;
          const AssetIcon = cfg.icon;
          const pct = totalSizeBytes > 0 ? Math.round((asset.sizeBytes / totalSizeBytes) * 100) : 0;
          const isExpanded = expandedAssets.has(key);
          const files: AssetFile[] = asset.files ?? [];
          return (
            <div key={key} className="rounded-lg border border-slate-800/50 bg-slate-800/20 p-3">
              <div className="flex items-center gap-2 mb-1">
                <AssetIcon className={cn("h-4 w-4", cfg.color)} />
                <span className="text-xs">{assetLabels[key] ?? key}</span>
              </div>
              <div className="text-sm font-bold text-white">{asset.size}</div>
              <div className="text-xs">{asset.count} file{asset.count !== 1 ? "s" : ""}</div>
              <div className="my-2 h-1 rounded-full bg-slate-800 overflow-hidden">
                <div className={cn("h-full rounded-full bg-linear-to-r", cfg.gradient)} style={{ width: `${pct}%` }} />
              </div>
              {files.length > 0 && (
                <>
                  <button
                    onClick={() => {
                      const next = new Set(expandedAssets);
                      if (isExpanded) next.delete(key); else next.add(key);
                      setExpandedAssets(next);
                    }}
                    className="mt-1 flex items-center gap-1 text-xs hover:text-white transition-colors"
                  >
                    {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                    {isExpanded ? "Hide" : "Show"}
                  </button>
                  {isExpanded && (
                    <div className="mt-1 space-y-1 max-h-36 overflow-y-auto">
                      {files.map((file, i) => (
                        <div key={i} className="flex items-center justify-between gap-1 rounded-md bg-slate-900/60 px-2 py-1 text-xs">
                          <span className="truncate" title={file.name}>{file.name}</span>
                          <span className={cn("shrink-0 font-mono", i === 0 ? "text-amber-400" : "text-white")}>{file.size}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function PerformancePage() {
  const {
    performanceData: results,
    performanceLoading: loading,
    performanceStreaming: streaming,
    performanceError: error,
    scanMode,
  } = useScan();

  const [activeDevice, setActiveDevice] = useState<DeviceType | null>(null);
  const [screenshotOpen, setScreenshotOpen] = useState(false);
  const [expandedAssets, setExpandedAssets] = useState<Set<string>>(new Set());

  const currentDevice = activeDevice ?? results?.[0]?.device.type ?? null;
  const activeResult: DevicePerformanceResult | undefined =
    results?.find((r) => r.device.type === currentDevice);

  // Empty state
  if (!results && !loading && !error) {
    return (
      <ScanEmptyState
        icon={Zap}
        accentColor="cyan"
        description='Enter a URL in the sidebar and click "New Scan" to run a Playwright-powered performance audit across devices.'
      />
    );
  }

  // Loading
  if (loading) {
    return (
      <ScanLoadingState
        accentColor="cyan"
        title="Measuring Performance…"
        description="Playwright is loading the page on multiple devices and collecting real performance metrics."
      >
        {scanMode === "full-site" && (
          <p className="text-cyan-400/80 text-xs mt-3">
            Full-site crawl in progress &#8212; scanning all discovered pages&#8230;
          </p>
        )}
      </ScanLoadingState>
    );
  }

  // Error
  if (error) {
    return <ScanErrorState error={error} />;
  }

  if (!results || !activeResult) return null;

  const data = activeResult.data;
  const isMultiPage = !!(activeResult.pages && activeResult.pages.length > 1);
  const avgScore = isMultiPage
    ? Math.round(activeResult.pages!.reduce((s, p) => s + p.data.score, 0) / activeResult.pages!.length)
    : data.score;

  const vitals = [
    { name: "LCP", fullName: "Largest Contentful Paint", threshold: "≤ 2.5s", ...data.coreWebVitals.lcp },
    { name: "FCP", fullName: "First Contentful Paint", threshold: "≤ 1.8s", ...data.coreWebVitals.fcp },
    { name: "TBT", fullName: "Total Blocking Time", threshold: "≤ 200ms", ...data.coreWebVitals.tbt },
    { name: "CLS", fullName: "Cumulative Layout Shift", threshold: "≤ 0.1", ...data.coreWebVitals.cls },
  ];

  const totalSizeBytes = Object.values(data.assets).reduce((s, a) => s + a.sizeBytes, 0);

  return (
    <motion.div initial="hidden" animate="visible" className="space-y-6">
      {/* Header */}
      <motion.div variants={fadeUp} custom={0} className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 border border-cyan-500/20">
            <Zap className="h-5 w-5 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Performance Optimizer</h1>
            <p className="text-slate-400 text-sm">Real metrics via Playwright · Multi-device · Core Web Vitals</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-1" /> Export
          </Button>
        </div>
      </motion.div>

      {/* Device Tabs */}
      <motion.div variants={fadeUp} custom={1}>
        <DeviceTabs
          results={results}
          currentDevice={currentDevice}
          onDeviceChange={setActiveDevice}
          accentColor="cyan"
        />
      </motion.div>

      {
        !isMultiPage && !streaming && (
          <>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
              {/* Screenshot */}
              <motion.div variants={fadeUp} custom={2} className="lg:col-span-2">
                <ScreenshotCard
                  screenshot={activeResult.screenshot}
                  deviceName={activeResult.device.name}
                  deviceType={activeResult.device.type}
                  altText={`Screenshot of ${data.url} on ${activeResult.device.name}`}
                  accentColor="cyan"
                  screenshotOpen={screenshotOpen}
                  onToggleScreenshot={() => setScreenshotOpen(!screenshotOpen)}
                  collapsedMaxH="max-h-70"
                />
              </motion.div>

              {/* Score */}
              <motion.div variants={fadeUp} custom={3}>
                <Card className="h-full">
                  <CardContent className="flex flex-col items-center justify-center p-6">
                    <div className="text-xs font-medium uppercase tracking-wider text-slate-400 mb-3">
                      {isMultiPage ? "Avg Performance" : "Performance Score"}
                    </div>
                    <WebGuardScoreRing score={avgScore} size={140} />
                    <div className="mt-4 flex items-center gap-1.5 text-xs text-slate-400">
                      <Clock className="h-3.5 w-3.5" />
                      Load: {data.metrics.loadTime}ms
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Vitals column */}
              <motion.div variants={fadeUp} custom={4} className="space-y-3">
                {vitals.map((vital) => {
                  const rating = ratingColors[vital.rating] ?? ratingColors.good;
                  return (
                    <Card key={vital.name} className="h-auto">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-1">
                          <Badge variant={vital.rating === "good" ? "success" : "warning"} className="text-[10px]">
                            {vital.rating === "good" ? <CheckCircle2 className="h-3 w-3 mr-1" /> : <AlertTriangle className="h-3 w-3 mr-1" />}
                            {vital.rating.replace("-", " ")}
                          </Badge>
                          <span className="text-[10px] text-slate-500">{vital.threshold}</span>
                        </div>
                        <div className="text-xs text-slate-400 mt-1">{vital.name}</div>
                        <div className={`text-2xl font-bold ${rating.text}`}>{vital.value}</div>
                        <div className="text-[10px] text-slate-500">{vital.fullName}</div>
                      </CardContent>
                    </Card>
                  );
                })}
              </motion.div>
            </div>
            <motion.div variants={fadeUp} custom={5}>
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                {[
                  { label: "TTFB", value: `${data.metrics.ttfb}ms`, sub: "Time to First Byte" },
                  { label: "DOM Ready", value: `${data.metrics.domContentLoaded}ms`, sub: "DOM Content Loaded" },
                  { label: "Full Load", value: `${data.metrics.loadTime}ms`, sub: "Total Load Time" },
                  {
                    label: "Page Size",
                    value: totalSizeBytes < 1024 * 1024
                      ? `${(totalSizeBytes / 1024).toFixed(0)} KB`
                      : `${(totalSizeBytes / (1024 * 1024)).toFixed(1)} MB`,
                    sub: "Total Transfer Size",
                  },
                ].map((m) => (
                  <Card key={m.label}>
                    <CardContent className="p-4">
                      <div className="text-2xl font-bold text-white">{m.value}</div>
                      <div className="text-xs text-slate-400 mt-1">{m.sub}</div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </motion.div>
          </>
        )
      }

      {/* Cross-device Comparison */}
      {results.length > 1 && (
        <motion.div variants={fadeUp} custom={6}>
          <CrossDeviceComparison
            results={results}
            currentDevice={currentDevice}
            onDeviceChange={setActiveDevice}
            accentColor="cyan"
            renderDetails={(r) => (
              <div className="mt-2 space-y-0.5 text-[10px]">
                <div className="flex justify-between text-slate-400">
                  <span>LCP</span>
                  <span className={ratingColors[r.data.coreWebVitals.lcp.rating]?.text}>{r.data.coreWebVitals.lcp.value}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>FCP</span>
                  <span className={ratingColors[r.data.coreWebVitals.fcp.rating]?.text}>{r.data.coreWebVitals.fcp.value}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>TBT</span>
                  <span className={ratingColors[r.data.coreWebVitals.tbt.rating]?.text}>{r.data.coreWebVitals.tbt.value}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>CLS</span>
                  <span className={ratingColors[r.data.coreWebVitals.cls.rating]?.text}>{r.data.coreWebVitals.cls.value}</span>
                </div>
              </div>
            )}
          />
        </motion.div>
      )}

      {/* Page-by-Page Results — expanded detail per page */}
      {(isMultiPage || streaming) && (
        <motion.div variants={fadeUp} custom={6.5} className="space-y-6">
          <div className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-cyan-400" />
            <h2 className="text-lg font-bold text-white">Page-by-Page Results</h2>
            <Badge variant="secondary">{activeResult.pages?.length ?? 0} pages scanned</Badge>
          </div>
          {activeResult.pages?.map((pg) => (
            <Card key={pg.url} className="overflow-hidden">
              <CardHeader className="pb-3 border-b border-slate-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <Globe className="h-4 w-4 text-cyan-400 shrink-0" />
                    <span className="text-sm font-medium text-white truncate">{pg.url}</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <PagePerfSections pageData={pg.data} />
              </CardContent>
            </Card>
          ))}

          {/* Streaming loader */}
          {streaming && (
            <Card className="border-cyan-500/20 bg-cyan-500/5">
              <CardContent className="py-6">
                <div className="flex items-center justify-center gap-3">
                  <Loader2 className="h-5 w-5 text-cyan-400 animate-spin" />
                  <span className="text-sm text-cyan-300">Scanning more pages…</span>
                  <Badge variant="secondary" className="text-xs">{activeResult.pages?.length ?? 0} scanned so far</Badge>
                </div>
              </CardContent>
            </Card>
          )}
        </motion.div>
      )}

      {/* Opportunities */}
      {
        !isMultiPage && !streaming && data.opportunities.length > 0 && (
          <motion.div variants={fadeUp} custom={7}>
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-amber-400" />
                    <CardTitle className="text-lg">Optimization Opportunities</CardTitle>
                  </div>
                  <Badge variant="secondary">
                    {data.opportunities.length} suggestion{data.opportunities.length !== 1 ? "s" : ""}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.opportunities.map((opp, i) => (
                    <div
                      key={i}
                      className="rounded-lg border border-slate-800/50 bg-slate-800/20 p-4 hover:bg-slate-800/40 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="text-sm font-medium text-white">{opp.title}</h4>
                            <Badge
                              variant={opp.impact === "high" ? "destructive" : opp.impact === "medium" ? "warning" : "secondary"}
                            >
                              {opp.impact} impact
                            </Badge>
                          </div>
                          <p className="text-xs text-slate-400">{opp.description}</p>
                        </div>
                        {opp.savings && (
                          <div className="text-right shrink-0">
                            <div className="text-sm font-bold text-emerald-400">-{opp.savings}</div>
                            <div className="text-xs text-slate-500">estimated</div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )
      }

      {/* Asset Breakdown */}
      {
        !isMultiPage && !streaming && (
          <motion.div variants={fadeUp} custom={8}>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Asset Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
                  {(Object.keys(data.assets) as (keyof typeof data.assets)[]).map((key) => {
                    const asset = data.assets[key];
                    const cfg = assetConfig[key] ?? assetConfig.other;
                    const AssetIcon = cfg.icon;
                    const pct = totalSizeBytes > 0 ? Math.round((asset.sizeBytes / totalSizeBytes) * 100) : 0;
                    const isExpanded = expandedAssets.has(key);
                    const files: AssetFile[] = asset.files ?? [];
                    return (
                      <div key={key} className="rounded-lg border border-slate-800/50 bg-slate-800/20 p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <AssetIcon className={`h-4 w-4 ${cfg.color}`} />
                          <span className="text-sm text-slate-300">{assetLabels[key] ?? key}</span>
                        </div>
                        <div className="text-lg font-bold text-white">{asset.size}</div>
                        <div className="text-xs text-slate-500">{asset.count} file{asset.count !== 1 ? "s" : ""}</div>
                        <div className="mt-2 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                          <div
                            className={`h-full rounded-full bg-linear-to-r ${cfg.gradient}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        {files.length > 0 && (
                          <>
                            <button
                              onClick={() => {
                                const next = new Set(expandedAssets);
                                if (isExpanded) next.delete(key);
                                else next.add(key);
                                setExpandedAssets(next);
                              }}
                              className="mt-2 flex items-center gap-1 text-[11px] text-slate-400 hover:text-white transition-colors"
                            >
                              {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                              {isExpanded ? "Hide files" : "Show files"}
                            </button>
                            {isExpanded && (
                              <div className="mt-2 space-y-1.5 max-h-48 overflow-y-auto">
                                {files.map((file, i) => (
                                  <div
                                    key={i}
                                    className="flex items-center justify-between gap-2 rounded-md bg-slate-900/60 px-2 py-1.5 text-[11px]"
                                  >
                                    <div className="flex-1 min-w-0">
                                      <div className="text-slate-300 font-medium truncate" title={file.name}>
                                        {file.name}
                                      </div>
                                      {file.url && (
                                        <a
                                          href={file.url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-slate-500 truncate block hover:text-emerald-400 transition-colors"
                                          title={file.url}
                                        >
                                          <ExternalLink className="h-2.5 w-2.5 inline mr-0.5" />
                                          {file.url.length > 40 ? file.url.slice(0, 40) + "…" : file.url}
                                        </a>
                                      )}
                                    </div>
                                    <span className={cn(
                                      "shrink-0 font-mono",
                                      i === 0 ? "text-amber-400" : "text-slate-500"
                                    )}>
                                      {file.size}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )
      }
    </motion.div>
  );
}
