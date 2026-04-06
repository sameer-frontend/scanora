"use client";
import { Suspense, lazy, useState } from "react";
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
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScanLoadingState, ScanErrorState } from "@/components/dashboard/scan-states";
import { ScanForm } from "@/components/dashboard/scan-form";
import { useScan } from "@/lib/scan-context";
import type { DeviceType, DeviceAccessibilityResult, AccessibilityIssue, WcagPrinciple } from "@/lib/types";
import { cn } from "@/lib/utils";

const WebGuardScoreRing = lazy(() => import("@/components/dashboard/score-ring").then(m => ({ default: m.WebGuardScoreRing })));
const DeviceTabs = lazy(() => import("@/components/dashboard/device-tabs").then(m => ({ default: m.DeviceTabs })));
const ScreenshotCard = lazy(() => import("@/components/dashboard/screenshot-card").then(m => ({ default: m.ScreenshotCard })));
const CrossDeviceComparison = lazy(() => import("@/components/dashboard/cross-device-comparison").then(m => ({ default: m.CrossDeviceComparison })));

function LazyFallback() {
  return <div className="h-32 animate-pulse rounded-xl bg-slate-800/40" />;
}

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

export default function AccessibilityPage() {
  const {
    accessibilityData: results,
    accessibilityLoading: loading,
    accessibilityError: error,
    scanAccessibility,
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
      <ScanForm
        onScan={scanAccessibility}
        scanning={loading}
        accentColor="emerald"
        icon={Accessibility}
        title="Accessibility Audit"
        description="Enter a URL and select a device to run a WCAG 2.2 accessibility audit powered by Playwright and axe-core."
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
      />
    );
  }

  // Error
  if (error) {
    return <ScanErrorState error={error} />;
  }

  if (!results || !activeResult) return null;

  const data = activeResult.data;
  const issues = data.issues;
  const stats = data.stats;
  const principles = data.principles;
  const avgScore = data.score;

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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
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
      </div>

      {/* Device Tabs */}
      <Suspense fallback={<LazyFallback />}>
        <DeviceTabs
          results={results}
          currentDevice={currentDevice}
          onDeviceChange={setActiveDevice}
          accentColor="emerald"
        />
      </Suspense>

      {/* Screenshot + Score */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Suspense fallback={<LazyFallback />}>
            <ScreenshotCard
              screenshot={activeResult.screenshot}
              deviceName={activeResult.device.name}
              deviceType={activeResult.device.type}
              altText={`Screenshot of ${data.url} on ${activeResult.device.name}`}
              accentColor="emerald"
              screenshotOpen={screenshotOpen}
              onToggleScreenshot={() => setScreenshotOpen(!screenshotOpen)}
            />
          </Suspense>
        </div>

        <div className="space-y-4">
          <Card className="h-auto">
            <CardContent className="flex flex-col items-center justify-center p-6">
              <div className="text-xs font-medium uppercase tracking-wider text-slate-400 mb-3">
                A11y Score
              </div>
              <Suspense fallback={<div className="h-35 w-35 animate-pulse rounded-full bg-slate-800/40" />}>
                <WebGuardScoreRing score={avgScore} size={140} />
              </Suspense>
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
        </div>
      </div>

      {/* WCAG Principles */}
      <div>
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
      </div>

      {/* Cross-device Comparison */}
      {results.length > 1 && (
        <Suspense fallback={<LazyFallback />}>
          <CrossDeviceComparison
            results={results}
            currentDevice={currentDevice}
            onDeviceChange={setActiveDevice}
            accentColor="emerald"
            renderDetails={(r) => {
              const d = r as DeviceAccessibilityResult;
              return (
                <>
                  <div className="text-xs text-slate-500 mt-1">{d.data.issues.length} issues</div>
                  <div className="mt-2 flex gap-1.5 text-[10px]">
                    {d.data.stats.critical > 0 && (
                      <span className="text-red-400">{d.data.stats.critical} crit</span>
                    )}
                    {d.data.stats.serious > 0 && (
                      <span className="text-amber-400">{d.data.stats.serious} ser</span>
                    )}
                  </div>
                </>
              );
            }}
          />
        </Suspense>
      )}

      {/* Issues List */}
      <div>
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
      </div>
    </div>
  );
}
