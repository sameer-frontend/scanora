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
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useScan } from "@/lib/scan-context";
import type { DeviceType } from "@/lib/types";
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
}

export function ScanForm({ onScan, scanning, accentColor, icon: Icon, title, description }: ScanFormProps) {
  const { scannedUrl, selectedDevices, setSelectedDevices } = useScan();
  const [url, setUrl] = useState(scannedUrl || "");
  const styles = accentStyles[accentColor];

  function handleSubmit() {
    const trimmed = url.trim();
    if (!trimmed) return;
    onScan(trimmed);
  }

  return (
    <div className="flex flex-col items-center justify-center h-[60vh] text-center">
      <div className={cn("flex h-16 w-16 items-center justify-center rounded-2xl border mb-4", styles.bg, styles.border)}>
        <Icon className={cn("h-8 w-8", styles.text)} />
      </div>
      <h2 className="text-xl font-bold text-white mb-2">{title}</h2>
      <p className="text-slate-400 text-sm max-w-md mb-8">{description}</p>

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
        <div className="grid grid-cols-4 gap-2">
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

        {/* Scan Button */}
        <Button
          onClick={handleSubmit}
          disabled={!url.trim() || scanning}
          className="w-full h-11 text-sm font-semibold"
          size="lg"
        >
          {scanning ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Scanning…
            </>
          ) : (
            <>
              <ScanSearch className="h-4 w-4 mr-2" />
              Start Scan
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
