import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { deviceIconMap, accentStyles } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { AccentColor } from "@/lib/constants";
import type { DeviceType, DeviceProfile } from "@/lib/types";
import type { ReactNode } from "react";

interface CrossDeviceComparisonProps<T extends { device: DeviceProfile; data: { score: number } }> {
  results: T[];
  currentDevice: DeviceType | null;
  onDeviceChange: (device: DeviceType) => void;
  accentColor: AccentColor;
  scoreThreshold?: number;
  renderDetails?: (result: T) => ReactNode;
}

export function CrossDeviceComparison<T extends { device: DeviceProfile; data: { score: number } }>({
  results,
  currentDevice,
  onDeviceChange,
  accentColor,
  scoreThreshold = 90,
  renderDetails,
}: CrossDeviceComparisonProps<T>) {
  const styles = accentStyles[accentColor];
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Cross-Device Comparison</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {results.map((r) => {
            const DevIcon = deviceIconMap[r.device.type];
            const isActive = r.device.type === currentDevice;
            return (
              <button
                key={r.device.type}
                onClick={() => onDeviceChange(r.device.type)}
                className={cn(
                  "rounded-lg border p-4 text-left transition-all",
                  isActive
                    ? `${styles.activeBorder} ${styles.activeBgLight}`
                    : "border-slate-800/50 bg-slate-800/20 hover:bg-slate-800/40"
                )}
              >
                <div className="flex items-center gap-2 mb-2">
                  <DevIcon className={cn("h-4 w-4", isActive ? styles.text : "text-slate-400")} />
                  <span className="text-sm font-medium text-white">{r.device.name}</span>
                </div>
                <div
                  className={cn(
                    "text-3xl font-bold",
                    r.data.score >= scoreThreshold
                      ? "text-emerald-400"
                      : r.data.score >= 50
                        ? "text-amber-400"
                        : "text-red-400"
                  )}
                >
                  {r.data.score}
                </div>
                {renderDetails?.(r)}
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
