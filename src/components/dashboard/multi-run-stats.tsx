"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { MultiRunStats } from "@/lib/types";
import { cn } from "@/lib/utils";
import { BarChart3, TrendingUp, TrendingDown, Minus } from "lucide-react";

interface MultiRunStatsCardProps {
  stats: MultiRunStats;
  accentColor?: string;
}

export function MultiRunStatsCard({ stats, accentColor = "cyan" }: MultiRunStatsCardProps) {
  const maxScore = Math.max(...stats.scores);
  const range = stats.best - stats.worst;

  const accentColorMap: Record<string, { text: string; bg: string; border: string; gradient: string }> = {
    cyan: { text: "text-cyan-400", bg: "bg-cyan-500/10", border: "border-cyan-500/20", gradient: "from-cyan-500 to-blue-500" },
    emerald: { text: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20", gradient: "from-emerald-500 to-green-500" },
    orange: { text: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/20", gradient: "from-orange-500 to-amber-500" },
  };
  const accent = accentColorMap[accentColor] || accentColorMap.cyan;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <BarChart3 className={cn("h-5 w-5", accent.text)} />
          <CardTitle className="text-base">Multi-Run Analysis</CardTitle>
          <Badge variant="secondary" className="text-[10px]">{stats.runs} runs</Badge>
        </div>
      </CardHeader>
      <CardContent>
        {/* Score sparkline */}
        <div className="flex items-end gap-1 h-16 mb-4">
          {stats.scores.map((score, i) => (
            <div
              key={i}
              className="flex-1 flex flex-col items-center gap-1"
            >
              <span className="text-[10px] text-slate-400 font-mono">{score}</span>
              <div
                className={cn("w-full rounded-t-sm bg-linear-to-t", accent.gradient)}
                style={{ height: `${maxScore > 0 ? (score / maxScore) * 100 : 0}%`, minHeight: "4px" }}
              />
              <span className="text-[10px] text-slate-500">#{i + 1}</span>
            </div>
          ))}
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <div className={cn("rounded-lg border p-3 text-center", accent.bg, accent.border)}>
            <div className={cn("text-2xl font-bold", accent.text)}>{stats.average}</div>
            <div className="text-[10px] text-slate-500">Average</div>
          </div>
          <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-3 text-center">
            <div className="flex items-center justify-center gap-1">
              <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
              <span className="text-2xl font-bold text-emerald-400">{stats.best}</span>
            </div>
            <div className="text-[10px] text-slate-500">Best</div>
          </div>
          <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-center">
            <div className="flex items-center justify-center gap-1">
              <TrendingDown className="h-3.5 w-3.5 text-red-400" />
              <span className="text-2xl font-bold text-red-400">{stats.worst}</span>
            </div>
            <div className="text-[10px] text-slate-500">Worst</div>
          </div>
          <div className="rounded-lg border border-slate-700 bg-slate-800/30 p-3 text-center">
            <div className="flex items-center justify-center gap-1">
              <Minus className="h-3.5 w-3.5 text-slate-400" />
              <span className="text-2xl font-bold text-slate-300">±{stats.standardDeviation}</span>
            </div>
            <div className="text-[10px] text-slate-500">Std Dev</div>
          </div>
        </div>

        {/* Variance bar */}
        <div className="mt-3">
          <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1">
            <span>Score Range</span>
            <span>{stats.worst} — {stats.best} (±{range})</span>
          </div>
          <div className="relative h-2 rounded-full bg-slate-800">
            <div
              className={cn("absolute h-full rounded-full bg-linear-to-r", accent.gradient)}
              style={{
                left: `${stats.worst}%`,
                width: `${range}%`,
                minWidth: "4px",
              }}
            />
          </div>
        </div>

        {/* Metric averages */}
        {stats.metricAverages && Object.keys(stats.metricAverages).length > 0 && (
          <div className="mt-4">
            <span className="text-xs font-medium text-slate-400 mb-2 block">Metric Averages</span>
            <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
              {Object.entries(stats.metricAverages).map(([key, value]) => (
                <div key={key} className="rounded-md bg-slate-800/30 px-2 py-1.5 flex items-center justify-between">
                  <span className="text-[10px] text-slate-500 uppercase">{key}</span>
                  <span className="text-[11px] font-mono text-white">{typeof value === "number" && value < 1 ? value.toFixed(3) : Math.round(value as number)}
                    {key !== "cls" ? "ms" : ""}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
