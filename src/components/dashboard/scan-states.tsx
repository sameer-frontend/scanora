import { Loader2, RefreshCw, SearchX, PenLine } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { AccentColor } from "@/lib/constants";
import { accentStyles } from "@/lib/constants";

interface ScanEmptyStateProps {
  icon: LucideIcon;
  accentColor: AccentColor;
  description: string;
  children?: ReactNode;
}

export function ScanEmptyState({ icon: Icon, accentColor, description, children }: ScanEmptyStateProps) {
  const styles = accentStyles[accentColor];
  return (
    <div className="flex flex-col items-center justify-center min-h-[40vh] sm:min-h-[50vh] md:h-[60vh] text-center px-4">
      <div className={cn("flex h-16 w-16 items-center justify-center rounded-2xl border mb-4", styles.bg, styles.border)}>
        <Icon className={cn("h-8 w-8", styles.text)} />
      </div>
      <h2 className="text-xl font-bold text-white mb-2">No Scan Yet</h2>
      <p className="text-slate-400 text-sm max-w-md">{description}</p>
      {children}
    </div>
  );
}

interface ScanLoadingStateProps {
  accentColor: AccentColor;
  title: string;
  description: string;
  children?: ReactNode;
}

export function ScanLoadingState({ accentColor, title, description, children }: ScanLoadingStateProps) {
  const styles = accentStyles[accentColor];
  return (
    <div className="flex flex-col items-center justify-center min-h-[40vh] sm:min-h-[50vh] md:h-[60vh] text-center px-4">
      <div className="relative mb-6">
        <div className={cn("absolute inset-0 rounded-full animate-ping", styles.pingBg)} />
        <div className={cn("relative flex h-16 w-16 items-center justify-center rounded-full border", styles.bg, styles.border)}>
          <Loader2 className={cn("h-8 w-8 animate-spin", styles.text)} />
        </div>
      </div>
      <h2 className="text-xl font-bold text-white mb-2">{title}</h2>
      <p className="text-slate-400 text-sm max-w-md">{description}</p>
      {children}
    </div>
  );
}

interface ScanErrorStateProps {
  error: string;
  onRetry?: () => void;
  onNewUrl?: (url: string) => void;
  accentColor?: AccentColor;
}

export function ScanErrorState({ error, onRetry, onNewUrl }: ScanErrorStateProps) {
  const [showInput, setShowInput] = useState(false);
  const [url, setUrl] = useState("");

  return (
    <div className="flex flex-col items-center justify-center min-h-[40vh] sm:min-h-[50vh] md:h-[60vh] text-center px-4">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10 border border-red-500/20 mb-4">
        <SearchX className="h-8 w-8 text-red-400" />
      </div>
      <h2 className="text-xl font-bold text-white mb-2">Scan Failed</h2>
      <p className="text-red-400 text-sm max-w-md mb-6">{error}</p>

      <div className="flex items-center gap-3">
        {onRetry && (
          <Button variant="outline" size="sm" onClick={onRetry}>
            <RefreshCw className="h-4 w-4 mr-1.5" />
            Try Again
          </Button>
        )}
        {onNewUrl && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowInput(!showInput)}
          >
            <PenLine className="h-4 w-4 mr-1.5" />
            Enter New URL
          </Button>
        )}
      </div>

      {showInput && onNewUrl && (
        <div className="mt-4 flex items-center gap-2 w-full max-w-md">
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && url.trim()) onNewUrl(url.trim());
            }}
            placeholder="https://example.com"
            className="h-10 flex-1 rounded-lg border border-slate-800 bg-slate-900/50 px-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-slate-600 transition-colors"
            autoFocus
          />
          <Button
            size="sm"
            disabled={!url.trim()}
            onClick={() => onNewUrl(url.trim())}
          >
            Scan
          </Button>
        </div>
      )}
    </div>
  );
}
