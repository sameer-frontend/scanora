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

export const metadata: Metadata = {
  title: "WebGuard AI — Accessibility. Performance. Privacy.",
  description:
    "The all-in-one AI-powered website intelligence platform. Scan for accessibility issues, optimize performance, and track analytics — all privacy-first.",
  keywords: [
    "accessibility",
    "performance",
    "privacy",
    "WCAG",
    "Core Web Vitals",
    "GDPR",
    "website audit",
    "AI",
  ],
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
