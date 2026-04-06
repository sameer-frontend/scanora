import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Performance Audit — Core Web Vitals & Lighthouse",
  description:
    "Measure Core Web Vitals (LCP, FCP, TBT, CLS) and get a Lighthouse v10 performance score. Identify render-blocking resources, large assets, and optimization opportunities.",
  alternates: { canonical: "/dashboard/performance" },
  openGraph: {
    title: "Performance Audit — Core Web Vitals & Lighthouse | Scanora",
    description:
      "Measure real Core Web Vitals and get Lighthouse v10 scoring for any website across multiple devices.",
    url: "/dashboard/performance",
  },
};

export default function PerformanceLayout({ children }: { children: React.ReactNode }) {
  return children;
}
