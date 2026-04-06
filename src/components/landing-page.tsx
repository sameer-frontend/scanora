"use client";

import { motion } from "framer-motion";
import {
  Shield,
  Zap,
  Eye,
  ArrowRight,
  Check,
  Lock,
  Accessibility,
  Globe,
  Sparkles,
  ChevronRight,
  Search,
  Monitor,
  Smartphone,
  Tablet,
  Laptop,
  FileSearch,
  BookOpen,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

const stagger = {
  visible: { transition: { staggerChildren: 0.08 } },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
  },
};

const pillars = [
  {
    icon: Accessibility,
    title: "Accessibility Auditor",
    description:
      "Deep WCAG 2.2 AA scanning powered by the axe-core engine. Get detailed code-level fixes for alt text, ARIA labels, contrast issues, keyboard navigation, and focus order.",
    features: [
      "WCAG 2.2 AA Compliance (axe-core)",
      "4 Severity Levels: Critical to Minor",
      "Fix Suggestions with Code & Docs",
      "Multi-Device Testing (4 Viewports)",
    ],
    gradient: "from-emerald-500 to-green-400",
    glow: "shadow-emerald-500/20",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
  },
  {
    icon: Zap,
    title: "Performance Optimizer",
    description:
      "Real-time Core Web Vitals measurement using Lighthouse v10 scoring. Identify render-blocking resources, large assets, and optimization opportunities with device-specific throttling.",
    features: [
      "LCP / FCP / TBT / CLS Tracking",
      "Lighthouse v10 Scoring Algorithm",
      "Asset Breakdown by Category",
      "Network Throttling per Device",
    ],
    gradient: "from-cyan-500 to-blue-400",
    glow: "shadow-cyan-500/20",
    color: "text-cyan-400",
    bg: "bg-cyan-500/10",
    border: "border-cyan-500/20",
  },
  {
    icon: FileSearch,
    title: "SEO Auditor",
    description:
      "Comprehensive SEO analysis including meta tags, heading hierarchy, Open Graph & Twitter Cards, structured data (JSON-LD), link analysis, and image audits.",
    features: [
      "Meta Tags & Canonical URL Check",
      "Open Graph & Twitter Card Validation",
      "Heading Hierarchy & Content Structure",
      "Structured Data (JSON-LD) Detection",
    ],
    gradient: "from-orange-500 to-amber-400",
    glow: "shadow-orange-500/20",
    color: "text-orange-400",
    bg: "bg-orange-500/10",
    border: "border-orange-500/20",
  },
];

const stats = [
  { value: "4", label: "Device Viewports" },
  { value: "WCAG 2.2", label: "Compliance Standard" },
  { value: "Lighthouse v10", label: "Scoring Engine" },
  { value: "100% Free", label: "No Hidden Costs" },
];



