import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Next.js Insights — Image, Hydration & Bundle Analysis",
  description:
    "Analyze Next.js-specific optimizations: next/image usage, hydration payload size, rendering mode, component patterns, and bundle efficiency.",
  alternates: { canonical: "/dashboard/nextjs" },
  openGraph: {
    title: "Next.js Insights — Image, Hydration & Bundle Analysis | Scanora",
    description:
      "Detect Next.js optimization opportunities for images, hydration, rendering, and bundle size.",
    url: "/dashboard/nextjs",
  },
};

export default function NextJsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
