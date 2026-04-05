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
  ScanMode,
} from "@/lib/types";

interface ScanContextType {
  url: string;
  setUrl: (url: string) => void;
  scanning: boolean;
  scannedUrl: string;
  scanMode: ScanMode;
  setScanMode: (m: ScanMode) => void;
  selectedDevices: DeviceType[];
  setSelectedDevices: (d: DeviceType[]) => void;
  startScan: (inputUrl: string) => void;
  scanTrigger: number;
  accessibilityData: DeviceAccessibilityResult[] | null;
  accessibilityLoading: boolean;
  accessibilityStreaming: boolean;
  accessibilityError: string | null;
  performanceData: DevicePerformanceResult[] | null;
  performanceLoading: boolean;
  performanceStreaming: boolean;
  performanceError: string | null;
  seoData: DeviceSeoResult[] | null;
  seoLoading: boolean;
  seoStreaming: boolean;
  seoError: string | null;
}

const ScanContext = createContext<ScanContextType | null>(null);

/* ── NDJSON stream reader ──────────────────────────────────── */
async function readNDJSONStream(
  response: Response,
  signal: AbortSignal,
  onEvent: (event: Record<string, unknown>) => void,
) {
  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      if (signal.aborted) break;
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop()!; // keep incomplete last line
      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          onEvent(JSON.parse(line));
        } catch { /* malformed JSON line, skip */ }
      }
    }
    // flush remaining buffer
    if (buffer.trim()) {
      try { onEvent(JSON.parse(buffer)); } catch { /* skip */ }
    }
  } finally {
    reader.releaseLock();
  }
}

