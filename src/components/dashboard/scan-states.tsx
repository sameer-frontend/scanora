import { Loader2, SearchX } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
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
    <div className="flex flex-col items-center justify-center h-[60vh] text-center">
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
    <div className="flex flex-col items-center justify-center h-[60vh] text-center">
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
}

export function ScanErrorState({ error }: ScanErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center h-[60vh] text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10 border border-red-500/20 mb-4">
        <SearchX className="h-8 w-8 text-red-400" />
      </div>
      <h2 className="text-xl font-bold text-white mb-2">Scan Failed</h2>
      <p className="text-red-400 text-sm max-w-md">{error}</p>
    </div>
  );
}
