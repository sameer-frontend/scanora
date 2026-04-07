"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { CWVTimeline } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Clock, Activity } from "lucide-react";

const eventColors: Record<string, { bg: string; border: string; text: string; dot: string }> = {
  ttfb: { bg: "bg-slate-500/10", border: "border-slate-500/20", text: "text-slate-400", dot: "bg-slate-400" },
  fcp: { bg: "bg-green-500/10", border: "border-green-500/20", text: "text-green-400", dot: "bg-green-400" },
  lcp: { bg: "bg-blue-500/10", border: "border-blue-500/20", text: "text-blue-400", dot: "bg-blue-400" },
  cls: { bg: "bg-amber-500/10", border: "border-amber-500/20", text: "text-amber-400", dot: "bg-amber-400" },
  inp: { bg: "bg-violet-500/10", border: "border-violet-500/20", text: "text-violet-400", dot: "bg-violet-400" },
  dom: { bg: "bg-cyan-500/10", border: "border-cyan-500/20", text: "text-cyan-400", dot: "bg-cyan-400" },
  load: { bg: "bg-orange-500/10", border: "border-orange-500/20", text: "text-orange-400", dot: "bg-orange-400" },
  "long-task": { bg: "bg-red-500/10", border: "border-red-500/20", text: "text-red-400", dot: "bg-red-400" },
};

const ratingBadge: Record<string, { variant: "success" | "warning" | "destructive"; label: string }> = {
  good: { variant: "success", label: "Good" },
  "needs-improvement": { variant: "warning", label: "Needs Work" },
  poor: { variant: "destructive", label: "Poor" },
};

interface CWVTimelineCardProps {
  timeline: CWVTimeline;
}

export function CWVTimelineCard({ timeline }: CWVTimelineCardProps) {
  const maxTime = timeline.totalDuration || Math.max(...timeline.events.map((e) => e.time), 1);

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-cyan-400" />
          <CardTitle className="text-base">Core Web Vitals Timeline</CardTitle>
          <Badge variant="secondary" className="text-[10px]">{timeline.events.length} events</Badge>
        </div>
      </CardHeader>
      <CardContent>
        {/* Timeline bar */}
        <div className="relative mt-2 mb-6">
          <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
            <div className="h-full rounded-full bg-linear-to-r from-cyan-500 to-blue-500" style={{ width: "100%" }} />
          </div>
          {/* Event markers */}
          {timeline.events.filter(e => e.type !== "long-task").map((event, i) => {
            const pct = maxTime > 0 ? Math.min((event.time / maxTime) * 100, 100) : 0;
            const colors = eventColors[event.type] || eventColors.dom;
            return (
              <div
                key={i}
                className="absolute -top-1"
                style={{ left: `${pct}%`, transform: "translateX(-50%)" }}
                title={`${event.label}: ${event.value || `${event.time}ms`}`}
              >
                <div className={cn("h-4 w-4 rounded-full border-2 border-[#0a0e1a]", colors.dot)} />
              </div>
            );
          })}
        </div>

        {/* Event list */}
        <div className="space-y-2">
          {timeline.events.filter(e => e.type !== "long-task").map((event, i) => {
            const colors = eventColors[event.type] || eventColors.dom;
            const rating = event.rating ? ratingBadge[event.rating] : null;
            return (
              <div
                key={i}
                className={cn("flex items-center justify-between rounded-lg border px-3 py-2", colors.bg, colors.border)}
              >
                <div className="flex items-center gap-2">
                  <div className={cn("h-2.5 w-2.5 rounded-full", colors.dot)} />
                  <span className="text-xs font-medium text-white">{event.label}</span>
                  {rating && (
                    <Badge variant={rating.variant} className="text-[10px]">
                      {rating.label}
                    </Badge>
                  )}
                </div>
                <span className={cn("text-sm font-mono font-bold", colors.text)}>
                  {event.value || `${Math.round(event.time)}ms`}
                </span>
              </div>
            );
          })}
        </div>

        {/* INP */}
        {timeline.inp && (
          <div className="mt-4 rounded-lg border border-violet-500/20 bg-violet-500/10 p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-violet-400" />
                <span className="text-xs font-medium text-white">Interaction to Next Paint (INP)</span>
                {timeline.inp.rating && (
                  <Badge variant={ratingBadge[timeline.inp.rating]?.variant || "secondary"} className="text-[10px]">
                    {ratingBadge[timeline.inp.rating]?.label || timeline.inp.rating}
                  </Badge>
                )}
              </div>
              <span className="text-sm font-mono font-bold text-violet-400">{timeline.inp.value}</span>
            </div>
          </div>
        )}

        {/* Long Tasks */}
        {timeline.longTasks.length > 0 && (
          <div className="mt-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-medium text-slate-400">Long Tasks ({timeline.longTasks.length})</span>
            </div>
            <div className="relative h-6 rounded-md bg-slate-800 overflow-hidden">
              {timeline.longTasks.map((task, i) => {
                const left = maxTime > 0 ? (task.start / maxTime) * 100 : 0;
                const width = maxTime > 0 ? Math.max((task.duration / maxTime) * 100, 0.5) : 0.5;
                return (
                  <div
                    key={i}
                    className="absolute top-0 h-full bg-red-500/40 border-l border-red-500/60"
                    style={{ left: `${left}%`, width: `${width}%` }}
                    title={`Long task: ${Math.round(task.duration)}ms at ${Math.round(task.start)}ms`}
                  />
                );
              })}
            </div>
            <div className="flex justify-between mt-1 text-[10px] text-slate-500">
              <span>0ms</span>
              <span>{Math.round(maxTime)}ms</span>
            </div>
          </div>
        )}

        {/* Layout Shifts */}
        {timeline.layoutShifts.length > 0 && (
          <div className="mt-4">
            <span className="text-xs font-medium text-slate-400">Layout Shifts ({timeline.layoutShifts.length})</span>
            <div className="mt-2 space-y-1">
              {timeline.layoutShifts.slice(0, 5).map((shift, i) => (
                <div key={i} className="flex items-center justify-between rounded-md bg-amber-500/5 border border-amber-500/10 px-3 py-1.5">
                  <div className="text-[11px] text-slate-400">
                    at {Math.round(shift.time)}ms
                    {shift.element && <span className="ml-2 text-slate-500 font-mono">{shift.element}</span>}
                  </div>
                  <span className="text-[11px] font-mono text-amber-400">{shift.value.toFixed(4)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
