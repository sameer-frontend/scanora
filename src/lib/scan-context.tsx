"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  type ReactNode,
} from "react";
import type {
  DeviceType,
  DeviceAccessibilityResult,
  DevicePerformanceResult,
  DeviceSeoResult,
  ThrottleProfile,
  BundleAnalysis,
  NextJsAnalysis,
  ABComparisonResult,
  SeoDeepAudit,
  MultiRunStats,
  CWVTimeline,
} from "@/lib/types";

interface ScanContextType {
  selectedDevices: DeviceType[];
  setSelectedDevices: (d: DeviceType[]) => void;

  // Scan options
  throttleProfile: ThrottleProfile;
  setThrottleProfile: (p: ThrottleProfile) => void;
  multiRunCount: number;
  setMultiRunCount: (n: number) => void;

  scanAccessibility: (inputUrl: string) => void;
  accessibilityScannedUrl: string;
  accessibilityData: DeviceAccessibilityResult[] | null;
  accessibilityLoading: boolean;
  accessibilityError: string | null;
  clearAccessibility: () => void;

  scanPerformance: (inputUrl: string) => void;
  performanceScannedUrl: string;
  performanceData: DevicePerformanceResult[] | null;
  performanceLoading: boolean;
  performanceError: string | null;
  clearPerformance: () => void;

  // Multi-run stats
  multiRunStats: MultiRunStats | null;
  cwvTimeline: CWVTimeline | null;

  scanSeo: (inputUrl: string) => void;
  seoScannedUrl: string;
  seoData: DeviceSeoResult[] | null;
  seoLoading: boolean;
  seoError: string | null;
  clearSeo: () => void;

  // SEO Deep Audit
  seoDeepAudit: SeoDeepAudit | null;

  // Bundle Analysis
  fetchBundleAnalysis: (inputUrl: string) => void;
  bundleAnalysis: BundleAnalysis | null;
  bundleLoading: boolean;
  bundleError: string | null;
  clearBundleAnalysis: () => void;

  // Next.js Insights
  fetchNextJsInsights: (inputUrl: string) => void;
  nextJsAnalysis: NextJsAnalysis | null;
  nextJsLoading: boolean;
  nextJsError: string | null;
  clearNextJsInsights: () => void;

  // A/B Comparison
  runABComparison: (urlA: string, urlB: string) => void;
  abComparison: ABComparisonResult | null;
  abLoading: boolean;
  abError: string | null;
  clearABComparison: () => void;
}

const ScanContext = createContext<ScanContextType | null>(null);

function normalizeUrl(input: string) {
  return input.startsWith("http") ? input : `https://${input}`;
}

