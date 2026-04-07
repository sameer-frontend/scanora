"use client";

import { useState } from "react";
import {
  GitCompareArrows,
  Trophy,
  ArrowUp,
  ArrowDown,
  Minus,
  RotateCcw,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScanLoadingState, ScanErrorState } from "@/components/dashboard/scan-states";
import { useScan } from "@/lib/scan-context";
import { cn } from "@/lib/utils";

export default function ABComparePage() {
  const {
    abComparison: result,
    abLoading: loading,
    abError: error,
    runABComparison,
    clearABComparison,
  } = useScan();

  const [urlA, setUrlA] = useState("");
  const [urlB, setUrlB] = useState("");

  function handleCompare() {
    if (!urlA.trim() || !urlB.trim()) return;
    runABComparison(urlA.trim(), urlB.trim());
  }

  // Form state
  if (!result && !loading && !error) {
    return (
      <div className="flex flex-col items-center justify-center mt-10 text-center px-4">
        <div className="flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-2xl border border-violet-500/20 bg-violet-500/10 mb-4">
          <GitCompareArrows className="h-7 w-7 sm:h-8 sm:w-8 text-violet-400" />
        </div>
        <h2 className="text-lg sm:text-xl font-bold text-white mb-2">A/B Performance Compare</h2>
        <p className="text-slate-400 text-sm max-w-md mb-6 sm:mb-8">
          Compare performance of two URLs side by side. See which is faster and where improvements can be made.
        </p>

        <div className="w-full max-w-lg space-y-3">
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 flex h-5 w-5 items-center justify-center rounded-full bg-cyan-500/20 text-[10px] font-bold text-cyan-400">A</div>
            <input
              type="text"
              value={urlA}
              onChange={(e) => setUrlA(e.target.value)}
              placeholder="https://site-a.com"
              className="h-11 w-full rounded-lg border border-slate-800 bg-slate-900/50 pl-11 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-500/50 transition-colors"
            />
          </div>
          <div className="flex items-center justify-center">
            <div className="h-px flex-1 bg-slate-800" />
            <span className="px-3 text-xs text-slate-500">vs</span>
            <div className="h-px flex-1 bg-slate-800" />
          </div>
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 flex h-5 w-5 items-center justify-center rounded-full bg-orange-500/20 text-[10px] font-bold text-orange-400">B</div>
            <input
              type="text"
              value={urlB}
              onChange={(e) => setUrlB(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleCompare(); }}
              placeholder="https://site-b.com"
              className="h-11 w-full rounded-lg border border-slate-800 bg-slate-900/50 pl-11 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-500/50 transition-colors"
            />
          </div>
          <Button
            onClick={handleCompare}
            disabled={!urlA.trim() || !urlB.trim() || loading}
            className="w-full h-11 text-sm font-semibold"
            size="lg"
          >
            <GitCompareArrows className="h-4 w-4 mr-2" /> Compare
          </Button>
        </div>
      </div>
    );
  }

  // Loading
  if (loading) {
    return (
      <ScanLoadingState
        accentColor="violet"
        title="Comparing Performance…"
        description="Scanning both URLs and comparing performance metrics side by side."
      />
    );
  }

  // Error
  if (error) {
    return (
      <ScanErrorState
        error={error}
        onRetry={clearABComparison}
        onNewUrl={clearABComparison}
      />
    );
  }

  if (!result) return null;

  const { urlA: siteA, urlB: siteB, comparison } = result;
  const isWinnerA = comparison.winner === "A";
  const isWinnerB = comparison.winner === "B";
  const isTie = comparison.winner === "tie";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 border border-violet-500/20">
            <GitCompareArrows className="h-5 w-5 text-violet-400" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white">A/B Comparison</h1>
            <p className="text-slate-400 text-xs sm:text-sm">Side-by-side performance analysis</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={clearABComparison}>
          <RotateCcw className="h-4 w-4 mr-1" /> New Compare
        </Button>
      </div>

      {/* Winner Banner */}
      <Card className={cn(
        "border-2",
        isTie ? "border-slate-600" : isWinnerA ? "border-cyan-500/40" : "border-orange-500/40"
      )}>
        <CardContent className="flex items-center justify-center gap-3 p-4">
          <Trophy className={cn("h-6 w-6", isTie ? "text-slate-400" : isWinnerA ? "text-cyan-400" : "text-orange-400")} />
          <span className="text-lg font-bold text-white">
            {isTie ? "It's a tie!" : `Site ${comparison.winner} wins by ${Math.abs(comparison.scoreDiff)} points`}
          </span>
        </CardContent>
      </Card>

      {/* Side by side scores and screenshots */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Site A */}
        <Card className={cn("border", isWinnerA ? "border-cyan-500/30" : "border-slate-800")}>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-cyan-500/20 text-xs font-bold text-cyan-400">A</div>
              <CardTitle className="text-sm truncate flex-1">{siteA.url}</CardTitle>
              {isWinnerA && <Badge variant="success" className="text-[10px]">Winner</Badge>}
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 mb-4">
              <div className="grid lg:grid-cols-5 md:grid-cols-3 grid-cols-1 gap-2 flex-1">
                <div className="text-center">
                  <div className="text-sm font-bold text-white">{siteA.performance.score}</div>
                  <div className="text-[10px] text-slate-500">Score</div>
                </div>
                <div className="text-center">
                  <div className="text-sm font-bold text-white">{siteA.performance.coreWebVitals.lcp.value}</div>
                  <div className="text-[10px] text-slate-500">LCP</div>
                </div>
                <div className="text-center">
                  <div className="text-sm font-bold text-white">{siteA.performance.coreWebVitals.fcp.value}</div>
                  <div className="text-[10px] text-slate-500">FCP</div>
                </div>
                <div className="text-center">
                  <div className="text-sm font-bold text-white">{siteA.performance.coreWebVitals.cls.value}</div>
                  <div className="text-[10px] text-slate-500">CLS</div>
                </div>
                <div className="text-center">
                  <div className="text-sm font-bold text-white">{siteA.performance.coreWebVitals.tbt.value}</div>
                  <div className="text-[10px] text-slate-500">TBT</div>
                </div>
              </div>
            </div>
            {siteA.screenshot && (
              <div className="rounded-lg overflow-hidden border border-slate-800 max-h-48">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={siteA.screenshot} alt={`Screenshot of ${siteA.url}`} className="w-full h-auto object-cover" />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Site B */}
        <Card className={cn("border", isWinnerB ? "border-orange-500/30" : "border-slate-800")}>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-orange-500/20 text-xs font-bold text-orange-400">B</div>
              <CardTitle className="text-sm truncate flex-1">{siteB.url}</CardTitle>
              {isWinnerB && <Badge variant="success" className="text-[10px]">Winner</Badge>}
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 mb-4">
              <div className="grid lg:grid-cols-5 md:grid-cols-3 grid-cols-1 gap-2 flex-1">
                <div className="text-center">
                  <div className="text-sm font-bold text-white">{siteB.performance.score}</div>
                  <div className="text-[10px] text-slate-500">Score</div>
                </div>
                <div className="text-center">
                  <div className="text-sm font-bold text-white">{siteB.performance.coreWebVitals.lcp.value}</div>
                  <div className="text-[10px] text-slate-500">LCP</div>
                </div>
                <div className="text-center">
                  <div className="text-sm font-bold text-white">{siteB.performance.coreWebVitals.fcp.value}</div>
                  <div className="text-[10px] text-slate-500">FCP</div>
                </div>
                <div className="text-center">
                  <div className="text-sm font-bold text-white">{siteB.performance.coreWebVitals.cls.value}</div>
                  <div className="text-[10px] text-slate-500">CLS</div>
                </div>
                <div className="text-center">
                  <div className="text-sm font-bold text-white">{siteB.performance.coreWebVitals.tbt.value}</div>
                  <div className="text-[10px] text-slate-500">TBT</div>
                </div>
              </div>
            </div>
            {siteB.screenshot && (
              <div className="rounded-lg overflow-hidden border border-slate-800 max-h-48">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={siteB.screenshot} alt={`Screenshot of ${siteB.url}`} className="w-full h-auto object-cover" />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Metric Comparison Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Metric Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[
              { label: "Score", a: siteA.performance.score, b: siteB.performance.score, unit: "", diff: comparison.scoreDiff },
              { label: "LCP", a: siteA.performance.metrics.lcp, b: siteB.performance.metrics.lcp, unit: "ms", diff: comparison.lcpDiff },
              { label: "FCP", a: siteA.performance.metrics.fcp, b: siteB.performance.metrics.fcp, unit: "ms", diff: comparison.fcpDiff },
              { label: "CLS", a: siteA.performance.metrics.cls, b: siteB.performance.metrics.cls, unit: "", diff: comparison.clsDiff },
              { label: "TBT", a: siteA.performance.metrics.tbt, b: siteB.performance.metrics.tbt, unit: "ms", diff: comparison.tbtDiff },
              { label: "Total Size", a: siteA.performance.metrics.totalSize, b: siteB.performance.metrics.totalSize, unit: "B", diff: comparison.totalSizeDiff },
            ].map((metric) => {
              const isScoreMetric = metric.label === "Score";
              // For score, higher is better; for everything else, lower is better
              const aIsBetter = isScoreMetric ? metric.a > metric.b : metric.a < metric.b;
              const bIsBetter = isScoreMetric ? metric.b > metric.a : metric.b < metric.a;
              const formatVal = (v: number) => {
                if (metric.unit === "B") return v < 1024 * 1024 ? `${(v / 1024).toFixed(0)} KB` : `${(v / (1024 * 1024)).toFixed(1)} MB`;
                if (metric.label === "CLS") return v.toFixed(3);
                return `${Math.round(v)}${metric.unit}`;
              };

              return (
                <div key={metric.label} className="flex items-center gap-2 rounded-lg border border-slate-800/50 bg-slate-800/20 p-3">
                  <span className="text-xs font-medium text-slate-400 w-20 shrink-0">{metric.label}</span>
                  <div className="flex-1 flex items-center justify-between gap-4">
                    <span className={cn("text-sm font-mono font-bold", aIsBetter ? "text-emerald-400" : "text-white")}>
                      {formatVal(metric.a)}
                    </span>
                    <div className="flex items-center gap-1">
                      {Math.abs(metric.diff) < 0.001 ? (
                        <Minus className="h-3 w-3 text-slate-500" />
                      ) : (isScoreMetric ? metric.diff > 0 : metric.diff < 0) ? (
                        <ArrowUp className="h-3 w-3 text-emerald-400" />
                      ) : (
                        <ArrowDown className="h-3 w-3 text-red-400" />
                      )}
                      <span className="text-[10px] text-slate-500">
                        {metric.label === "CLS" ? Math.abs(metric.diff).toFixed(3) : Math.abs(Math.round(metric.diff))}{metric.unit === "B" ? "" : metric.unit}
                      </span>
                    </div>
                    <span className={cn("text-sm font-mono font-bold", bIsBetter ? "text-emerald-400" : "text-white")}>
                      {formatVal(metric.b)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Improvement Areas */}
      {comparison.improvementAreas.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Improvement Areas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {comparison.improvementAreas.map((area, i) => (
                <div
                  key={i}
                  className={cn(
                    "flex items-center justify-between rounded-lg border p-3",
                    area.improved ? "border-emerald-500/20 bg-emerald-500/5" : "border-red-500/20 bg-red-500/5"
                  )}
                >
                  <span className="text-xs font-medium text-white">{area.metric}</span>
                  <div className="flex items-center gap-1">
                    {area.improved ? (
                      <ArrowUp className="h-3 w-3 text-emerald-400" />
                    ) : (
                      <ArrowDown className="h-3 w-3 text-red-400" />
                    )}
                    <span className={cn("text-xs font-mono", area.improved ? "text-emerald-400" : "text-red-400")}>
                      {area.percentChange > 0 ? "+" : ""}{area.percentChange.toFixed(1)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
