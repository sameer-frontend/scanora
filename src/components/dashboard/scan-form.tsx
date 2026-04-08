"use client";

import { useState } from "react";
import {
  Globe,
  Smartphone,
  Tablet,
  Laptop,
  Monitor,
  Loader2,
  ScanSearch,
  ChevronDown,
  ChevronUp,
  Cpu,
  RotateCcw,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useScan } from "@/lib/scan-context";
import type { DeviceType } from "@/lib/types";
import { THROTTLE_PRESETS } from "@/lib/types";
import type { AccentColor } from "@/lib/constants";
import { accentStyles } from "@/lib/constants";
import { cn } from "@/lib/utils";

const deviceOptions: { type: DeviceType; label: string; icon: LucideIcon; desc: string }[] = [
  { type: "mobile", label: "Mobile", icon: Smartphone, desc: "375×812" },
  { type: "tablet", label: "Tablet", icon: Tablet, desc: "768×1024" },
  { type: "laptop", label: "Laptop", icon: Laptop, desc: "1366×768" },
  { type: "desktop", label: "Desktop", icon: Monitor, desc: "1920×1080" },
];

interface ScanFormProps {
  onScan: (url: string) => void;
  scanning: boolean;
  accentColor: AccentColor;
  icon: LucideIcon;
  title: string;
  description: string;
  scannedUrl?: string;
  hideDevicePicker?: boolean;
  showAdvancedOptions?: boolean;
}

export function ScanForm({ onScan, scanning, accentColor, icon: Icon, title, description, scannedUrl, hideDevicePicker, showAdvancedOptions = true }: ScanFormProps) {
  const {
    selectedDevices, setSelectedDevices,
    throttleProfile, setThrottleProfile,
    multiRunCount, setMultiRunCount,
    isAnyAuditRunning,
    getCurrentRunningAudit,
  } = useScan();
  const [url, setUrl] = useState(scannedUrl || "");
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const styles = accentStyles[accentColor];

  function handleSubmit() {
    const trimmed = url.trim();
    if (!trimmed) return;
    onScan(trimmed);
  }

  return (
    <div className="flex flex-col items-center justify-center mt-10 text-center px-4">
      <div className={cn("flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-2xl border mb-4", styles.bg, styles.border)}>
        <Icon className={cn("h-7 w-7 sm:h-8 sm:w-8", styles.text)} />
      </div>
      <h2 className="text-lg sm:text-xl font-bold text-white mb-2">{title}</h2>
      <p className="text-slate-400 text-sm max-w-md mb-6 sm:mb-8">{description}</p>

      <div className="w-full max-w-lg space-y-4">
        {/* URL Input */}
        <div className="relative">
          <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white" />
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleSubmit(); }}
            placeholder="https://example.com"
            className={cn(
              "h-11 w-full rounded-lg border border-slate-800 bg-slate-900/50 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none transition-colors",
              `focus:border-${accentColor}-500/50`,
            )}
          />
        </div>

        {/* Device Picker */}
        {!hideDevicePicker && (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {deviceOptions.map(({ type, label, icon: DeviceIcon, desc }) => {
              const active = selectedDevices.includes(type);
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => setSelectedDevices([type])}
                  className={cn(
                    "flex flex-col items-center gap-1 rounded-lg border p-3 transition-all text-xs",
                    active
                      ? cn(styles.bg, styles.border, styles.text)
                      : "border-slate-800 bg-slate-900/50 text-white hover:bg-slate-800/50",
                  )}
                >
                  <DeviceIcon className={cn("h-4 w-4", active ? styles.text : "text-white")} />
                  <span className="font-medium">{label}</span>
                  <span className="text-[10px] text-white">{desc}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Advanced Options Toggle */}
        {showAdvancedOptions && (
          <>
            <button
              type="button"
              onClick={() => setAdvancedOpen(!advancedOpen)}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors mx-auto"
            >
              {advancedOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              Advanced Options
            </button>

            {advancedOpen && (
              <div className="space-y-4 rounded-lg border border-slate-800 bg-slate-900/30 p-4 text-left">
                {/* Throttle Profile */}
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-medium text-slate-300 mb-2">
                    <Cpu className="h-3.5 w-3.5" /> Throttle Profile
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {THROTTLE_PRESETS.map((preset) => (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => setThrottleProfile(preset.id)}
                        className={cn(
                          "rounded-md border px-2 py-2 text-left transition-all",
                          throttleProfile === preset.id
                            ? cn(styles.bg, styles.border, styles.text)
                            : "border-slate-800 bg-slate-900/50 text-slate-400 hover:text-white hover:bg-slate-800/50"
                        )}
                      >
                        <div className="text-[11px] font-medium">{preset.icon} {preset.label}</div>
                        <div className="text-[10px] opacity-70">{preset.description}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Multi-Run Count */}
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-medium text-slate-300 mb-2">
                    <RotateCcw className="h-3.5 w-3.5" /> Multi-Run Averaging
                  </label>
                  <div className="flex gap-1.5">
                    {[1, 2].map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setMultiRunCount(n)}
                        className={cn(
                          "flex-1 rounded-md border px-2 py-1.5 text-xs font-medium transition-all",
                          multiRunCount === n
                            ? cn(styles.bg, styles.border, styles.text)
                            : "border-slate-800 bg-slate-900/50 text-slate-400 hover:text-white hover:bg-slate-800/50"
                        )}
                      >
                        {n === 1 ? "Single" : `${n} runs`}
                      </button>
                    ))}
                  </div>
                  {multiRunCount > 1 && (
                    <p className="text-[10px] text-slate-500 mt-1">Results will be averaged across {multiRunCount} runs for more reliable metrics.</p>
                  )}
                </div>
              </div>
            )}
          </>
        )}

        {/* Scan Button */}
        <Button
          onClick={handleSubmit}
          disabled={!url.trim() || scanning || isAnyAuditRunning}
          className="w-full h-11 text-sm font-semibold"
          size="lg"
        >
          {scanning ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Scanning…
            </>
          ) : isAnyAuditRunning ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Another Audit Running…
            </>
          ) : (
            <>
              <ScanSearch className="h-4 w-4 mr-2" />
              Start Scan
            </>
          )}
        </Button>

        {/* Message when another audit is running */}
        {isAnyAuditRunning && !scanning && getCurrentRunningAudit() && (
          <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-3 text-center">
            <p className="text-xs text-amber-200">
              <strong>{getCurrentRunningAudit()}</strong> audit is currently running.
            </p>
            <p className="text-xs text-amber-300 mt-1">
              Please wait for it to complete before starting a new audit.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