export default function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Background effects */}
      <div className="fixed inset-0 bg-grid pointer-events-none" />
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed bottom-0 right-0 w-[600px] h-[400px] bg-cyan-500/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Navigation */}
      <motion.nav
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-50 border-b border-slate-800/50 backdrop-blur-xl bg-[#0a0e1a]/80"
      >
        <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-cyan-500 shadow-lg shadow-emerald-500/25">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold text-white">Scanora</span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-slate-400 hover:text-white transition-colors">
              Features
            </a>
            <a href="#how-it-works" className="text-sm text-slate-400 hover:text-white transition-colors">
              How It Works
            </a>
            <Link href="/docs" className="text-sm text-slate-400 hover:text-white transition-colors">
              Docs
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="https://github.com/sameer-frontend/scanora"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-400 hover:text-white transition-colors"
              aria-label="GitHub"
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12Z"/></svg>
            </a>
            <Link href="/dashboard">
              <Button size="sm">
                Start Scanning <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section className="relative z-10 mx-auto max-w-7xl px-6 pt-24 pb-20 md:pt-32 md:pb-28">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={stagger}
          className="text-center"
        >
          <motion.div variants={fadeUp} custom={0}>
            <Badge className="mb-6 px-4 py-1.5 text-sm">
              <Sparkles className="mr-1.5 h-3.5 w-3.5" />
              100% Free &amp; Open Source
            </Badge>
          </motion.div>

          <motion.h1
            variants={fadeUp}
            custom={1}
            className="mx-auto max-w-5xl text-5xl font-bold leading-tight tracking-tight md:text-7xl md:leading-[1.1]"
          >
            Accessibility. Performance. SEO.{" "}
            <span className="gradient-text">One scan.</span>
          </motion.h1>

          <motion.p
            variants={fadeUp}
            custom={2}
            className="mx-auto mt-6 max-w-2xl text-lg text-slate-400 md:text-xl"
          >
            The all-in-one platform that audits your website across 4 device viewports for
            WCAG 2.2 accessibility, Core Web Vitals performance, and SEO best practices — powered
            by Playwright, axe-core, and Lighthouse v10. Completely free.
          </motion.p>

          <motion.div variants={fadeUp} custom={3} className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link href="/dashboard/accessibility">
              <Button size="lg" className="text-base px-8">
                Start Free Scan
                <ArrowRight className="ml-1 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/docs">
              <Button variant="outline" size="lg" className="text-base px-8">
                <BookOpen className="mr-1.5 h-5 w-5" />
                Read the Docs
              </Button>
            </Link>
          </motion.div>

          <motion.div variants={fadeUp} custom={4} className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm">
            <span className="flex items-center gap-1.5">
              <Check className="h-4 w-4 text-emerald-500" /> Completely free, no limits
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="h-4 w-4 text-emerald-500" /> No account required
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="h-4 w-4 text-emerald-500" /> Multi-device testing
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="h-4 w-4 text-emerald-500" /> Real browser testing
            </span>
          </motion.div>
        </motion.div>

        {/* Hero Dashboard Preview */}
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="relative mt-20 mx-auto max-w-5xl"
        >
          <div className="absolute -inset-4 bg-gradient-to-r from-emerald-500/20 via-cyan-500/20 to-orange-500/20 rounded-2xl blur-xl opacity-50" />
          <div className="relative rounded-xl border border-slate-700/50 bg-slate-900/90 backdrop-blur-sm shadow-2xl overflow-hidden">
            {/* Browser chrome */}
            <div className="flex items-center gap-2 border-b border-slate-800 px-4 py-3">
              <div className="flex gap-1.5">
                <div className="h-3 w-3 rounded-full bg-red-500/80" />
                <div className="h-3 w-3 rounded-full bg-amber-500/80" />
                <div className="h-3 w-3 rounded-full bg-emerald-500/80" />
              </div>
              <div className="mx-auto flex items-center gap-2 rounded-md bg-slate-800/80 px-4 py-1 text-xs text-slate-400">
                <Lock className="h-3 w-3" />
                scanora.dev/dashboard
              </div>
            </div>
            {/* Dashboard preview content */}
            <div className="p-6 md:p-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <ScoreCard label="Accessibility" value="92" color="emerald" />
                <ScoreCard label="Performance" value="78" color="cyan" />
                <ScoreCard label="SEO" value="85" color="orange" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                <DeviceChip icon={Smartphone} label="Mobile" score="76" />
                <DeviceChip icon={Tablet} label="Tablet" score="82" />
                <DeviceChip icon={Laptop} label="Laptop" score="88" />
                <DeviceChip icon={Monitor} label="Desktop" score="92" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="rounded-lg border border-slate-800 bg-slate-800/30 p-4">
                  <div className="text-xs text-slate-400 mb-2">WCAG Issues Found</div>
                  <div className="text-2xl font-bold text-red-400">7</div>
                  <div className="mt-2 text-xs text-slate-500">2 critical · 3 serious · 2 moderate</div>
                </div>
                <div className="rounded-lg border border-slate-800 bg-slate-800/30 p-4">
                  <div className="text-xs text-slate-400 mb-2">Core Web Vitals</div>
                  <div className="text-2xl font-bold text-emerald-400">Good</div>
                  <div className="mt-2 text-xs text-slate-500">LCP: 1.8s · FCP: 0.9s · CLS: 0.05</div>
                </div>
                <div className="rounded-lg border border-slate-800 bg-slate-800/30 p-4">
                  <div className="text-xs text-slate-400 mb-2">SEO Checks</div>
                  <div className="text-2xl font-bold text-orange-400">14/16</div>
                  <div className="mt-2 text-xs text-slate-500">Meta tags · Headings · Structured data</div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Stats Section */}
      <section className="relative z-10 border-y border-slate-800/50 bg-slate-900/30 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-6 py-12">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={stagger}
            className="grid grid-cols-2 md:grid-cols-4 gap-8"
          >
            {stats.map((stat, i) => (
              <motion.div key={stat.label} variants={fadeUp} custom={i} className="text-center">
                <div className="text-2xl font-bold gradient-text md:text-3xl">{stat.value}</div>
                <div className="mt-1 text-sm text-slate-400">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features / Four Pillars */}
      <section id="features" className="relative z-10 mx-auto max-w-7xl px-6 py-24">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={stagger}
          className="text-center mb-16"
        >
          <motion.div variants={fadeUp} custom={0}>
            <Badge variant="secondary" className="mb-4">
              <Globe className="mr-1.5 h-3.5 w-3.5" />
              Three Pillars, One Platform
            </Badge>
          </motion.div>
          <motion.h2 variants={fadeUp} custom={1} className="text-4xl font-bold md:text-5xl">
            Everything your website needs
          </motion.h2>
          <motion.p variants={fadeUp} custom={2} className="mx-auto mt-4 max-w-2xl text-lg text-slate-400">
            Stop juggling multiple tools. Scanora combines accessibility auditing,
            performance optimization, and SEO analysis in one free platform.
          </motion.p>
        </motion.div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {pillars.map((pillar, i) => (
            <motion.div
              key={pillar.title}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              variants={scaleIn}
              custom={i}
            >
              <Card className={`relative group h-full overflow-hidden hover:border-slate-700 transition-all duration-300 hover:${pillar.glow} hover:shadow-2xl`}>
                <div className={`absolute inset-0 bg-gradient-to-br ${pillar.gradient} opacity-0 group-hover:opacity-[0.03] transition-opacity duration-500`} />
                <CardContent className="relative p-6">
                  <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl ${pillar.bg} ${pillar.border} border mb-5`}>
                    <pillar.icon className={`h-6 w-6 ${pillar.color}`} />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">{pillar.title}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed mb-5">{pillar.description}</p>
                  <ul className="space-y-2.5">
                    {pillar.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2.5 text-sm text-slate-300">
                        <Check className={`h-4 w-4 ${pillar.color} shrink-0`} />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="relative z-10 mx-auto max-w-7xl px-6 py-24">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={stagger}
          className="text-center mb-16"
        >
          <motion.h2 variants={fadeUp} custom={0} className="text-4xl font-bold md:text-5xl">
            How it works
          </motion.h2>
          <motion.p variants={fadeUp} custom={1} className="mx-auto mt-4 max-w-xl text-lg text-slate-400">
            Get comprehensive multi-device audit results in three simple steps
          </motion.p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          variants={stagger}
          className="grid grid-cols-1 gap-8 md:grid-cols-3"
        >
          {[
            {
              step: "01",
              title: "Enter Your URL",
              description:
                "Paste any website URL and select which devices to test (Mobile, Tablet, Laptop, Desktop). Scanora runs a deep single-page scan across all chosen viewports.",
              icon: Search,
            },
            {
              step: "02",
              title: "Multi-Device Analysis",
              description:
                "Playwright launches real browsers across your chosen viewports. axe-core audits accessibility, Lighthouse v10 scores performance, and DOM inspection evaluates SEO — all in parallel.",
              icon: Eye,
            },
            {
              step: "03",
              title: "Review & Fix",
              description:
                "Get per-device scores with screenshots, detailed issue breakdowns with WCAG criteria, optimization opportunities, and cross-device comparison charts.",
              icon: Sparkles,
            },
          ].map((item, i) => (
            <motion.div key={item.step} variants={fadeUp} custom={i} className="relative text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-slate-800/50 border border-slate-700/50 mb-6">
                <item.icon className="h-7 w-7 text-emerald-400" />
              </div>
              <div className="text-xs font-mono text-emerald-500 mb-2">STEP {item.step}</div>
              <h3 className="text-xl font-semibold text-white mb-2">{item.title}</h3>
              <p className="text-slate-400">{item.description}</p>
              {i < 2 && (
                <ChevronRight className="hidden md:block absolute top-12 -right-4 h-6 w-6 text-slate-700" />
              )}
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* CTA */}
      <section className="relative z-10 mx-auto max-w-7xl px-6 py-24">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={scaleIn}
        >
          <Card className="relative overflow-hidden border-slate-700/50">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-cyan-500/5 to-orange-500/10" />
            <CardContent className="relative p-12 md:p-16 text-center">
              <h2 className="text-3xl font-bold md:text-4xl">
                Ready to audit your website?
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-lg text-slate-400">
                Completely free. No account required. Get detailed accessibility,
                performance, and SEO reports across all devices in minutes.
              </p>
              <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                <Link href="/dashboard/accessibility">
                  <Button size="lg" className="text-base px-8">
                    Start Your Free Scan
                    <ArrowRight className="ml-1 h-5 w-5" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-800/50 bg-slate-900/30 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-6 py-12">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-cyan-500">
                <Shield className="h-4 w-4 text-white" />
              </div>
              <span className="font-semibold text-white">Scanora</span>
            </div>
            <div className="flex items-center gap-8 text-sm text-slate-400">
              <a href="#features" className="hover:text-white transition-colors">Features</a>
              <Link href="/docs" className="hover:text-white transition-colors">Docs</Link>
              <a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a>
              <Link href="/privacy-policy" className="hover:text-white transition-colors">Privacy Policy</Link>
              <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
              <a href="https://github.com/sameer-frontend/scanora" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">GitHub</a>
            </div>
            <p className="text-sm text-slate-500" suppressHydrationWarning>
              {`© ${new Date().getFullYear()} Scanora. Free & open source.`}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function ScoreCard({ label, value, color }: { label: string; value: string; color: string }) {
  const colors: Record<string, string> = {
    emerald: "text-emerald-400",
    green: "text-green-400",
    cyan: "text-cyan-400",
    orange: "text-orange-400",
    violet: "text-violet-400",
  };
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-800/30 p-4">
      <div className="text-xs text-slate-400 mb-1">{label}</div>
      <div className={`text-3xl font-bold ${colors[color]}`}>{value}</div>
    </div>
  );
}

function DeviceChip({ icon: Icon, label, score }: { icon: React.ComponentType<{ className?: string }>; label: string; score: string }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-slate-800 bg-slate-800/30 px-4 py-3">
      <Icon className="h-4 w-4 text-slate-400" />
      <span className="text-xs text-slate-400">{label}</span>
      <span className="ml-auto text-sm font-semibold text-emerald-400">{score}</span>
    </div>
  );
}
