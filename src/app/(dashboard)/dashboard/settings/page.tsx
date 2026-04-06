"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Settings,
  Clock,
  ChevronDown,
  ChevronUp,
  Globe,
  Accessibility,
  Zap,
  Search,
  Trash2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

function scoreColor(score: number) {
  if (score >= 90) return "text-emerald-400";
  if (score >= 50) return "text-amber-400";
  return "text-red-400";
}

function scoreBadge(score: number): "success" | "warning" | "destructive" {
  if (score >= 90) return "success";
  if (score >= 50) return "warning";
  return "destructive";
}

interface HistoryEntry {
  url: string;
  timestamp: number;
  accessibility: Array<{
    device: { name: string };
    data: { score: number; stats: { critical: number; serious: number; moderate: number; minor: number } };
  }> | null;
  performance: Array<{
    device: { name: string };
    data: { score: number; metrics: { fcp: number; lcp: number; tbt: number; cls: number } };
  }> | null;
  seo: Array<{
    device: { name: string };
    data: { score: number; issues: Array<{ severity: string }> };
  }> | null;
}

export default function SettingsPage() {
  const [history, setHistory] = useState<HistoryEntry[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const raw = localStorage.getItem("Scanora-scan-history");
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const clearHistory = () => {
    localStorage.removeItem("Scanora-scan-history");
    setHistory([]);
    setExpandedIndex(null);
  };

  const removeEntry = (index: number) => {
    const updated = history.filter((_, i) => i !== index);
    localStorage.setItem("Scanora-scan-history", JSON.stringify(updated));
    setHistory(updated);
    if (expandedIndex === index) setExpandedIndex(null);
  };

  return (
    <motion.div initial="hidden" animate="visible" className="space-y-6">
      {/* Header */}
      <motion.div variants={fadeUp} custom={0}>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-500/10 border border-slate-500/20">
            <Settings className="h-5 w-5 text-slate-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Settings</h1>
            <p className="text-slate-400 text-sm">View scan history</p>
          </div>
        </div>
      </motion.div>

      <motion.div variants={fadeUp} custom={1} className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white">Recent Scans</h3>
            <p className="text-sm text-slate-400">
              {history.length > 0
                ? `Your last ${history.length} scan${history.length !== 1 ? "s" : ""} stored locally.`
                : "No scan history yet."}
            </p>
          </div>
          {history.length > 0 && (
            <Button variant="outline" size="sm" onClick={clearHistory}>
              <Trash2 className="h-4 w-4 mr-1" /> Clear All
            </Button>
          )}
        </div>

            {history.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <Clock className="h-12 w-12 text-slate-600 mb-3" />
                  <p className="text-slate-400 text-sm">Run a scan to see results here.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {history.map((entry, index) => {
                  const isExpanded = expandedIndex === index;
                  const avgA11y = entry.accessibility?.length
                    ? Math.round(entry.accessibility.reduce((s, d) => s + d.data.score, 0) / entry.accessibility.length)
                    : null;
                  const avgPerf = entry.performance?.length
                    ? Math.round(entry.performance.reduce((s, d) => s + d.data.score, 0) / entry.performance.length)
                    : null;
                  const avgSeo = entry.seo?.length
                    ? Math.round(entry.seo.reduce((s, d) => s + d.data.score, 0) / entry.seo.length)
                    : null;

                  return (
                    <Card key={`${entry.url}-${entry.timestamp}`}>
                      <CardContent className="p-0">
                        <button
                          onClick={() => setExpandedIndex(isExpanded ? null : index)}
                          className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-800/30 transition-colors rounded-lg"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                              <Globe className="h-5 w-5 text-emerald-400" />
                            </div>
                            <div className="min-w-0">
                              <div className="text-sm font-medium text-white truncate">{entry.url}</div>
                              <div className="text-xs text-slate-500">{new Date(entry.timestamp).toLocaleString()}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            {avgA11y !== null && (
                              <div className="flex items-center gap-1 text-xs">
                                <Accessibility className="h-3.5 w-3.5 text-violet-400" />
                                <span className={scoreColor(avgA11y)}>{avgA11y}</span>
                              </div>
                            )}
                            {avgPerf !== null && (
                              <div className="flex items-center gap-1 text-xs">
                                <Zap className="h-3.5 w-3.5 text-amber-400" />
                                <span className={scoreColor(avgPerf)}>{avgPerf}</span>
                              </div>
                            )}
                            {avgSeo !== null && (
                              <div className="flex items-center gap-1 text-xs">
                                <Search className="h-3.5 w-3.5 text-cyan-400" />
                                <span className={scoreColor(avgSeo)}>{avgSeo}</span>
                              </div>
                            )}
                            {isExpanded ? (
                              <ChevronUp className="h-4 w-4 text-slate-400" />
                            ) : (
                              <ChevronDown className="h-4 w-4 text-slate-400" />
                            )}
                          </div>
                        </button>

                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="overflow-hidden"
                            >
                              <div className="px-4 pb-4 space-y-4 border-t border-slate-800/50 pt-4">
                                {/* Accessibility Results */}
                                {entry.accessibility && entry.accessibility.length > 0 && (
                                  <div>
                                    <h4 className="text-sm font-medium text-violet-400 flex items-center gap-1.5 mb-2">
                                      <Accessibility className="h-4 w-4" /> Accessibility
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                      {entry.accessibility.map((d, i) => (
                                        <div key={i} className="rounded-lg border border-slate-800/50 bg-slate-800/20 p-3">
                                          <div className="flex items-center justify-between mb-1">
                                            <span className="text-xs text-slate-400">{d.device.name}</span>
                                            <Badge variant={scoreBadge(d.data.score)}>{d.data.score}/100</Badge>
                                          </div>
                                          <div className="flex gap-2 text-xs text-slate-500">
                                            {d.data.stats.critical > 0 && <span className="text-red-400">{d.data.stats.critical} critical</span>}
                                            {d.data.stats.serious > 0 && <span className="text-orange-400">{d.data.stats.serious} serious</span>}
                                            {d.data.stats.moderate > 0 && <span className="text-amber-400">{d.data.stats.moderate} moderate</span>}
                                            {d.data.stats.minor > 0 && <span className="text-slate-400">{d.data.stats.minor} minor</span>}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Performance Results */}
                                {entry.performance && entry.performance.length > 0 && (
                                  <div>
                                    <h4 className="text-sm font-medium text-amber-400 flex items-center gap-1.5 mb-2">
                                      <Zap className="h-4 w-4" /> Performance
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                      {entry.performance.map((d, i) => (
                                        <div key={i} className="rounded-lg border border-slate-800/50 bg-slate-800/20 p-3">
                                          <div className="flex items-center justify-between mb-1">
                                            <span className="text-xs text-slate-400">{d.device.name}</span>
                                            <Badge variant={scoreBadge(d.data.score)}>{d.data.score}/100</Badge>
                                          </div>
                                          <div className="grid grid-cols-2 gap-1 text-xs text-slate-500">
                                            <span>FCP: {(d.data.metrics.fcp / 1000).toFixed(2)}s</span>
                                            <span>LCP: {(d.data.metrics.lcp / 1000).toFixed(2)}s</span>
                                            <span>TBT: {Math.round(d.data.metrics.tbt)}ms</span>
                                            <span>CLS: {d.data.metrics.cls.toFixed(3)}</span>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* SEO Results */}
                                {entry.seo && entry.seo.length > 0 && (
                                  <div>
                                    <h4 className="text-sm font-medium text-cyan-400 flex items-center gap-1.5 mb-2">
                                      <Search className="h-4 w-4" /> SEO
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                      {entry.seo.map((d, i) => {
                                        const criticals = d.data.issues?.filter((is) => is.severity === "critical").length || 0;
                                        const warnings = d.data.issues?.filter((is) => is.severity === "warning").length || 0;
                                        return (
                                          <div key={i} className="rounded-lg border border-slate-800/50 bg-slate-800/20 p-3">
                                            <div className="flex items-center justify-between mb-1">
                                              <span className="text-xs text-slate-400">{d.device.name}</span>
                                              <Badge variant={scoreBadge(d.data.score)}>{d.data.score}/100</Badge>
                                            </div>
                                            <div className="flex gap-2 text-xs text-slate-500">
                                              {criticals > 0 && <span className="text-red-400">{criticals} critical</span>}
                                              {warnings > 0 && <span className="text-amber-400">{warnings} warnings</span>}
                                              {criticals === 0 && warnings === 0 && <span className="text-emerald-400">All checks passed</span>}
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                )}

                                <div className="flex justify-end">
                                  <Button variant="ghost" size="sm" onClick={() => removeEntry(index)} className="text-slate-400 hover:text-red-400">
                                    <Trash2 className="h-4 w-4 mr-1" /> Remove
                                  </Button>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
      </motion.div>
    </motion.div>
  );
}