export function ScanProvider({ children }: { children: ReactNode }) {
  const [selectedDevices, setSelectedDevices] = useState<DeviceType[]>(["desktop"]);
  const [throttleProfile, setThrottleProfile] = useState<ThrottleProfile>("desktop-high");
  const [multiRunCount, setMultiRunCount] = useState(1);

  const [accessibilityScannedUrl, setAccessibilityScannedUrl] = useState("");
  const [accessibilityData, setAccessibilityData] = useState<DeviceAccessibilityResult[] | null>(null);
  const [accessibilityLoading, setAccessibilityLoading] = useState(false);
  const [accessibilityError, setAccessibilityError] = useState<string | null>(null);

  const [performanceScannedUrl, setPerformanceScannedUrl] = useState("");
  const [performanceData, setPerformanceData] = useState<DevicePerformanceResult[] | null>(null);
  const [performanceLoading, setPerformanceLoading] = useState(false);
  const [performanceError, setPerformanceError] = useState<string | null>(null);

  const [multiRunStats, setMultiRunStats] = useState<MultiRunStats | null>(null);
  const [cwvTimeline, setCwvTimeline] = useState<CWVTimeline | null>(null);

  const [seoScannedUrl, setSeoScannedUrl] = useState("");
  const [seoData, setSeoData] = useState<DeviceSeoResult[] | null>(null);
  const [seoLoading, setSeoLoading] = useState(false);
  const [seoError, setSeoError] = useState<string | null>(null);

  const [seoDeepAudit, setSeoDeepAudit] = useState<SeoDeepAudit | null>(null);

  const [bundleAnalysis, setBundleAnalysis] = useState<BundleAnalysis | null>(null);
  const [bundleLoading, setBundleLoading] = useState(false);
  const [bundleError, setBundleError] = useState<string | null>(null);

  const [nextJsAnalysis, setNextJsAnalysis] = useState<NextJsAnalysis | null>(null);
  const [nextJsLoading, setNextJsLoading] = useState(false);
  const [nextJsError, setNextJsError] = useState<string | null>(null);

  const [abComparison, setAbComparison] = useState<ABComparisonResult | null>(null);
  const [abLoading, setAbLoading] = useState(false);
  const [abError, setAbError] = useState<string | null>(null);

  const a11yAbortRef = useRef<AbortController | null>(null);
  const perfAbortRef = useRef<AbortController | null>(null);
  const seoAbortRef = useRef<AbortController | null>(null);

  const persistResult = useCallback(
    (
      category: "accessibility" | "performance" | "seo",
      scanUrl: string,
      data: unknown,
    ) => {
      try {
        const strip = <T extends { screenshot?: string }>(arr: T[]) =>
          arr.map((item) => ({ ...item, screenshot: "" }));
        const prev: Record<string, unknown>[] = JSON.parse(
          localStorage.getItem("AuditWave-scan-history") || "[]",
        );
        // Merge into existing entry for same URL or create new
        const existing = prev.find(
          (e: Record<string, unknown>) => e.url === scanUrl,
        );
        if (existing) {
          existing[category] = strip(data as { screenshot?: string }[]);
          existing.timestamp = Date.now();
          localStorage.setItem(
            "AuditWave-scan-history",
            JSON.stringify(prev),
          );
        } else {
          const entry = {
            url: scanUrl,
            timestamp: Date.now(),
            accessibility: null,
            performance: null,
            seo: null,
            [category]: strip(data as { screenshot?: string }[]),
          };
          localStorage.setItem(
            "AuditWave-scan-history",
            JSON.stringify([entry, ...prev]),
          );
        }
      } catch {
        /* localStorage full or unavailable */
      }
    },
    [],
  );

  const scanAccessibility = useCallback(
    (inputUrl: string) => {
      if (!inputUrl.trim()) return;
      if (a11yAbortRef.current) a11yAbortRef.current.abort();
      const controller = new AbortController();
      a11yAbortRef.current = controller;

      const normalized = normalizeUrl(inputUrl);
      setAccessibilityScannedUrl(normalized);
      setAccessibilityData(null);
      setAccessibilityLoading(true);
      setAccessibilityError(null);

      (async () => {
        try {
          const res = await fetch("/api/analyze/accessibility", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            cache: "no-store",
            body: JSON.stringify({
              url: normalized,
              devices: selectedDevices,
            }),
            signal: controller.signal,
          });
          if (!res.ok) {
            const err = await res.json().catch(() => ({ error: "Unknown error" }));
            throw new Error(err.error || `HTTP ${res.status}`);
          }
          const data = (await res.json()) as DeviceAccessibilityResult[];
          if (!controller.signal.aborted) {
            setAccessibilityData(data);
            persistResult("accessibility", normalized, data);
          }
        } catch (err) {
          if (!controller.signal.aborted) {
            setAccessibilityError(err instanceof Error ? err.message : String(err));
          }
        } finally {
          if (!controller.signal.aborted) setAccessibilityLoading(false);
        }
      })();
    },
    [selectedDevices, persistResult],
  );

  const scanPerformance = useCallback(
    (inputUrl: string) => {
      if (!inputUrl.trim()) return;
      if (perfAbortRef.current) perfAbortRef.current.abort();
      const controller = new AbortController();
      perfAbortRef.current = controller;

      const normalized = normalizeUrl(inputUrl);
      setPerformanceScannedUrl(normalized);
      setPerformanceData(null);
      setPerformanceLoading(true);
      setPerformanceError(null);
      setMultiRunStats(null);
      setCwvTimeline(null);

      (async () => {
        try {
          const res = await fetch("/api/analyze/performance", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            cache: "no-store",
            body: JSON.stringify({
              url: normalized,
              devices: selectedDevices,
              throttleProfile,
              runs: multiRunCount,
            }),
            signal: controller.signal,
          });
          if (!res.ok) {
            const err = await res.json().catch(() => ({ error: "Unknown error" }));
            throw new Error(err.error || `HTTP ${res.status}`);
          }
          const json = await res.json();
          if (!controller.signal.aborted) {
            // API returns { results, multiRunStats?, cwvTimeline? } when runs > 1
            if (json.results) {
              setPerformanceData(json.results as DevicePerformanceResult[]);
              if (json.multiRunStats) setMultiRunStats(json.multiRunStats as MultiRunStats);
              if (json.cwvTimeline) setCwvTimeline(json.cwvTimeline as CWVTimeline);
              persistResult("performance", normalized, json.results);
            } else {
              // Single run compat - results is the top level array
              const data = json as DevicePerformanceResult[];
              setPerformanceData(data);
              persistResult("performance", normalized, data);
            }
          }
        } catch (err) {
          if (!controller.signal.aborted) {
            setPerformanceError(err instanceof Error ? err.message : String(err));
          }
        } finally {
          if (!controller.signal.aborted) setPerformanceLoading(false);
        }
      })();
    },
    [selectedDevices, throttleProfile, multiRunCount, persistResult],
  );

  const scanSeo = useCallback(
    (inputUrl: string) => {
      if (!inputUrl.trim()) return;
      if (seoAbortRef.current) seoAbortRef.current.abort();
      const controller = new AbortController();
      seoAbortRef.current = controller;

      const normalized = normalizeUrl(inputUrl);
      setSeoScannedUrl(normalized);
      setSeoData(null);
      setSeoLoading(true);
      setSeoError(null);
      setSeoDeepAudit(null);

      (async () => {
        try {
          const res = await fetch("/api/analyze/seo", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            cache: "no-store",
            body: JSON.stringify({
              url: normalized,
              devices: selectedDevices,
              deepAudit: true,
            }),
            signal: controller.signal,
          });
          if (!res.ok) {
            const err = await res.json().catch(() => ({ error: "Unknown error" }));
            throw new Error(err.error || `HTTP ${res.status}`);
          }
          const json = await res.json();
          if (!controller.signal.aborted) {
            if (json.results) {
              setSeoData(json.results as DeviceSeoResult[]);
              if (json.deepAudit) setSeoDeepAudit(json.deepAudit as SeoDeepAudit);
              persistResult("seo", normalized, json.results);
            } else {
              const data = json as DeviceSeoResult[];
              setSeoData(data);
              persistResult("seo", normalized, data);
            }
          }
        } catch (err) {
          if (!controller.signal.aborted) {
            setSeoError(err instanceof Error ? err.message : String(err));
          }
        } finally {
          if (!controller.signal.aborted) setSeoLoading(false);
        }
      })();
    },
    [selectedDevices, persistResult],
  );

  const clearAccessibility = useCallback(() => {
    setAccessibilityScannedUrl("");
    setAccessibilityData(null);
    setAccessibilityLoading(false);
    setAccessibilityError(null);
  }, []);

  const clearPerformance = useCallback(() => {
    setPerformanceScannedUrl("");
    setPerformanceData(null);
    setPerformanceLoading(false);
    setPerformanceError(null);
    setMultiRunStats(null);
    setCwvTimeline(null);
  }, []);

  const clearSeo = useCallback(() => {
    setSeoScannedUrl("");
    setSeoData(null);
    setSeoLoading(false);
    setSeoError(null);
    setSeoDeepAudit(null);
  }, []);

  // ── Bundle Analysis ──────────────────────────────────────────
  const bundleAbortRef = useRef<AbortController | null>(null);

  const fetchBundleAnalysis = useCallback((inputUrl: string) => {
    if (!inputUrl.trim()) return;
    if (bundleAbortRef.current) bundleAbortRef.current.abort();
    const controller = new AbortController();
    bundleAbortRef.current = controller;

    const normalized = normalizeUrl(inputUrl);
    setBundleAnalysis(null);
    setBundleLoading(true);
    setBundleError(null);

    (async () => {
      try {
        const res = await fetch("/api/analyze/bundle", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          cache: "no-store",
          body: JSON.stringify({ url: normalized }),
          signal: controller.signal,
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: "Unknown error" }));
          throw new Error(err.error || `HTTP ${res.status}`);
        }
        const data = (await res.json()) as BundleAnalysis;
        if (!controller.signal.aborted) setBundleAnalysis(data);
      } catch (err) {
        if (!controller.signal.aborted) {
          setBundleError(err instanceof Error ? err.message : String(err));
        }
      } finally {
        if (!controller.signal.aborted) setBundleLoading(false);
      }
    })();
  }, []);

  const clearBundleAnalysis = useCallback(() => {
    setBundleAnalysis(null);
    setBundleLoading(false);
    setBundleError(null);
  }, []);

  // ── Next.js Insights ─────────────────────────────────────────
  const nextJsAbortRef = useRef<AbortController | null>(null);

  const fetchNextJsInsights = useCallback((inputUrl: string) => {
    if (!inputUrl.trim()) return;
    if (nextJsAbortRef.current) nextJsAbortRef.current.abort();
    const controller = new AbortController();
    nextJsAbortRef.current = controller;

    const normalized = normalizeUrl(inputUrl);
    setNextJsAnalysis(null);
    setNextJsLoading(true);
    setNextJsError(null);

    (async () => {
      try {
        const res = await fetch("/api/analyze/nextjs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          cache: "no-store",
          body: JSON.stringify({ url: normalized }),
          signal: controller.signal,
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: "Unknown error" }));
          throw new Error(err.error || `HTTP ${res.status}`);
        }
        const data = (await res.json()) as NextJsAnalysis;
        if (!controller.signal.aborted) setNextJsAnalysis(data);
      } catch (err) {
        if (!controller.signal.aborted) {
          setNextJsError(err instanceof Error ? err.message : String(err));
        }
      } finally {
        if (!controller.signal.aborted) setNextJsLoading(false);
      }
    })();
  }, []);

  const clearNextJsInsights = useCallback(() => {
    setNextJsAnalysis(null);
    setNextJsLoading(false);
    setNextJsError(null);
  }, []);

  // ── A/B Comparison ───────────────────────────────────────────
  const abAbortRef = useRef<AbortController | null>(null);

  const runABComparison = useCallback((urlA: string, urlB: string) => {
    if (!urlA.trim() || !urlB.trim()) return;
    if (abAbortRef.current) abAbortRef.current.abort();
    const controller = new AbortController();
    abAbortRef.current = controller;

    setAbComparison(null);
    setAbLoading(true);
    setAbError(null);

    (async () => {
      try {
        const res = await fetch("/api/analyze/ab-compare", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          cache: "no-store",
          body: JSON.stringify({
            urlA: normalizeUrl(urlA),
            urlB: normalizeUrl(urlB),
            device: selectedDevices[0] || "desktop",
            throttleProfile,
          }),
          signal: controller.signal,
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: "Unknown error" }));
          throw new Error(err.error || `HTTP ${res.status}`);
        }
        const data = (await res.json()) as ABComparisonResult;
        if (!controller.signal.aborted) setAbComparison(data);
      } catch (err) {
        if (!controller.signal.aborted) {
          setAbError(err instanceof Error ? err.message : String(err));
        }
      } finally {
        if (!controller.signal.aborted) setAbLoading(false);
      }
    })();
  }, [selectedDevices, throttleProfile]);

  const clearABComparison = useCallback(() => {
    setAbComparison(null);
    setAbLoading(false);
    setAbError(null);
  }, []);

  return (
    <ScanContext.Provider
      value={{
        selectedDevices,
        setSelectedDevices,
        throttleProfile,
        setThrottleProfile,
        multiRunCount,
        setMultiRunCount,

        scanAccessibility,
        accessibilityScannedUrl,
        accessibilityData,
        accessibilityLoading,
        accessibilityError,
        clearAccessibility,

        scanPerformance,
        performanceScannedUrl,
        performanceData,
        performanceLoading,
        performanceError,
        clearPerformance,
        multiRunStats,
        cwvTimeline,

        scanSeo,
        seoScannedUrl,
        seoData,
        seoLoading,
        seoError,
        clearSeo,
        seoDeepAudit,

        fetchBundleAnalysis,
        bundleAnalysis,
        bundleLoading,
        bundleError,
        clearBundleAnalysis,

        fetchNextJsInsights,
        nextJsAnalysis,
        nextJsLoading,
        nextJsError,
        clearNextJsInsights,

        runABComparison,
        abComparison,
        abLoading,
        abError,
        clearABComparison,
      }}
    >
      {children}
    </ScanContext.Provider>
  );
}

export function useScan() {
  const ctx = useContext(ScanContext);
  if (!ctx) throw new Error("useScan must be used within ScanProvider");
  return ctx;
}