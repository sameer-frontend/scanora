import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Bundle & Tech — Bundle Analysis & Technology Detection",
  description:
    "Analyze JavaScript bundles, CSS resources, code coverage, and detect web technologies like frameworks, CMS, CDN, analytics, and more.",
  alternates: { canonical: "/dashboard/bundle" },
  openGraph: {
    title: "Bundle & Tech — Bundle Analysis & Technology Detection | AuditWave",
    description:
      "Analyze resource bundles and detect the technology stack of any website.",
    url: "/dashboard/bundle",
  },
};

export default function BundleLayout({ children }: { children: React.ReactNode }) {
  return children;
}
