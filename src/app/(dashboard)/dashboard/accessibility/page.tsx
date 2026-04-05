"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import {
  Accessibility,
  AlertTriangle,
  CheckCircle2,
  Info,
  XCircle,
  Filter,
  Download,
  Eye,
  ArrowUpRight,
  Code2,
  MonitorSmartphone,
  Globe,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WebGuardScoreRing } from "@/components/dashboard/score-ring";
import { ScanEmptyState, ScanLoadingState, ScanErrorState } from "@/components/dashboard/scan-states";
import { DeviceTabs } from "@/components/dashboard/device-tabs";
import { ScreenshotCard } from "@/components/dashboard/screenshot-card";
import { CrossDeviceComparison } from "@/components/dashboard/cross-device-comparison";
import { useScan } from "@/lib/scan-context";
import { fadeUp } from "@/lib/constants";
import type { DeviceType, DeviceAccessibilityResult, AccessibilityData, AccessibilityIssue, WcagPrinciple } from "@/lib/types";
import { cn } from "@/lib/utils";

const severityConfig: Record<string, { color: string; bg: string; border: string; icon: typeof XCircle }> = {
  critical: { color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/20", icon: XCircle },
  serious: { color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20", icon: AlertTriangle },
  moderate: { color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20", icon: Info },
  minor: { color: "text-slate-400", bg: "bg-slate-500/10", border: "border-slate-500/20", icon: Info },
};

const principleIcons = {
  perceivable: Eye,
  operable: MonitorSmartphone,
  understandable: Info,
  robust: Code2,
};

/* ── Per-page accessibility detail sections ───────────────────── */
function PageA11ySections({ pageData }: { pageData: AccessibilityData }) {
  const [severityFilter, setSeverityFilter] = useState<"all" | AccessibilityIssue["severity"]>("all");
  const [principleFilter, setPrincipleFilter] = useState<"all" | WcagPrinciple>("all");

  const issues = pageData.issues;
  const filtered = issues.filter((i) => {
    if (severityFilter !== "all" && i.severity !== severityFilter) return false;
    if (principleFilter !== "all" && i.principle !== principleFilter) return false;
    return true;
  });

  const wcagCategories = [
    { name: "Perceivable", key: "perceivable" as const, ...pageData.principles.perceivable },
    { name: "Operable", key: "operable" as const, ...pageData.principles.operable },
    { name: "Understandable", key: "understandable" as const, ...pageData.principles.understandable },
    { name: "Robust", key: "robust" as const, ...pageData.principles.robust },
  ];

  return (
    <div className="space-y-4">
      {/* Score + Summary */}
      <div className="flex items-center gap-4 rounded-lg border border-slate-800/50 bg-slate-800/20 p-4">
        <WebGuardScoreRing score={pageData.score} size={72} />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-white mb-1">A11y Score</div>
          <p className="text-xs text-slate-400 line-clamp-2">{pageData.summary}</p>
        </div>
        <div className="grid grid-cols-2 gap-2 text-center shrink-0">
          {[
            { label: "Critical", value: pageData.stats.critical, color: "text-red-400" },
            { label: "Serious", value: pageData.stats.serious, color: "text-amber-400" },
            { label: "Moderate", value: pageData.stats.moderate, color: "text-blue-400" },
            { label: "Minor", value: pageData.stats.minor, color: "text-slate-400" },
          ].map((s) => (
            <div key={s.label} className="rounded-md bg-slate-900/60 px-3 py-1.5">
              <div className={cn("text-sm font-bold", s.color)}>{s.value}</div>
              <div className="text-[10px] text-slate-500">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* WCAG Principles */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {wcagCategories.map((cat) => {
          const Icon = principleIcons[cat.key];
          return (
            <div key={cat.name} className="rounded-lg border border-slate-800/50 bg-slate-800/20 p-3">
              <div className="flex items-center gap-2 mb-2">
                <Icon className="h-4 w-4 text-emerald-400" />
                <span className="text-xs font-medium text-white">{cat.name}</span>
              </div>
              <div className="text-xl font-bold text-white mb-1">{cat.score}%</div>
              <Progress value={cat.score} className="mb-1" />
              <div className="text-[10px] text-slate-400">{cat.issueCount} issue{cat.issueCount !== 1 ? "s" : ""}</div>
            </div>
          );
        })}
      </div>

      {/* Severity Summary */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: "Critical", value: pageData.stats.critical, color: "text-red-400", border: "border-red-500/20" },
          { label: "Serious", value: pageData.stats.serious, color: "text-amber-400", border: "border-amber-500/20" },
          { label: "Moderate", value: pageData.stats.moderate, color: "text-blue-400", border: "border-blue-500/20" },
          { label: "Minor", value: pageData.stats.minor, color: "text-slate-400", border: "border-slate-500/20" },
        ].map((stat) => (
          <div key={stat.label} className={cn("rounded-md border p-2 text-center", stat.border)}>
            <div className={cn("text-lg font-bold", stat.color)}>{stat.value}</div>
            <div className="text-[10px] text-slate-500">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Filter Controls */}
      <div className="flex gap-2 flex-wrap">
        {([
          ["all", "All", issues.length],
          ["critical", "Critical", pageData.stats.critical],
          ["serious", "Serious", pageData.stats.serious],
          ["moderate", "Moderate", pageData.stats.moderate],
          ["minor", "Minor", pageData.stats.minor],
        ] as [string, string, number][]).map(([key, label, count]) => (
          <button
            key={key}
            onClick={() => setSeverityFilter(key as typeof severityFilter)}
            className={cn(
              "rounded-md px-3 py-1.5 text-xs font-medium transition-all border",
              severityFilter === key
                ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-400"
                : "bg-slate-900/50 border-slate-800 text-slate-400 hover:text-white"
            )}
          >
            {label} ({count})
          </button>
        ))}
        <span className="border-l border-slate-700 mx-1" />
        {(["all", "perceivable", "operable", "understandable", "robust"] as const).map((p) => (
          <button
            key={p}
            onClick={() => setPrincipleFilter(p)}
            className={cn(
              "rounded-md px-3 py-1.5 text-xs font-medium transition-all border capitalize",
              principleFilter === p
                ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-400"
                : "bg-slate-900/50 border-slate-800 text-slate-400 hover:text-white"
            )}
          >
            {p}
          </button>
        ))}
      </div>

      {/* Issues List */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="text-center py-6">
            <CheckCircle2 className="h-8 w-8 text-emerald-400 mx-auto mb-2" />
            <p className="text-sm text-slate-500">No issues in this category.</p>
          </div>
        ) : (
          filtered.map((issue) => {
            const config = severityConfig[issue.severity] ?? severityConfig.moderate;
            const SeverityIcon = config.icon;
            return (
              <div
                key={issue.id}
                className="rounded-lg border border-slate-800/50 bg-slate-800/20 p-3 hover:bg-slate-800/40 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg", config.bg, "border", config.border)}>
                    <SeverityIcon className={cn("h-3.5 w-3.5", config.color)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h4 className="text-sm font-medium text-white">{issue.title}</h4>
                      {issue.wcag && (
                        <a href={issue.wcagUrl || "#"} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 hover:opacity-80">
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 cursor-pointer">
                            WCAG {issue.wcag} <ExternalLink className="h-2.5 w-2.5 ml-0.5" />
                          </Badge>
                        </a>
                      )}
                    </div>
                    <div className="text-xs text-slate-400 mb-1">
                      Target: <span className="text-slate-300">{issue.target}</span> · {issue.count} instance{issue.count !== 1 ? "s" : ""}
                    </div>
                    <div className="rounded-md bg-slate-900/80 border border-slate-800 px-2 py-1.5 font-mono text-xs text-slate-400 mb-1.5 break-all max-h-24 overflow-y-auto">
                      {issue.element}
                    </div>
                    <div className="flex items-start gap-2 text-xs">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span className="text-slate-300">Fix: {issue.fix}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default function AccessibilityPage() {
  const {
    accessibilityData: results,
    accessibilityLoading: loading,
    accessibilityStreaming: streaming,
    accessibilityError: error,
    scanMode,
  } = useScan();

  const [activeDevice, setActiveDevice] = useState<DeviceType | null>(null);
  const [screenshotOpen, setScreenshotOpen] = useState(false);

  // Pick active result
  const currentDevice = activeDevice ?? results?.[0]?.device.type ?? null;
  const activeResult: DeviceAccessibilityResult | undefined =
    results?.find((r) => r.device.type === currentDevice);

  // Empty state
  if (!results && !loading && !error) {
    return (
      <ScanEmptyState
        icon={Accessibility}
        accentColor="emerald"
        description='Enter a URL in the sidebar and click "New Scan" to run a Playwright-powered WCAG 2.2 accessibility audit across devices.'
      />
    );
  }

  // Loading
  if (loading) {
    return (
      <ScanLoadingState
        accentColor="emerald"
        title="Scanning for Accessibility Issues…"
        description="Playwright is loading the page on multiple devices and running axe-core WCAG audit."
      >
        {scanMode === "full-site" && (
          <p className="text-emerald-400/80 text-xs mt-3">
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
  const issues = isMultiPage
    ? activeResult.pages!.flatMap((pg, pgIdx) =>
      pg.data.issues.map((issue, iIdx) => ({ ...issue, id: `a11y-pg-${pgIdx}-${iIdx}` }))
    )
    : data.issues;
  const stats = isMultiPage
    ? {
      critical: issues.filter((i) => i.severity === "critical").length,
      serious: issues.filter((i) => i.severity === "serious").length,
      moderate: issues.filter((i) => i.severity === "moderate").length,
      minor: issues.filter((i) => i.severity === "minor").length,
    }
    : data.stats;
  const principles = data.principles;
  const avgScore = isMultiPage
    ? Math.round(activeResult.pages!.reduce((s, p) => s + p.data.score, 0) / activeResult.pages!.length)
    : data.score;

  const wcagCategories = [
    { name: "Perceivable", key: "perceivable" as const, ...principles.perceivable },
    { name: "Operable", key: "operable" as const, ...principles.operable },
    { name: "Understandable", key: "understandable" as const, ...principles.understandable },
    { name: "Robust", key: "robust" as const, ...principles.robust },
  ];

  const renderIssueCard = (issue: AccessibilityIssue, full = false) => {
    const config = severityConfig[issue.severity] ?? severityConfig.moderate;
    const SeverityIcon = config.icon;
    return (
      <div
        key={issue.id}
        className="rounded-lg border border-slate-800/50 bg-slate-800/20 p-4 hover:bg-slate-800/40 transition-colors"
      >
        <div className="flex items-start gap-4">
          <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${config.bg} border ${config.border}`}>
            <SeverityIcon className={`h-4 w-4 ${config.color}`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h4 className="text-sm font-medium text-white">{issue.title}</h4>
              {issue.wcag && (
                <a
                  href={issue.wcagUrl || `https://www.w3.org/WAI/WCAG22/quickref/`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 hover:opacity-80 transition-opacity"
                >
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0 cursor-pointer">
                    WCAG {issue.wcag} <ExternalLink className="h-2.5 w-2.5 ml-0.5" />
                  </Badge>
                </a>
              )}
            </div>
            {full && (
              <>
                {issue.pageUrl && (
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1.5">
                    <Globe className="h-3 w-3 shrink-0" />
                    <span className="truncate">{issue.pageUrl}</span>
                  </div>
                )}
                <div className="text-xs text-slate-400 mb-2">
                  Target: <span className="text-slate-300">{issue.target}</span> · {issue.count} instance{issue.count !== 1 ? "s" : ""}
                </div>
                <div className="rounded-md bg-slate-900/80 border border-slate-800 px-3 py-2 font-mono text-xs text-slate-400 mb-2 break-all max-h-32 overflow-y-auto">
                  {issue.element}
                </div>
                <div className="flex items-start gap-2 text-xs">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span className="text-slate-300">Fix: {issue.fix}</span>
                </div>
                {issue.helpUrl && (
                  <a
                    href={issue.helpUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex items-center gap-1 text-xs text-emerald-400 hover:underline"
                  >
                    <ExternalLink className="h-3 w-3" /> View Documentation
                  </a>
                )}
              </>
            )}
            {!full && (
              <div className="text-xs text-slate-400">{issue.count} instance{issue.count !== 1 ? "s" : ""} · {issue.target}</div>
            )}
          </div>
          <div className="flex gap-2 shrink-0">
            {full && (
              <Button variant="ghost" size="sm" className="h-8 text-xs">
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <motion.div initial="hidden" animate="visible" className="space-y-6">
      {/* Header */}
      <motion.div variants={fadeUp} custom={0} className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20">
            <Accessibility className="h-5 w-5 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Accessibility Auditor</h1>
            <p className="text-slate-400 text-sm">WCAG 2.2 AA compliance · Multi-device · axe-core</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-1" /> Export PDF
          </Button>
        </div>
      </motion.div>

      {/* Device Tabs */}
      <motion.div variants={fadeUp} custom={1}>
        <DeviceTabs
          results={results}
          currentDevice={currentDevice}
          onDeviceChange={setActiveDevice}
          accentColor="emerald"
        />
      </motion.div>

      {/* Screenshot + Score */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <motion.div variants={fadeUp} custom={2} className="lg:col-span-2">
          <ScreenshotCard
            screenshot={activeResult.screenshot}
            deviceName={activeResult.device.name}
            deviceType={activeResult.device.type}
            altText={`Screenshot of ${data.url} on ${activeResult.device.name}`}
            accentColor="emerald"
            screenshotOpen={screenshotOpen}
            onToggleScreenshot={() => setScreenshotOpen(!screenshotOpen)}
          />
        </motion.div>

        <motion.div variants={fadeUp} custom={3} className="space-y-4">
          <Card className="h-auto">
            <CardContent className="flex flex-col items-center justify-center p-6">
              <div className="text-xs font-medium uppercase tracking-wider text-slate-400 mb-3">
                {isMultiPage ? "Avg A11y Score" : "A11y Score"}
              </div>
              <WebGuardScoreRing score={avgScore} size={140} />
              <Badge variant="success" className="mt-4">WCAG 2.2 AA</Badge>
            </CardContent>
          </Card>

          {/* Severity Summary */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Critical", value: stats.critical, color: "text-red-400", bg: "border-red-500/20" },
              { label: "Serious", value: stats.serious, color: "text-amber-400", bg: "border-amber-500/20" },
              { label: "Moderate", value: stats.moderate, color: "text-blue-400", bg: "border-blue-500/20" },
              { label: "Minor", value: issues.filter((i) => i.severity === "minor").length, color: "text-slate-400", bg: "border-slate-500/20" },
            ].map((stat) => (
              <Card key={stat.label} className={stat.bg}>
                <CardContent className="p-3">
                  <div className={`text-xl font-bold ${stat.color}`}>{stat.value}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">{stat.label}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.div>
      </div>

      {/* WCAG Principles */}
      <motion.div variants={fadeUp} custom={4}>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">WCAG 2.2 Principles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {wcagCategories.map((cat) => {
                const Icon = principleIcons[cat.key];
                return (
                  <div key={cat.name} className="rounded-lg border border-slate-800/50 bg-slate-800/20 p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Icon className="h-4 w-4 text-emerald-400" />
                      <span className="text-sm font-medium text-white">{cat.name}</span>
                    </div>
                    <div className="text-2xl font-bold text-white mb-2">{cat.score}%</div>
                    <Progress value={cat.score} className="mb-2" />
                    <div className="text-xs text-slate-400">{cat.issueCount} issue{cat.issueCount !== 1 ? "s" : ""} found</div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Cross-device Comparison */}
      {results.length > 1 && (
        <motion.div variants={fadeUp} custom={5}>
          <CrossDeviceComparison
            results={results}
            currentDevice={currentDevice}
            onDeviceChange={setActiveDevice}
            accentColor="emerald"
            renderDetails={(r) => (
              <>
                <div className="text-xs text-slate-500 mt-1">{r.data.issues.length} issues</div>
                <div className="mt-2 flex gap-1.5 text-[10px]">
                  {r.data.stats.critical > 0 && (
                    <span className="text-red-400">{r.data.stats.critical} crit</span>
                  )}
                  {r.data.stats.serious > 0 && (
                    <span className="text-amber-400">{r.data.stats.serious} ser</span>
                  )}
                </div>
              </>
            )}
          />
        </motion.div>
      )}

      {/* Page-by-Page Results — expanded detail per page */}
      {(isMultiPage || streaming) && (
        <motion.div variants={fadeUp} custom={5.5} className="space-y-6">
          <div className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-emerald-400" />
            <h2 className="text-lg font-bold text-white">Page-by-Page Results</h2>
            <Badge variant="secondary">{activeResult.pages?.length ?? 0} pages scanned</Badge>
          </div>
          {activeResult.pages?.map((pg) => (
            <Card key={pg.url} className="overflow-hidden">
              <CardHeader className="pb-3 border-b border-slate-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <Globe className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span className="text-sm font-medium text-white truncate">{pg.url}</span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <WebGuardScoreRing score={pg.data.score} size={48} />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <PageA11ySections pageData={pg.data} />
              </CardContent>
            </Card>
          ))}

          {/* Streaming loader */}
          {streaming && (
            <Card className="border-emerald-500/20 bg-emerald-500/5">
              <CardContent className="py-6">
                <div className="flex items-center justify-center gap-3">
                  <Loader2 className="h-5 w-5 text-emerald-400 animate-spin" />
                  <span className="text-sm text-emerald-300">Scanning more pages…</span>
                  <Badge variant="secondary" className="text-xs">{activeResult.pages?.length ?? 0} scanned so far</Badge>
                </div>
              </CardContent>
            </Card>
          )}
        </motion.div>
      )}

      {/* Issues List */}
      <motion.div variants={fadeUp} custom={6}>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Issues Found — {activeResult.device.name}</CardTitle>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm">
                  <Filter className="h-4 w-4 mr-1" /> Filter
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {issues.length === 0 ? (
              <div className="text-center py-12">
                <CheckCircle2 className="h-10 w-10 text-emerald-400 mx-auto mb-3" />
                <p className="text-white font-medium">No accessibility issues found!</p>
                <p className="text-slate-400 text-sm mt-1">This page passes all checked WCAG 2.2 AA criteria on {activeResult.device.name}.</p>
              </div>
            ) : (
              <Tabs defaultValue="all">
                <TabsList className="flex-wrap">
                  <TabsTrigger value="all">All ({issues.length})</TabsTrigger>
                  <TabsTrigger value="critical">Critical ({stats.critical})</TabsTrigger>
                  <TabsTrigger value="serious">Serious ({stats.serious})</TabsTrigger>
                  <TabsTrigger value="moderate">Moderate ({stats.moderate})</TabsTrigger>
                  <TabsTrigger value="minor">Minor ({issues.filter((i) => i.severity === "minor").length})</TabsTrigger>
                  <TabsTrigger value="principle">By Principle</TabsTrigger>
                </TabsList>

                <TabsContent value="all" className="space-y-3">
                  {issues.map((issue) => renderIssueCard(issue, true))}
                </TabsContent>

                <TabsContent value="critical" className="space-y-3">
                  {issues.filter((i) => i.severity === "critical").length === 0 ? (
                    <div className="text-center py-8 text-slate-500 text-sm">No critical issues found.</div>
                  ) : (
                    issues.filter((i) => i.severity === "critical").map((issue) => renderIssueCard(issue, true))
                  )}
                </TabsContent>

                <TabsContent value="serious" className="space-y-3">
                  {issues.filter((i) => i.severity === "serious").length === 0 ? (
                    <div className="text-center py-8 text-slate-500 text-sm">No serious issues found.</div>
                  ) : (
                    issues.filter((i) => i.severity === "serious").map((issue) => renderIssueCard(issue, true))
                  )}
                </TabsContent>

                <TabsContent value="moderate" className="space-y-3">
                  {issues.filter((i) => i.severity === "moderate").length === 0 ? (
                    <div className="text-center py-8 text-slate-500 text-sm">No moderate issues found.</div>
                  ) : (
                    issues.filter((i) => i.severity === "moderate").map((issue) => renderIssueCard(issue, true))
                  )}
                </TabsContent>

                <TabsContent value="minor" className="space-y-3">
                  {issues.filter((i) => i.severity === "minor").length === 0 ? (
                    <div className="text-center py-8 text-slate-500 text-sm">No minor issues found.</div>
                  ) : (
                    issues.filter((i) => i.severity === "minor").map((issue) => renderIssueCard(issue, true))
                  )}
                </TabsContent>

                <TabsContent value="principle" className="space-y-6">
                  {(["perceivable", "operable", "understandable", "robust"] as WcagPrinciple[]).map((principle) => {
                    const PrincipleIcon = principleIcons[principle];
                    const principleIssues = issues.filter((i) => i.principle === principle);
                    if (principleIssues.length === 0) return null;
                    return (
                      <div key={principle}>
                        <div className="flex items-center gap-2 mb-3">
                          <PrincipleIcon className="h-4 w-4 text-emerald-400" />
                          <h3 className="text-sm font-semibold text-white capitalize">{principle}</h3>
                          <Badge variant="secondary" className="text-[10px]">{principleIssues.length}</Badge>
                        </div>
                        <div className="space-y-3">
                          {principleIssues.map((issue) => renderIssueCard(issue, true))}
                        </div>
                      </div>
                    );
                  })}
                </TabsContent>
              </Tabs>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
