import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "SEO Audit — On-Page SEO Analyzer",
  description:
    "Analyze on-page SEO: meta tags, heading structure, Open Graph, Twitter cards, structured data, canonical URLs, images, and internal/external links on your selected device.",
  alternates: { canonical: "/dashboard/seo" },
  openGraph: {
    title: "SEO Audit — On-Page SEO Analyzer | Scanora",
    description:
      "Comprehensive on-page SEO analysis including meta tags, headings, Open Graph, structured data, and link audit.",
    url: "/dashboard/seo",
  },
};

export default function SeoLayout({ children }: { children: React.ReactNode }) {
  return children;
}
