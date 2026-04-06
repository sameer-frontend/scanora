import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Accessibility Audit — WCAG 2.2 Scanner",
  description:
    "Run a WCAG 2.2 AA accessibility audit on any website. Detect critical issues, get code-level fixes, and test across mobile, tablet, laptop, and desktop viewports using axe-core.",
  alternates: { canonical: "/dashboard/accessibility" },
  openGraph: {
    title: "Accessibility Audit — WCAG 2.2 Scanner | Scanora",
    description:
      "Scan any website for WCAG 2.2 accessibility issues across multiple devices. Powered by Playwright and axe-core.",
    url: "/dashboard/accessibility",
  },
};

export default function AccessibilityLayout({ children }: { children: React.ReactNode }) {
  return children;
}