export function ScanProvider({ children }: { children: ReactNode }) {
  const [url, setUrl] = useState("");
  const [scanning, setScanning] = useState(false);
  const [scannedUrl, setScannedUrl] = useState("");
  const [scanMode, setScanMode] = useState<ScanMode>("single");
  const [selectedDevices, setSelectedDevices] = useState<DeviceType[]>(["desktop"]);
  const [scanTrigger, setScanTrigger] = useState(0);

  const [accessibilityData, setAccessibilityData] = useState<DeviceAccessibilityResult[] | null>(null);
  const [accessibilityLoading, setAccessibilityLoading] = useState(false);
  const [accessibilityStreaming, setAccessibilityStreaming] = useState(false);
  const [accessibilityError, setAccessibilityError] = useState<string | null>(null);

  const [performanceData, setPerformanceData] = useState<DevicePerformanceResult[] | null>(null);
  const [performanceLoading, setPerformanceLoading] = useState(false);
  const [performanceStreaming, setPerformanceStreaming] = useState(false);
  const [performanceError, setPerformanceError] = useState<string | null>(null);

  const [seoData, setSeoData] = useState<DeviceSeoResult[] | null>(null);
  const [seoLoading, setSeoLoading] = useState(false);
  const [seoStreaming, setSeoStreaming] = useState(false);
  const [seoError, setSeoError] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const scanInitiatedRef = useRef(false);

  // Derive scanning from all loading + streaming flags
  const activeCount =
    (accessibilityLoading ? 1 : 0) +
    (performanceLoading ? 1 : 0) +
    (seoLoading ? 1 : 0) +
    (accessibilityStreaming ? 1 : 0) +
    (performanceStreaming ? 1 : 0) +
    (seoStreaming ? 1 : 0);

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
      setAccessibilityStreaming(false);
      setAccessibilityError(null);
      setPerformanceData(null);
      setPerformanceLoading(true);
      setPerformanceStreaming(false);
      setPerformanceError(null);
      setSeoData(null);
      setSeoLoading(true);
      setSeoStreaming(false);
      setSeoError(null);

      const body = JSON.stringify({
        url: normalized,
        devices: selectedDevices,
        scanMode,
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

          const ct = res.headers.get("content-type") || "";
          if (ct.includes("text/event-stream")) {
            // Streaming mode
            setAccessibilityLoading(false);
            setAccessibilityStreaming(true);
            await readNDJSONStream(res, controller.signal, (evt) => {
              if (controller.signal.aborted) return;
              switch (evt.type) {
                case "init":
                  setAccessibilityData((prev) => {
                    const entry: DeviceAccessibilityResult = {
                      device: evt.device as DeviceAccessibilityResult["device"],
                      screenshot: evt.screenshot as string,
                      data: evt.data as DeviceAccessibilityResult["data"],
                      pages: [{ url: (evt.data as DeviceAccessibilityResult["data"]).url, data: evt.data as DeviceAccessibilityResult["data"] }],
                    };
                    return prev ? [...prev, entry] : [entry];
                  });
                  break;
                case "page":
                  setAccessibilityData((prev) =>
                    prev?.map((r) =>
                      r.device.type === evt.deviceType
                        ? { ...r, pages: [...(r.pages || []), evt.page as { url: string; data: DeviceAccessibilityResult["data"] }] }
                        : r
                    ) ?? prev
                  );
                  break;
                case "error":
                  setAccessibilityError(evt.error as string);
                  break;
                case "done":
                  break;
              }
            });
            if (!controller.signal.aborted) setAccessibilityStreaming(false);
          } else {
            // JSON batch mode (single-page)
            const data = await res.json() as DeviceAccessibilityResult[];
            if (!controller.signal.aborted) setAccessibilityData(data);
            setAccessibilityLoading(false);
          }
        } catch (err) {
          if (!controller.signal.aborted) {
            setAccessibilityError(err instanceof Error ? err.message : String(err));
            setAccessibilityLoading(false);
            setAccessibilityStreaming(false);
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

          const ct = res.headers.get("content-type") || "";
          if (ct.includes("text/event-stream")) {
            setPerformanceLoading(false);
            setPerformanceStreaming(true);
            await readNDJSONStream(res, controller.signal, (evt) => {
              if (controller.signal.aborted) return;
              switch (evt.type) {
                case "init":
                  setPerformanceData((prev) => {
                    const entry: DevicePerformanceResult = {
                      device: evt.device as DevicePerformanceResult["device"],
                      screenshot: evt.screenshot as string,
                      data: evt.data as DevicePerformanceResult["data"],
                      pages: [{ url: (evt.data as DevicePerformanceResult["data"]).url, data: evt.data as DevicePerformanceResult["data"] }],
                    };
                    return prev ? [...prev, entry] : [entry];
                  });
                  break;
                case "page":
                  setPerformanceData((prev) =>
                    prev?.map((r) =>
                      r.device.type === evt.deviceType
                        ? { ...r, pages: [...(r.pages || []), evt.page as { url: string; data: DevicePerformanceResult["data"] }] }
                        : r
                    ) ?? prev
                  );
                  break;
                case "error":
                  setPerformanceError(evt.error as string);
                  break;
                case "done":
                  break;
              }
            });
            if (!controller.signal.aborted) setPerformanceStreaming(false);
          } else {
            const data = await res.json() as DevicePerformanceResult[];
            if (!controller.signal.aborted) setPerformanceData(data);
            setPerformanceLoading(false);
          }
        } catch (err) {
          if (!controller.signal.aborted) {
            setPerformanceError(err instanceof Error ? err.message : String(err));
            setPerformanceLoading(false);
            setPerformanceStreaming(false);
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

          const ct = res.headers.get("content-type") || "";
          if (ct.includes("text/event-stream")) {
            setSeoLoading(false);
            setSeoStreaming(true);
            await readNDJSONStream(res, controller.signal, (evt) => {
              if (controller.signal.aborted) return;
              switch (evt.type) {
                case "init":
                  setSeoData((prev) => {
                    const entry: DeviceSeoResult = {
                      device: evt.device as DeviceSeoResult["device"],
                      screenshot: evt.screenshot as string,
                      data: evt.data as DeviceSeoResult["data"],
                      pages: [{ url: (evt.data as DeviceSeoResult["data"]).url, data: evt.data as DeviceSeoResult["data"] }],
                    };
                    return prev ? [...prev, entry] : [entry];
                  });
                  break;
                case "page":
                  setSeoData((prev) =>
                    prev?.map((r) =>
                      r.device.type === evt.deviceType
                        ? { ...r, pages: [...(r.pages || []), evt.page as { url: string; data: DeviceSeoResult["data"] }] }
                        : r
                    ) ?? prev
                  );
                  break;
                case "error":
                  setSeoError(evt.error as string);
                  break;
                case "done":
                  break;
              }
            });
            if (!controller.signal.aborted) setSeoStreaming(false);
          } else {
            const data = await res.json() as DeviceSeoResult[];
            if (!controller.signal.aborted) setSeoData(data);
            setSeoLoading(false);
          }
        } catch (err) {
          if (!controller.signal.aborted) {
            setSeoError(err instanceof Error ? err.message : String(err));
            setSeoLoading(false);
            setSeoStreaming(false);
          }
        }
      })();
    },
    [selectedDevices, scanMode]
  );

  // Persist scan results to localStorage when all scans complete
  useEffect(() => {
    if (
      scanInitiatedRef.current &&
      scannedUrl &&
      !accessibilityLoading &&
      !accessibilityStreaming &&
      !performanceLoading &&
      !performanceStreaming &&
      !seoLoading &&
      !seoStreaming &&
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
    accessibilityStreaming,
    performanceLoading,
    performanceStreaming,
    seoLoading,
    seoStreaming,
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
        scanMode,
        setScanMode,
        selectedDevices,
        setSelectedDevices,
        startScan,
        scanTrigger,
        accessibilityData,
        accessibilityLoading,
        accessibilityStreaming,
        accessibilityError,
        performanceData,
        performanceLoading,
        performanceStreaming,
        performanceError,
        seoData,
        seoLoading,
        seoStreaming,
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
