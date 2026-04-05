import { Download, Maximize2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { accentStyles } from "@/lib/constants";
import type { AccentColor } from "@/lib/constants";

interface ScreenshotCardProps {
  screenshot: string;
  deviceName: string;
  deviceType: string;
  altText: string;
  accentColor: AccentColor;
  screenshotOpen: boolean;
  onToggleScreenshot: () => void;
  collapsedMaxH?: string;
  showDownload?: boolean;
}

export function ScreenshotCard({
  screenshot,
  deviceName,
  deviceType,
  altText,
  accentColor,
  screenshotOpen,
  onToggleScreenshot,
  collapsedMaxH = "max-h-75",
  showDownload = true,
}: ScreenshotCardProps) {
  const linkColor = accentStyles[accentColor].linkColor;
  return (
    <Card className="overflow-hidden h-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Screenshot — {deviceName}</CardTitle>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const w = window.open();
                if (w) {
                  w.document.write(`<img src="${screenshot}" style="max-width:100%;height:auto" />`);
                  w.document.title = `Screenshot — ${deviceName}`;
                }
              }}
              className={cn("text-xs hover:underline flex items-center gap-1", linkColor)}
            >
              <Maximize2 className="h-3 w-3" /> View Full
            </button>
            {showDownload && (
              <a
                href={screenshot}
                download={`screenshot-${deviceType}.jpg`}
                className={cn("text-xs hover:underline flex items-center gap-1", linkColor)}
              >
                <Download className="h-3 w-3" /> Download
              </a>
            )}
            <button
              onClick={onToggleScreenshot}
              className={cn("text-xs hover:underline", linkColor)}
            >
              {screenshotOpen ? "Collapse" : "Expand"}
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div
          className={cn(
            "relative overflow-hidden transition-all bg-slate-950 flex justify-center",
            screenshotOpen ? "max-h-150" : collapsedMaxH
          )}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={screenshot}
            alt={altText}
            className="w-auto h-full object-contain"
          />
          {!screenshotOpen && (
            <div className="absolute inset-x-0 bottom-0 h-20 bg-linear-to-t from-slate-950 to-transparent" />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
