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
} from "@/lib/types";

interface ScanContextType {
  url: string;
  setUrl: (url: string) => void;
  scannedUrl: string;
  selectedDevices: DeviceType[];
  setSelectedDevices: (d: DeviceType[]) => void;

  scanAccessibility: (inputUrl: string) => void;
  scanPerformance: (inputUrl: string) => void;
  scanSeo: (inputUrl: string) => void;

  accessibilityData: DeviceAccessibilityResult[] | null;
  accessibilityLoading: boolean;
  accessibilityError: string | null;
  performanceData: DevicePerformanceResult[] | null;
  performanceLoading: boolean;
  performanceError: string | null;
  seoData: DeviceSeoResult[] | null;
  seoLoading: boolean;
  seoError: string | null;
}

const ScanContext = createContext<ScanContextType | null>(null);

function normalizeUrl(input: string) {
  return input.startsWith("http") ? input : `https://${input}`;
}

export function ScanProvider({ children }: { children: ReactNode }) {
  const [url, setUrl] = useState("");
  const [scannedUrl, setScannedUrl] = useState("");
  const [selectedDevices, setSelectedDevices] = useState<DeviceType[]>(["desktop"]);

  const [accessibilityData, setAccessibilityData] = useState<DeviceAccessibilityResult[] | null>(null);
  const [accessibilityLoading, setAccessibilityLoading] = useState(false);
  const [accessibilityError, setAccessibilityError] = useState<string | null>(null);

  const [performanceData, setPerformanceData] = useState<DevicePerformanceResult[] | null>(null);
  const [performanceLoading, setPerformanceLoading] = useState(false);
  const [performanceError, setPerformanceError] = useState<string | null>(null);

  const [seoData, setSeoData] = useState<DeviceSeoResult[] | null>(null);
  const [seoLoading, setSeoLoading] = useState(false);
  const [seoError, setSeoError] = useState<string | null>(null);

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
          arr.map(({ screenshot: _s, ...rest }) => ({ ...rest, screenshot: "" }));
        const prev: Record<string, unknown>[] = JSON.parse(
          localStorage.getItem("webguard-scan-history") || "[]",
        );
        // Merge into existing entry for same URL or create new
        const existing = prev.find(
          (e: Record<string, unknown>) => e.url === scanUrl,
        );
        if (existing) {
          existing[category] = strip(data as { screenshot?: string }[]);
          existing.timestamp = Date.now();
          localStorage.setItem(
            "webguard-scan-history",
            JSON.stringify(prev.slice(0, 5)),
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
            "webguard-scan-history",
            JSON.stringify([entry, ...prev].slice(0, 5)),
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
      setUrl(normalized);
      setScannedUrl(normalized);
      setAccessibilityData(null);
      setAccessibilityLoading(true);
      setAccessibilityError(null);

      (async () => {
        try {
          const res = await fetch("/api/analyze/accessibility", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            cache: "no-store",
            body: JSON.stringify({ url: normalized, devices: selectedDevices }),
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
      setUrl(normalized);
      setScannedUrl(normalized);
      setPerformanceData(null);
      setPerformanceLoading(true);
      setPerformanceError(null);

      (async () => {
        try {
          const res = await fetch("/api/analyze/performance", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            cache: "no-store",
            body: JSON.stringify({ url: normalized, devices: selectedDevices }),
            signal: controller.signal,
          });
          if (!res.ok) {
            const err = await res.json().catch(() => ({ error: "Unknown error" }));
            throw new Error(err.error || `HTTP ${res.status}`);
          }
          const data = (await res.json()) as DevicePerformanceResult[];
          if (!controller.signal.aborted) {
            setPerformanceData(data);
            persistResult("performance", normalized, data);
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
    [selectedDevices, persistResult],
  );

  const scanSeo = useCallback(
    (inputUrl: string) => {
      if (!inputUrl.trim()) return;
      if (seoAbortRef.current) seoAbortRef.current.abort();
      const controller = new AbortController();
      seoAbortRef.current = controller;

      const normalized = normalizeUrl(inputUrl);
      setUrl(normalized);
      setScannedUrl(normalized);
      setSeoData(null);
      setSeoLoading(true);
      setSeoError(null);

      (async () => {
        try {
          const res = await fetch("/api/analyze/seo", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            cache: "no-store",
            body: JSON.stringify({ url: normalized, devices: selectedDevices }),
            signal: controller.signal,
          });
          if (!res.ok) {
            const err = await res.json().catch(() => ({ error: "Unknown error" }));
            throw new Error(err.error || `HTTP ${res.status}`);
          }
          const data = (await res.json()) as DeviceSeoResult[];
          if (!controller.signal.aborted) {
            setSeoData(data);
            persistResult("seo", normalized, data);
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

  return (
    <ScanContext.Provider
      value={{
        url,
        setUrl,
        scannedUrl,
        selectedDevices,
        setSelectedDevices,
        scanAccessibility,
        scanPerformance,
        scanSeo,
        accessibilityData,
        accessibilityLoading,
        accessibilityError,
        performanceData,
        performanceLoading,
        performanceError,
        seoData,
        seoLoading,
        seoError,
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