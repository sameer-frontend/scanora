"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
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
  scanning: boolean;
  scannedUrl: string;
  selectedDevices: DeviceType[];
  setSelectedDevices: (d: DeviceType[]) => void;
  startScan: (inputUrl: string) => void;
  scanTrigger: number;
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

export function ScanProvider({ children }: { children: ReactNode }) {
  const [url, setUrl] = useState("");
  const [scanning, setScanning] = useState(false);
  const [scannedUrl, setScannedUrl] = useState("");
  const [selectedDevices, setSelectedDevices] = useState<DeviceType[]>(["desktop"]);
  const [scanTrigger, setScanTrigger] = useState(0);

  const [accessibilityData, setAccessibilityData] = useState<DeviceAccessibilityResult[] | null>(null);
  const [accessibilityLoading, setAccessibilityLoading] = useState(false);
  const [accessibilityError, setAccessibilityError] = useState<string | null>(null);

  const [performanceData, setPerformanceData] = useState<DevicePerformanceResult[] | null>(null);
  const [performanceLoading, setPerformanceLoading] = useState(false);
  const [performanceError, setPerformanceError] = useState<string | null>(null);

  const [seoData, setSeoData] = useState<DeviceSeoResult[] | null>(null);
  const [seoLoading, setSeoLoading] = useState(false);
  const [seoError, setSeoError] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const scanInitiatedRef = useRef(false);

  // Derive scanning from all loading flags
  const activeCount =
    (accessibilityLoading ? 1 : 0) +
    (performanceLoading ? 1 : 0) +
    (seoLoading ? 1 : 0);

  useEffect(() => {
    if (activeCount === 0 && scanning) setScanning(false);
  }, [activeCount, scanning]);

  const startScan = useCallback(
    (inputUrl: string) => {
      if (!inputUrl.trim()) return;

      // Abort any in-flight scan
      if (abortRef.current) abortRef.current.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      const normalized = inputUrl.startsWith("http")
        ? inputUrl
        : `https://${inputUrl}`;

      setUrl(normalized);
      setScannedUrl(normalized);
      setScanning(true);
      setScanTrigger((p) => p + 1);
      scanInitiatedRef.current = true;

      // Reset states
      setAccessibilityData(null);
      setAccessibilityLoading(true);
      setAccessibilityError(null);
      setPerformanceData(null);
      setPerformanceLoading(true);
      setPerformanceError(null);
      setSeoData(null);
      setSeoLoading(true);
      setSeoError(null);

      const body = JSON.stringify({
        url: normalized,
        devices: selectedDevices,
      });

      // ── Accessibility scan ──────────────────────────────────
      (async () => {
        try {
          const res = await fetch("/api/analyze/accessibility", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            cache: "no-store",
            body,
            signal: controller.signal,
          });

          if (!res.ok) {
            const err = await res.json().catch(() => ({ error: "Unknown error" }));
            throw new Error(err.error || `HTTP ${res.status}`);
          }

          const data = await res.json() as DeviceAccessibilityResult[];
          if (!controller.signal.aborted) setAccessibilityData(data);
          setAccessibilityLoading(false);
        } catch (err) {
          if (!controller.signal.aborted) {
            setAccessibilityError(err instanceof Error ? err.message : String(err));
            setAccessibilityLoading(false);
          }
        }
      })();

      // ── Performance scan ────────────────────────────────────
      (async () => {
        try {
          const res = await fetch("/api/analyze/performance", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            cache: "no-store",
            body,
            signal: controller.signal,
          });

          if (!res.ok) {
            const err = await res.json().catch(() => ({ error: "Unknown error" }));
            throw new Error(err.error || `HTTP ${res.status}`);
          }

          const data = await res.json() as DevicePerformanceResult[];
          if (!controller.signal.aborted) setPerformanceData(data);
          setPerformanceLoading(false);
        } catch (err) {
          if (!controller.signal.aborted) {
            setPerformanceError(err instanceof Error ? err.message : String(err));
            setPerformanceLoading(false);
          }
        }
      })();

      // ── SEO scan ────────────────────────────────────────────
      (async () => {
        try {
          const res = await fetch("/api/analyze/seo", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            cache: "no-store",
            body,
            signal: controller.signal,
          });

          if (!res.ok) {
            const err = await res.json().catch(() => ({ error: "Unknown error" }));
            throw new Error(err.error || `HTTP ${res.status}`);
          }

          const data = await res.json() as DeviceSeoResult[];
          if (!controller.signal.aborted) setSeoData(data);
          setSeoLoading(false);
        } catch (err) {
          if (!controller.signal.aborted) {
            setSeoError(err instanceof Error ? err.message : String(err));
            setSeoLoading(false);
          }
        }
      })();
    },
    [selectedDevices]
  );

  // Persist scan results to localStorage when all scans complete
  useEffect(() => {
    if (
      scanInitiatedRef.current &&
      scannedUrl &&
      !accessibilityLoading &&
      !performanceLoading &&
      !seoLoading &&
      (accessibilityData || performanceData || seoData)
    ) {
      scanInitiatedRef.current = false;
      // Strip screenshots to save localStorage space
      const strip = <T extends { screenshot?: string }>(arr: T[] | null) =>
        arr?.map(({ screenshot: _s, ...rest }) => ({ ...rest, screenshot: "" })) ?? null;
      const entry = {
        url: scannedUrl,
        timestamp: Date.now(),
        accessibility: strip(accessibilityData),
        performance: strip(performanceData),
        seo: strip(seoData),
      };
      try {
        const prev = JSON.parse(localStorage.getItem("webguard-scan-history") || "[]");
        localStorage.setItem(
          "webguard-scan-history",
          JSON.stringify([entry, ...prev].slice(0, 5))
        );
      } catch {
        /* localStorage full or unavailable */
      }
    }
  }, [
    scannedUrl,
    accessibilityLoading,
    performanceLoading,
    seoLoading,
    accessibilityData,
    performanceData,
    seoData,
  ]);

  return (
    <ScanContext.Provider
      value={{
        url,
        setUrl,
        scanning,
        scannedUrl,
        selectedDevices,
        setSelectedDevices,
        startScan,
        scanTrigger,
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