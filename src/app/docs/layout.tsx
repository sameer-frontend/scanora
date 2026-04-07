import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Documentation — API & Audit Guides",
  description:
    "Learn how AuditWave works. Explore guides for accessibility auditing with axe-core, performance measurement with Lighthouse, SEO analysis, and multi-device testing.",
  alternates: {
    canonical: "/docs",
  },
  openGraph: {
    title: "AuditWave Documentation — API & Audit Guides",
    description:
      "Guides for accessibility auditing, performance measurement, and SEO analysis with AuditWave.",
    url: "/docs",
  },
};

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
