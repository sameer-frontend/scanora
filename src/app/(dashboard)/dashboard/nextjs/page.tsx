"use client";

import { Suspense, lazy, useState } from "react";
import {
  Code2,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Info,
  Image as ImageIcon,
  Layers,
  Cpu,
  RotateCcw,
  Globe
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScanLoadingState, ScanErrorState } from "@/components/dashboard/scan-states";
import { ScanForm } from "@/components/dashboard/scan-form";
import { useScan } from "@/lib/scan-context";
import { cn } from "@/lib/utils";

const ScoreRing = lazy(() =>
  import("@/components/dashboard/score-ring").then((m) => ({ default: m.ScoreRing }))
);

const severityConfig: Record<string, { icon: typeof CheckCircle2; color: string; bg: string; border: string }> = {
  critical: { icon: XCircle, color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/20" },
  warning: { icon: AlertTriangle, color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20" },
  info: { icon: Info, color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20" },
  pass: { icon: CheckCircle2, color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
};

const categoryIcons: Record<string, typeof Code2> = {
  "image-optimization": ImageIcon,
  "component-pattern": Layers,
  hydration: Cpu,
  rendering: Globe,
  bundle: Code2,
  config: Code2,
};

type FilterTab = "all" | "critical" | "warning" | "info" | "pass";

export default function NextJsPage() {
  const {
    nextJsAnalysis: analysis,
    nextJsLoading: loading,
    nextJsError: error,
    fetchNextJsInsights,
    clearNextJsInsights,
  } = useScan();

  const [filterTab, setFilterTab] = useState<FilterTab>("all");

  if (!analysis && !loading && !error) {
    return (
      <ScanForm
        onScan={fetchNextJsInsights}
        scanning={loading}
        accentColor="cyan"
        icon={Code2}
        title="Next.js Insights"
        description="Analyze a Next.js application for image optimization, hydration, rendering mode, and bundle patterns."
        hideDevicePicker
        showAdvancedOptions={false}
      />
    );
  }

  if (loading) {
    return (
      <ScanLoadingState
        accentColor="cyan"
        title="Analyzing Next.js Patterns…"
        description="Scanning for image optimization, hydration payload, component patterns, and bundle efficiency."
      />
    );
  }

  if (error) {
    return (
      <ScanErrorState
        error={error}
        onRetry={clearNextJsInsights}
        onNewUrl={fetchNextJsInsights}
      />
    );
  }

  if (!analysis) return null;

  // Not a Next.js site
  if (!analysis.isNextJs) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] sm:min-h-[50vh] md:h-[60vh] text-center px-4">
        <div className="flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-2xl border border-amber-500/20 bg-amber-500/10 mb-4">
          <AlertTriangle className="h-7 w-7 sm:h-8 sm:w-8 text-amber-400" />
        </div>
        <h2 className="text-lg sm:text-xl font-bold text-white mb-2">Not a Next.js Website</h2>
        <p className="text-slate-400 text-sm max-w-md mb-6">
          The scanned website does not appear to be built with Next.js. Please enter a URL of a website that is built using Next.js to get insights.
        </p>
        <Button variant="outline" size="sm" onClick={clearNextJsInsights}>
          <RotateCcw className="h-4 w-4 mr-1" /> Try Another URL
        </Button>
      </div>
    );
  }

  const insights = analysis.insights;
  const filtered = filterTab === "all" ? insights : insights.filter((i) => i.severity === filterTab);
  const critCount = insights.filter((i) => i.severity === "critical").length;
  const warnCount = insights.filter((i) => i.severity === "warning").length;
  const infoCount = insights.filter((i) => i.severity === "info").length;
  const passCount = insights.filter((i) => i.severity === "pass").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 border border-cyan-500/20">
            <Code2 className="h-5 w-5 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white">Next.js Insights</h1>
            <p className="text-slate-400 text-xs sm:text-sm">Next.js detected</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={clearNextJsInsights}>
          <RotateCcw className="h-4 w-4 mr-1" /> New Scan
        </Button>
      </div>

      {/* Score + Stats */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        <div>
          <Card className="h-full">
            <CardContent className="flex flex-col items-center justify-center p-6">
              <div className="text-xs font-medium uppercase tracking-wider text-slate-400 mb-3">
                Next.js Score
              </div>
              <Suspense fallback={<div className="h-35 w-35 animate-pulse rounded-full bg-slate-800/40" />}>
                <ScoreRing score={analysis.score} size={140} />
              </Suspense>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-3">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            <Card>
              <CardContent className="p-3 text-center">
                <div className="text-2xl font-bold text-white">{analysis.stats.totalImages}</div>
                <div className="text-[10px] text-slate-500">Total Images</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 text-center">
                <div className="text-2xl font-bold text-emerald-400">{analysis.stats.nextImages}</div>
                <div className="text-[10px] text-slate-500">next/image</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 text-center">
                <div className={cn("text-2xl font-bold", analysis.stats.unoptimizedImages > 0 ? "text-red-400" : "text-slate-500")}>
                  {analysis.stats.unoptimizedImages}
                </div>
                <div className="text-[10px] text-slate-500">Unoptimized</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 text-center">
                <div className="text-2xl font-bold text-cyan-400">{analysis.stats.bundleChunks}</div>
                <div className="text-[10px] text-slate-500">JS Chunks</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 text-center">
                <div className="text-2xl font-bold text-violet-400">
                  {analysis.stats.hydrationSize > 1024 ? `${(analysis.stats.hydrationSize / 1024).toFixed(0)}K` : analysis.stats.hydrationSize}
                </div>
                <div className="text-[10px] text-slate-500">Hydration Size</div>
              </CardContent>
            </Card>

          </div>
        </div>
      </div>

      {/* Insights */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Insights</CardTitle>
            <Badge variant="secondary">{insights.length} checks</Badge>
          </div>
          <div className="flex gap-2 mt-3 flex-wrap">
            {([
              ["all", "All", insights.length],
              ["critical", "Critical", critCount],
              ["warning", "Warnings", warnCount],
              ["info", "Info", infoCount],
              ["pass", "Passed", passCount],
            ] as [FilterTab, string, number][]).map(([tab, label, count]) => (
              <button
                key={tab}
                onClick={() => setFilterTab(tab)}
                className={cn(
                  "rounded-md px-3 py-1.5 text-xs font-medium transition-all border",
                  filterTab === tab
                    ? "bg-cyan-500/10 border-cyan-500/25 text-cyan-400"
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
            {filtered.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-4">No issues in this category.</p>
            ) : (
              filtered.map((insight) => {
                const cfg = severityConfig[insight.severity] || severityConfig.info;
                const SevIcon = cfg.icon;
                const CatIcon = categoryIcons[insight.category] || Code2;
                return (
                  <div key={insight.id} className={cn("rounded-lg border p-4", cfg.border, cfg.bg)}>
                    <div className="flex items-start gap-3">
                      <SevIcon className={cn("h-4 w-4 mt-0.5 shrink-0", cfg.color)} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="text-sm font-medium text-white">{insight.title}</span>
                          <Badge variant="secondary" className="text-[10px] gap-1">
                            <CatIcon className="h-3 w-3" />
                            {insight.category.replace("-", " ")}
                          </Badge>
                          {insight.savings && (
                            <Badge variant="success" className="text-[10px]">
                              Save {insight.savings}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-white">{insight.description}</p>
                        {insight.recommendation && (
                          <p className="text-xs text-emerald-400 mt-1">💡 {insight.recommendation}</p>
                        )}
                        {insight.element && (
                          <div className="mt-2 rounded-md bg-slate-900/60 px-3 py-2 text-xs font-mono text-slate-300 break-all max-h-20 overflow-y-auto">
                            {insight.element}
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
