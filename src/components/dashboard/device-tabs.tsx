import { cn } from "@/lib/utils";
import { deviceIconMap, accentStyles } from "@/lib/constants";
import type { AccentColor } from "@/lib/constants";
import type { DeviceType, DeviceProfile } from "@/lib/types";

interface DeviceTabsProps {
  results: { device: DeviceProfile; data: { score: number } }[];
  currentDevice: DeviceType | null;
  onDeviceChange: (device: DeviceType) => void;
  accentColor: AccentColor;
  scoreThreshold?: number;
}

export function DeviceTabs({
  results,
  currentDevice,
  onDeviceChange,
  accentColor,
  scoreThreshold = 90,
}: DeviceTabsProps) {
  const styles = accentStyles[accentColor];
  return (
    <div className="flex flex-wrap items-center gap-2">
      {results.map((r) => {
        const DevIcon = deviceIconMap[r.device.type];
        const isActive = r.device.type === currentDevice;
        return (
          <button
            key={r.device.type}
            onClick={() => onDeviceChange(r.device.type)}
            className={cn(
              "flex items-center gap-1.5 sm:gap-2 rounded-lg px-2.5 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-medium transition-all border",
              isActive
                ? `${styles.activeBg} ${styles.activeBorder} ${styles.text}`
                : "bg-slate-900/50 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800/50"
            )}
          >
            <DevIcon className="h-4 w-4" />
            <span>{r.device.name}</span>
            <span className="hidden sm:inline text-xs opacity-60">{r.device.width}×{r.device.height}</span>
            <span
              className={cn(
                "ml-1 text-xs font-bold",
                r.data.score >= scoreThreshold
                  ? "text-emerald-400"
                  : r.data.score >= 50
                    ? "text-amber-400"
                    : "text-red-400"
              )}
            >
              {r.data.score}
            </span>
          </button>
        );
      })}
    </div>
  );
}
