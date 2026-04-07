import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "A/B Performance Compare — Side-by-Side URL Testing",
  description:
    "Compare two URLs head-to-head on performance metrics, Core Web Vitals, and page weight. Find the faster page and spot improvement areas.",
  alternates: { canonical: "/dashboard/ab-compare" },
  openGraph: {
    title: "A/B Performance Compare — Side-by-Side URL Testing | Scanora",
    description:
      "Compare two URLs side-by-side on performance, Core Web Vitals, and page weight.",
    url: "/dashboard/ab-compare",
  },
};

export default function ABCompareLayout({ children }: { children: React.ReactNode }) {
  return children;
}
