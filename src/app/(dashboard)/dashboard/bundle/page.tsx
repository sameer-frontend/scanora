"use client";

import { useState } from "react";
import {
  Package,
  FileCode2,
  Image as ImageIcon,
  Type,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  RotateCcw,
  Globe,
  Layers,
  BarChart3,
  Code2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScanLoadingState, ScanErrorState } from "@/components/dashboard/scan-states";
import { ScanForm } from "@/components/dashboard/scan-form";
import { useScan } from "@/lib/scan-context";
import type { BundleChunk, DetectedTechnology, TechCategory } from "@/lib/types";
import { cn } from "@/lib/utils";

/* ── Helpers ──────────────────────────────────────────────── */

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const chunkTypeConfig: Record<
  BundleChunk["type"],
  { icon: typeof FileCode2; color: string; bg: string; border: string; label: string }
> = {
  js: { icon: FileCode2, color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20", label: "JavaScript" },
  css: { icon: Code2, color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20", label: "CSS" },
  image: { icon: ImageIcon, color: "text-violet-400", bg: "bg-violet-500/10", border: "border-violet-500/20", label: "Image" },
  font: { icon: Type, color: "text-cyan-400", bg: "bg-cyan-500/10", border: "border-cyan-500/20", label: "Font" },
  other: { icon: Package, color: "text-slate-400", bg: "bg-slate-500/10", border: "border-slate-500/20", label: "Other" },
};

const categoryMeta: Record<TechCategory, { label: string; color: string; bg: string }> = {
  framework: { label: "Framework", color: "text-blue-400", bg: "bg-blue-500/10" },
  cms: { label: "CMS", color: "text-purple-400", bg: "bg-purple-500/10" },
  cdn: { label: "CDN", color: "text-cyan-400", bg: "bg-cyan-500/10" },
  analytics: { label: "Analytics", color: "text-amber-400", bg: "bg-amber-500/10" },
  library: { label: "Library", color: "text-emerald-400", bg: "bg-emerald-500/10" },
  ui: { label: "UI", color: "text-pink-400", bg: "bg-pink-500/10" },
  "build-tool": { label: "Build Tool", color: "text-orange-400", bg: "bg-orange-500/10" },
  hosting: { label: "Hosting", color: "text-teal-400", bg: "bg-teal-500/10" },
  "font-service": { label: "Fonts", color: "text-indigo-400", bg: "bg-indigo-500/10" },
  security: { label: "Security", color: "text-red-400", bg: "bg-red-500/10" },
  other: { label: "Other", color: "text-slate-400", bg: "bg-slate-500/10" },
};

/* ── Technology Card ──────────────────────────────────────── */

function TechCard({ tech }: { tech: DetectedTechnology }) {
  const cat = categoryMeta[tech.category];
  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-800/60 bg-slate-900/40 px-4 py-3 transition-colors hover:border-slate-700/60">
      <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg", cat.bg)}>
        <Globe className={cn("h-5 w-5", cat.color)} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-white truncate">{tech.name}</span>
          {tech.version && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-slate-700 text-slate-400">
              v{tech.version}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className={cn("text-xs font-medium", cat.color)}>{cat.label}</span>
          <span className="text-xs text-slate-500">·</span>
          <span className="text-xs text-slate-500">{tech.confidence}% confidence</span>
        </div>
      </div>
      {tech.website && (
        <a
          href={tech.website}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 text-slate-500 hover:text-slate-300 transition-colors"
        >
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      )}
    </div>
  );
}

/* ── Treemap-style Bar ────────────────────────────────────── */

function SizeBar({ chunks }: { chunks: BundleChunk[] }) {
  const total = chunks.reduce((s, c) => s + c.size, 0);
  if (!total) return null;

  const byType: Record<string, number> = {};
  for (const c of chunks) {
    byType[c.type] = (byType[c.type] || 0) + c.size;
  }

  const colorMap: Record<string, string> = {
    js: "bg-amber-500",
    css: "bg-blue-500",
    image: "bg-violet-500",
    font: "bg-cyan-500",
    other: "bg-slate-500",
  };

  return (
    <div className="space-y-2">
      <div className="flex h-5 w-full overflow-hidden rounded-full">
        {Object.entries(byType)
          .sort((a, b) => b[1] - a[1])
          .map(([type, size]) => (
            <div
              key={type}
              className={cn("h-full transition-all", colorMap[type] || "bg-slate-600")}
              style={{ width: `${Math.max((size / total) * 100, 1)}%` }}
              title={`${type.toUpperCase()}: ${formatBytes(size)}`}
            />
          ))}
      </div>
      <div className="flex flex-wrap gap-3">
        {Object.entries(byType)
          .sort((a, b) => b[1] - a[1])
          .map(([type, size]) => (
            <div key={type} className="flex items-center gap-1.5 text-xs text-slate-400">
              <div className={cn("h-2.5 w-2.5 rounded-sm", colorMap[type] || "bg-slate-600")} />
              <span>{type.toUpperCase()}</span>
              <span className="text-slate-500">{formatBytes(size)}</span>
              <span className="text-slate-600">({((size / total) * 100).toFixed(1)}%)</span>
            </div>
          ))}
      </div>
    </div>
  );
}

/* ── Main Page ────────────────────────────────────────────── */

export default function BundlePage() {
  const {
    bundleAnalysis: data,
    bundleLoading: loading,
    bundleError: error,
    fetchBundleAnalysis,
    clearBundleAnalysis,
  } = useScan();

  const [showAllChunks, setShowAllChunks] = useState(false);
  const [showAllUnused, setShowAllUnused] = useState(false);
  const [techFilter, setTechFilter] = useState<TechCategory | "all">("all");

  // ── Empty state ──
  if (!data && !loading && !error) {
    return (
      <ScanForm
        onScan={fetchBundleAnalysis}
        scanning={loading}
        accentColor="violet"
        icon={Package}
        title="Bundle & Tech Analysis"
        description="Analyze JavaScript bundles, code coverage, and detect web technologies used by any website."
        hideDevicePicker
        showAdvancedOptions={false}
      />
    );
  }

  // ── Loading ──
  if (loading) {
    return (
      <ScanLoadingState
        accentColor="violet"
        title="Analyzing Bundle & Technologies…"
        description="Playwright is loading the page, collecting code coverage data, and detecting web technologies."
      />
    );
  }

  // ── Error ──
  if (error) {
    return (
      <ScanErrorState
        error={error}
        onRetry={clearBundleAnalysis}
        onNewUrl={fetchBundleAnalysis}
      />
    );
  }

  if (!data) return null;

  const visibleChunks = showAllChunks ? data.chunks : data.chunks.slice(0, 15);
  const visibleUnused = showAllUnused ? data.unusedJs : data.unusedJs.slice(0, 8);
  const technologies = data.technologies || [];
  const techCategories = Array.from(new Set(technologies.map((t) => t.category)));
  const filteredTech = techFilter === "all" ? technologies : technologies.filter((t) => t.category === techFilter);

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Bundle & Tech Analysis</h1>
          <p className="mt-1 text-sm text-slate-400 truncate max-w-md">{data.url}</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={clearBundleAnalysis}
          className="border-slate-700 text-slate-300 hover:bg-slate-800 w-fit"
        >
          <RotateCcw className="mr-2 h-4 w-4" /> New Scan
        </Button>
      </div>

      {/* ── Summary Cards ─────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total Transfer", value: formatBytes(data.totalTransferSize), icon: Package, color: "text-violet-400", bg: "bg-violet-500/10" },
          { label: "JavaScript", value: formatBytes(data.totalJsSize), icon: FileCode2, color: "text-amber-400", bg: "bg-amber-500/10" },
          { label: "CSS", value: formatBytes(data.totalCssSize), icon: Code2, color: "text-blue-400", bg: "bg-blue-500/10" },
          { label: "Technologies", value: `${technologies.length} detected`, icon: Layers, color: "text-emerald-400", bg: "bg-emerald-500/10" },
        ].map((card) => (
          <Card key={card.label} className="border-slate-800/60 bg-slate-900/40">
            <CardContent className="flex items-center gap-4 p-4">
              <div className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-xl", card.bg)}>
                <card.icon className={cn("h-5 w-5", card.color)} />
              </div>
              <div>
                <p className="text-xs text-slate-400">{card.label}</p>
                <p className="text-lg font-bold text-white">{card.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Size Breakdown Bar ────────────────────────────── */}
      <Card className="border-slate-800/60 bg-slate-900/40">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base text-white">
            <BarChart3 className="h-5 w-5 text-violet-400" />
            Resource Size Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <SizeBar chunks={data.chunks} />
        </CardContent>
      </Card>

      {/* ── Technologies Detected ─────────────────────────── */}
      {technologies.length > 0 && (
        <Card className="border-slate-800/60 bg-slate-900/40">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base text-white">
              <Layers className="h-5 w-5 text-emerald-400" />
              Technologies Detected
              <Badge variant="outline" className="ml-auto border-slate-700 text-slate-400">
                {technologies.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Category filter */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setTechFilter("all")}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                  techFilter === "all"
                    ? "bg-violet-500/15 text-violet-300 border border-violet-500/30"
                    : "bg-slate-800/50 text-slate-400 border border-slate-700/50 hover:text-slate-300"
                )}
              >
                All ({technologies.length})
              </button>
              {techCategories.map((cat) => {
                const meta = categoryMeta[cat];
                const count = technologies.filter((t) => t.category === cat).length;
                return (
                  <button
                    key={cat}
                    onClick={() => setTechFilter(cat)}
                    className={cn(
                      "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                      techFilter === cat
                        ? cn(meta.bg, meta.color, "border border-current/30")
                        : "bg-slate-800/50 text-slate-400 border border-slate-700/50 hover:text-slate-300"
                    )}
                  >
                    {meta.label} ({count})
                  </button>
                );
              })}
            </div>

            {/* Tech grid */}
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {filteredTech.map((tech) => (
                <TechCard key={tech.name} tech={tech} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Resource Chunks ───────────────────────────────── */}
      <Card className="border-slate-800/60 bg-slate-900/40">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base text-white">
            <Package className="h-5 w-5 text-violet-400" />
            Resource Chunks
            <Badge variant="outline" className="ml-auto border-slate-700 text-slate-400">
              {data.chunks.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1.5">
            {visibleChunks.map((chunk, i) => {
              const cfg = chunkTypeConfig[chunk.type];
              const Icon = cfg.icon;
              return (
                <div
                  key={`${chunk.name}-${i}`}
                  className="flex items-center gap-3 rounded-lg border border-slate-800/40 bg-slate-900/30 px-3 py-2"
                >
                  <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg", cfg.bg)}>
                    <Icon className={cn("h-4 w-4", cfg.color)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate" title={chunk.name}>{chunk.name}</p>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span>{cfg.label}</span>
                      {chunk.isFirstLoad && (
                        <>
                          <span>·</span>
                          <span className="text-cyan-400">First Load</span>
                        </>
                      )}
                      {chunk.route && (
                        <>
                          <span>·</span>
                          <span className="text-slate-400">{chunk.route}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-medium text-white">{formatBytes(chunk.size)}</p>
                    <p className="text-xs text-slate-500">{formatBytes(chunk.gzipSize)} gzip</p>
                  </div>
                </div>
              );
            })}
          </div>
          {data.chunks.length > 15 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAllChunks(!showAllChunks)}
              className="mt-3 w-full text-slate-400 hover:text-white"
            >
              {showAllChunks ? <ChevronUp className="mr-2 h-4 w-4" /> : <ChevronDown className="mr-2 h-4 w-4" />}
              {showAllChunks ? "Show Less" : `Show All ${data.chunks.length} Chunks`}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* ── Unused JavaScript ─────────────────────────────── */}
      {data.unusedJs.length > 0 && (
        <Card className="border-slate-800/60 bg-slate-900/40">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base text-white">
              <AlertTriangle className="h-5 w-5 text-amber-400" />
              Unused JavaScript
              <Badge variant="outline" className="ml-auto border-amber-500/20 text-amber-400">
                {data.unusedJs.length} files
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {visibleUnused.map((item, i) => {
                const name = (() => {
                  try { return new URL(item.url).pathname.split("/").pop() || item.url; }
                  catch { return item.url; }
                })();
                return (
                  <div
                    key={`${item.url}-${i}`}
                    className="rounded-lg border border-slate-800/40 bg-slate-900/30 px-4 py-3"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm text-white truncate flex-1" title={name}>{name}</p>
                      <span className="shrink-0 text-sm font-medium text-amber-400">
                        {item.percentUnused}% unused
                      </span>
                    </div>
                    {/* Usage bar */}
                    <div className="mt-2 flex h-2 w-full overflow-hidden rounded-full bg-slate-800">
                      <div
                        className="h-full rounded-full bg-emerald-500"
                        style={{ width: `${100 - item.percentUnused}%` }}
                      />
                      <div
                        className="h-full bg-amber-500/60"
                        style={{ width: `${item.percentUnused}%` }}
                      />
                    </div>
                    <div className="mt-1 flex justify-between text-xs text-slate-500">
                      <span>Used: {formatBytes(item.totalBytes - item.unusedBytes)}</span>
                      <span>Unused: {formatBytes(item.unusedBytes)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
            {data.unusedJs.length > 8 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAllUnused(!showAllUnused)}
                className="mt-3 w-full text-slate-400 hover:text-white"
              >
                {showAllUnused ? <ChevronUp className="mr-2 h-4 w-4" /> : <ChevronDown className="mr-2 h-4 w-4" />}
                {showAllUnused ? "Show Less" : `Show All ${data.unusedJs.length} Files`}
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
