"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ScanSearch,
  Smartphone,
  Tablet,
  Laptop,
  Monitor,
  File,
  FileStack,
  Loader2,
  Globe,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useScan } from "@/lib/scan-context";
import { fadeUp } from "@/lib/constants";
import type { DeviceType } from "@/lib/types";
import { cn } from "@/lib/utils";

const deviceOptions: { type: DeviceType; label: string; icon: typeof Smartphone; desc: string }[] = [
  { type: "mobile", label: "Mobile", icon: Smartphone, desc: "375×812 · 3x · iPhone" },
  { type: "tablet", label: "Tablet", icon: Tablet, desc: "768×1024 · 2x · iPad" },
  { type: "laptop", label: "Laptop", icon: Laptop, desc: "1366×768 · 1x" },
  { type: "desktop", label: "Desktop", icon: Monitor, desc: "1920×1080 · 1x" },
];

export default function ScanPage() {
  const router = useRouter();
  const {
    startScan,
    scanning,
    scanMode,
    setScanMode,
    selectedDevices,
    setSelectedDevices,
  } = useScan();

  const [url, setUrl] = useState("");

  function handleStartScan() {
    const trimmed = url.trim();
    if (!trimmed) return;
    startScan(trimmed);
    router.push("/dashboard/accessibility");
  }

  return (
    <motion.div initial="hidden" animate="visible" className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <motion.div variants={fadeUp} custom={0} className="text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/20 mx-auto mb-4">
          <ScanSearch className="h-7 w-7 text-emerald-400" />
        </div>
        <h1 className="text-2xl font-bold text-white">New Scan</h1>
        <p className="text-slate-400 text-sm mt-1">
          Configure and launch a Playwright-powered accessibility &amp; performance audit.
        </p>
      </motion.div>

      {/* URL Input */}
      <motion.div variants={fadeUp} custom={1}>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Globe className="h-4 w-4 text-emerald-400" />
              Target URL
            </CardTitle>
          </CardHeader>
          <CardContent>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleStartScan();
              }}
              placeholder="https://example.com"
              className="h-11 w-full rounded-lg border border-slate-800 bg-slate-900/50 px-4 text-sm text-white placeholder-slate-500 focus:border-emerald-500/50 focus:outline-none transition-colors"
            />
          </CardContent>
        </Card>
      </motion.div>

      {/* Crawl Mode */}
      <motion.div variants={fadeUp} custom={2}>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Crawl Mode</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setScanMode("single")}
                className={cn(
                  "flex flex-col items-center gap-2 rounded-lg border p-5 transition-all",
                  scanMode === "single"
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                    : "border-slate-800 bg-slate-900/50 text-slate-400 hover:bg-slate-800/50"
                )}
              >
                <File className={cn("h-6 w-6", scanMode === "single" ? "text-emerald-400" : "text-slate-500")} />
                <span className="text-sm font-medium">Single Page</span>
                <span className="text-[11px] text-slate-500">Scan only the entered URL</span>
              </button>
              <button
                type="button"
                onClick={() => setScanMode("full-site")}
                className={cn(
                  "flex flex-col items-center gap-2 rounded-lg border p-5 transition-all",
                  scanMode === "full-site"
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                    : "border-slate-800 bg-slate-900/50 text-slate-400 hover:bg-slate-800/50"
                )}
              >
                <FileStack className={cn("h-6 w-6", scanMode === "full-site" ? "text-emerald-400" : "text-slate-500")} />
                <span className="text-sm font-medium">Full Site</span>
                <span className="text-[11px] text-slate-500">Crawl entire site</span>
              </button>
            </div>
            {scanMode === "full-site" && (
              <div className="mt-3 flex items-center gap-2 rounded-lg bg-amber-500/10 border border-amber-500/20 px-3 py-2">
                <Globe className="h-4 w-4 text-amber-400 shrink-0" />
                <span className="text-xs text-amber-300">
                  Full-site crawl will discover and scan all same-origin pages found on the entered URL.
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Devices */}
      <motion.div variants={fadeUp} custom={3}>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Devices</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {deviceOptions.map(({ type, label, icon: Icon, desc }) => {
                const active = selectedDevices.includes(type);
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => {
                      setSelectedDevices([type]);
                    }}
                    className={cn(
                      "flex flex-col items-center gap-1.5 rounded-lg border p-4 transition-all",
                      active
                        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                        : "border-slate-800 bg-slate-900/50 text-slate-400 hover:bg-slate-800/50"
                    )}
                  >
                    <Icon className={cn("h-5 w-5", active ? "text-emerald-400" : "text-slate-500")} />
                    <span className="text-sm font-medium">{label}</span>
                    <span className="text-[10px] text-slate-500">{desc}</span>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Start Scan Button */}
      <motion.div variants={fadeUp} custom={4}>
        <Button
          onClick={handleStartScan}
          disabled={!url.trim() || scanning}
          className="w-full h-12 text-base font-semibold"
          size="lg"
        >
          {scanning ? (
            <>
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              Scanning…
            </>
          ) : (
            <>
              <ScanSearch className="h-5 w-5 mr-2" />
              Start Scan
            </>
          )}
        </Button>
      </motion.div>
    </motion.div>
  );
}
