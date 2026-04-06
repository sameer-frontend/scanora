import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Documentation — API & Audit Guides",
  description:
    "Learn how Scanora works. Explore guides for accessibility auditing with axe-core, performance measurement with Lighthouse, SEO analysis, and multi-device testing.",
  alternates: {
    canonical: "/docs",
  },
  openGraph: {
    title: "Scanora Documentation — API & Audit Guides",
    description:
      "Guides for accessibility auditing, performance measurement, and SEO analysis with Scanora.",
    url: "/docs",
  },
};

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
