import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://scanora.dev";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Scanora — Website Accessibility, Performance & SEO Audit Tool",
    template: "%s | Scanora",
  },
  description:
    "Free online website audit tool. Scan for WCAG 2.2 accessibility issues, measure Core Web Vitals performance, and analyze SEO — all from one dashboard. Powered by Playwright, axe-core & Lighthouse.",
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
  ],
  authors: [{ name: "Scanora" }],
  creator: "Scanora",
  publisher: "Scanora",
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
    siteName: "Scanora",
    title: "Scanora — Website Accessibility, Performance & SEO Audit Tool",
    description:
      "Free online website audit tool. Scan for WCAG 2.2 accessibility issues, measure Core Web Vitals, and analyze SEO — all from one dashboard.",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Scanora — Website Accessibility, Performance & SEO Audit Tool",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Scanora — Website Accessibility, Performance & SEO Audit Tool",
    description:
      "Free online website audit tool. Scan for WCAG 2.2 accessibility issues, measure Core Web Vitals, and analyze SEO.",
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
      </body>
    </html>
  );
}
