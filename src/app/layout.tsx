import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://auditwave.dev";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "AuditWave — Website Accessibility, Performance & SEO Audit Tool",
    template: "%s | AuditWave",
  },
  description:
    "Free all-in-one website audit tool. WCAG 2.2 accessibility, Core Web Vitals performance, SEO, bundle analysis, Next.js insights, and A/B comparison — powered by Playwright, axe-core & Lighthouse.",
  keywords: [
    "website audit tool",
    "accessibility checker",
    "WCAG 2.2 audit",
    "performance testing",
    "Core Web Vitals",
    "SEO analyzer",
    "axe-core scanner",
    "Lighthouse audit",
    "web accessibility",
    "site speed test",
    "multi-device testing",
    "free website checker",
    "bundle analyzer",
    "Next.js audit",
    "A/B performance compare",
    "technology detection",
  ],
  authors: [{ name: "AuditWave" }],
  creator: "AuditWave",
  publisher: "AuditWave",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "AuditWave",
    title: "AuditWave — Website Accessibility, Performance & SEO Audit Tool",
    description:
      "Free all-in-one website audit: accessibility, performance, SEO, bundle analysis, Next.js insights, and A/B comparison from one dashboard.",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "AuditWave — Website Accessibility, Performance & SEO Audit Tool",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "AuditWave — Website Accessibility, Performance & SEO Audit Tool",
    description:
      "Free all-in-one website audit: accessibility, performance, SEO, bundle analysis, Next.js insights, and A/B comparison.",
  },
  alternates: {
    canonical: siteUrl,
  },

};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col bg-[#0a0e1a] text-slate-100">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
