import { Smartphone, Tablet, Laptop, Monitor } from "lucide-react";
import type { DeviceType } from "./types";

export const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

export const deviceIconMap: Record<DeviceType, typeof Smartphone> = {
  mobile: Smartphone,
  tablet: Tablet,
  laptop: Laptop,
  desktop: Monitor,
};

export type AccentColor = "emerald" | "cyan" | "orange" | "violet";

export const accentStyles: Record<AccentColor, {
  text: string;
  bg: string;
  border: string;
  pingBg: string;
  activeBg: string;
  activeBorder: string;
  activeBgLight: string;
  linkColor: string;
}> = {
  emerald: {
    text: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
    pingBg: "bg-emerald-500/20",
    activeBg: "bg-emerald-500/10",
    activeBorder: "border-emerald-500/25",
    activeBgLight: "bg-emerald-500/5",
    linkColor: "text-emerald-400",
  },
  cyan: {
    text: "text-cyan-400",
    bg: "bg-cyan-500/10",
    border: "border-cyan-500/20",
    pingBg: "bg-cyan-500/20",
    activeBg: "bg-cyan-500/10",
    activeBorder: "border-cyan-500/25",
    activeBgLight: "bg-cyan-500/5",
    linkColor: "text-cyan-400",
  },
  orange: {
    text: "text-orange-400",
    bg: "bg-orange-500/10",
    border: "border-orange-500/20",
    pingBg: "bg-orange-500/20",
    activeBg: "bg-orange-500/10",
    activeBorder: "border-orange-500/25",
    activeBgLight: "bg-orange-500/5",
    linkColor: "text-orange-400",
  },
  violet: {
    text: "text-violet-400",
    bg: "bg-violet-500/10",
    border: "border-violet-500/20",
    pingBg: "bg-violet-500/20",
    activeBg: "bg-violet-500/10",
    activeBorder: "border-violet-500/25",
    activeBgLight: "bg-violet-500/5",
    linkColor: "text-violet-400",
  },
};
