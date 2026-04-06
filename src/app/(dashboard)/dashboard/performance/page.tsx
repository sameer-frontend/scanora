"use client";
import { Suspense, lazy, useState } from "react";
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
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScanLoadingState, ScanErrorState } from "@/components/dashboard/scan-states";
import { ScanForm } from "@/components/dashboard/scan-form";
import { useScan } from "@/lib/scan-context";
import type { DeviceType, DevicePerformanceResult, AssetFile } from "@/lib/types";
import { cn } from "@/lib/utils";

const WebGuardScoreRing = lazy(() => import("@/components/dashboard/score-ring").then(m => ({ default: m.WebGuardScoreRing })));
const DeviceTabs = lazy(() => import("@/components/dashboard/device-tabs").then(m => ({ default: m.DeviceTabs })));
const ScreenshotCard = lazy(() => import("@/components/dashboard/screenshot-card").then(m => ({ default: m.ScreenshotCard })));
const CrossDeviceComparison = lazy(() => import("@/components/dashboard/cross-device-comparison").then(m => ({ default: m.CrossDeviceComparison })));

function LazyFallback() {
  return <div className="h-32 animate-pulse rounded-xl bg-slate-800/40" />;
}

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

export default function PerformancePage() {
  const {
    performanceData: results,
    performanceLoading: loading,
    performanceError: error,
    scanPerformance,
    accessibilityData,
    seoData,
    scannedUrl,
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
      <ScanForm
        onScan={scanPerformance}
        scanning={loading}
        accentColor="cyan"
        icon={Zap}
        title="Performance Audit"
        description="Enter a URL and select a device to run a Lighthouse-powered performance audit with Core Web Vitals."
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
      />
    );
  }

  // Error
  if (error) {
    return <ScanErrorState error={error} />;
  }

  if (!results || !activeResult) return null;

  const data = activeResult.data;
  const avgScore = data.score;

  const vitals = [
    { name: "LCP", fullName: "Largest Contentful Paint", threshold: "≤ 2.5s", ...data.coreWebVitals.lcp },
    { name: "FCP", fullName: "First Contentful Paint", threshold: "≤ 1.8s", ...data.coreWebVitals.fcp },
    { name: "TBT", fullName: "Total Blocking Time", threshold: "≤ 200ms", ...data.coreWebVitals.tbt },
    { name: "CLS", fullName: "Cumulative Layout Shift", threshold: "≤ 0.1", ...data.coreWebVitals.cls },
  ];

  const totalSizeBytes = Object.values(data.assets).reduce((s, a) => s + a.sizeBytes, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
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
          <Button variant="outline" size="sm" onClick={() => {
            import("@/lib/export-pdf").then(({ exportPdfReport }) =>
              exportPdfReport({ url: scannedUrl, accessibilityData, performanceData: results, seoData })
            );
          }}>
            <Download className="h-4 w-4 mr-1" /> Export PDF
          </Button>
        </div>
      </div>

      {/* Device Tabs */}
      <Suspense fallback={<LazyFallback />}>
        <DeviceTabs
          results={results}
          currentDevice={currentDevice}
          onDeviceChange={setActiveDevice}
          accentColor="cyan"
        />
      </Suspense>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        {/* Screenshot */}
        <div className="lg:col-span-2">
          <Suspense fallback={<LazyFallback />}>
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
          </Suspense>
        </div>

        {/* Score */}
        <div>
          <Card className="h-full">
            <CardContent className="flex flex-col items-center justify-center p-6">
              <div className="text-xs font-medium uppercase tracking-wider text-slate-400 mb-3">
                Performance Score
              </div>
              <Suspense fallback={<div className="h-35 w-35 animate-pulse rounded-full bg-slate-800/40" />}>
                <WebGuardScoreRing score={avgScore} size={140} />
              </Suspense>
              <div className="mt-4 flex items-center gap-1.5 text-xs text-slate-400">
                <Clock className="h-3.5 w-3.5" />
                Load: {data.metrics.loadTime}ms
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Vitals column */}
        <div className="space-y-3">
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
        </div>
      </div>

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

      {/* Cross-device Comparison */}
      {results.length > 1 && (
        <Suspense fallback={<LazyFallback />}>
          <CrossDeviceComparison
            results={results}
            currentDevice={currentDevice}
            onDeviceChange={setActiveDevice}
            accentColor="cyan"
            renderDetails={(r) => {
              const d = r as DevicePerformanceResult;
              return (
                <div className="mt-2 space-y-0.5 text-[10px]">
                  <div className="flex justify-between text-slate-400">
                    <span>LCP</span>
                    <span className={ratingColors[d.data.coreWebVitals.lcp.rating]?.text}>{d.data.coreWebVitals.lcp.value}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>FCP</span>
                    <span className={ratingColors[d.data.coreWebVitals.fcp.rating]?.text}>{d.data.coreWebVitals.fcp.value}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>TBT</span>
                    <span className={ratingColors[d.data.coreWebVitals.tbt.rating]?.text}>{d.data.coreWebVitals.tbt.value}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>CLS</span>
                    <span className={ratingColors[d.data.coreWebVitals.cls.rating]?.text}>{d.data.coreWebVitals.cls.value}</span>
                  </div>
                </div>
              );
            }}
          />
        </Suspense>
      )}

      {/* Opportunities */}
      {
        data.opportunities.length > 0 && (
          <div>
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
          </div>
        )
      }

      {/* Asset Breakdown */}
      <div>
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
      </div>
    </div>
  );
}
