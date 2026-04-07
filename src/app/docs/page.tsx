"use client";

import { motion } from "framer-motion";
import {
  Shield,
  ArrowLeft,
  Accessibility,
  Zap,
  FileSearch,
  Code2,
  Gauge,
  Info,
  BookOpen,
  Package,
  FlaskConical,
  GitCompareArrows,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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

const tools = [
  {
    icon: Code2,
    name: "Playwright",
    description:
      "We use Playwright for headless browser automation. It launches real Chromium browsers to render your website exactly as users see it across 4 device profiles with device-specific user agents and scaling factors.",
    details: [
      { label: "Mobile", value: "375×812 · 3× DPI · iPhone UA" },
      { label: "Tablet", value: "768×1024 · 2× DPI · iPad UA" },
      { label: "Laptop", value: "1366×768 · 1× DPI" },
      { label: "Desktop", value: "1920×1080 · 1× DPI" },
    ],
  },
  {
    icon: Accessibility,
    name: "axe-core",
    description:
      "The industry-standard accessibility testing engine by Deque Systems. axe-core runs against the live DOM to detect WCAG 2.2 AA violations, mapping each issue to specific WCAG criteria with severity levels and actionable fix suggestions.",
    details: [
      { label: "Standard", value: "WCAG 2.2 Level AA" },
      { label: "Severities", value: "Critical · Serious · Moderate · Minor" },
      { label: "Principles", value: "Perceivable · Operable · Understandable · Robust" },
      { label: "Output", value: "Fix suggestions with code examples & docs links" },
    ],
  },
  {
    icon: Gauge,
    name: "Lighthouse v10 Algorithm",
    description:
      "Performance scores are calculated using the Lighthouse v10 scoring algorithm, which uses a log-normal cumulative distribution function (CDF). Each metric is scored 0–100 based on real-world performance data distributions, then weighted to produce a final score.",
    details: [
      { label: "Mobile Throttle", value: "Slow 4G · 150ms latency · 4× CPU slowdown" },
      { label: "Tablet Throttle", value: "Moderate 4G · 100ms latency · 2× CPU slowdown" },
      { label: "Desktop Throttle", value: "Cable speed (10Mbps) · No CPU slowdown" },
      { label: "Scoring", value: "Log-normal CDF based on real-world distributions" },
    ],
  },
  {
    icon: FileSearch,
    name: "DOM Inspection",
    description:
      "SEO analysis is performed by injecting evaluation scripts into the browser context via Playwright. We parse the live DOM to extract meta tags, heading hierarchy, Open Graph tags, Twitter Cards, JSON-LD structured data, link analysis, and image audits.",
    details: [
      { label: "Meta", value: "Title · Description · Canonical · Robots · Viewport · Charset" },
      { label: "Social", value: "Open Graph · Twitter Cards" },
      { label: "Content", value: "Headings H1-H6 · Links · Images · Structured Data" },
      { label: "Technical", value: "HTTPS · Favicon · hreflang" },
    ],
  },
  {
    icon: Package,
    name: "Bundle & Tech Detection",
    description:
      "Uses Chrome DevTools Protocol (CDP) to collect JavaScript/CSS code coverage and resource transfers. Technology detection uses signature matching against response headers, script content, DOM elements, and meta tags to identify frameworks, CMS, CDNs, analytics, and more.",
    details: [
      { label: "Coverage", value: "CDP-based JS/CSS code coverage analysis" },
      { label: "Resources", value: "Transfer size, MIME type, compression analysis" },
      { label: "Tech Stack", value: "Framework · CMS · CDN · Analytics · Build tool" },
      { label: "Output", value: "Unused JS detection, technology confidence scores" },
    ],
  },
  {
    icon: FlaskConical,
    name: "Next.js Analyzer",
    description:
      "Specialized analysis for Next.js applications. Inspects the rendered DOM and network requests to evaluate next/image usage, hydration payload size, rendering mode (SSR vs SSG vs ISR), and component patterns specific to the Next.js framework.",
    details: [
      { label: "Images", value: "next/image vs native <img>, srcSet, lazy loading" },
      { label: "Hydration", value: "__NEXT_DATA__ payload size analysis" },
      { label: "Rendering", value: "SSR · SSG · ISR · Client-side detection" },
      { label: "Patterns", value: "Component patterns, bundle chunk analysis" },
    ],
  },
  {
    icon: GitCompareArrows,
    name: "A/B Compare Engine",
    description:
      "Launches parallel browser sessions to load two URLs under identical conditions and captures performance metrics for both. Computes metric-by-metric diffs and determines the winner based on overall score and individual Core Web Vitals.",
    details: [
      { label: "Metrics", value: "Score · LCP · FCP · CLS · TBT · Total Size" },
      { label: "Comparison", value: "Diff arrows, percentage change, winner badge" },
      { label: "Conditions", value: "Identical device profile, network throttle" },
      { label: "Output", value: "Winner detection, improvement suggestions" },
    ],
  },
];

const scoring = [
  {
    title: "Accessibility Score",
    icon: Accessibility,
    description:
      "Calculated as the ratio of passing rules to total rules evaluated by axe-core. The score accounts for violation severity — critical and serious issues have a heavier impact than moderate or minor ones.",
    how: "Each violation is mapped to one of the 4 WCAG principles (Perceivable, Operable, Understandable, Robust), giving you a per-principle breakdown. The final score represents the percentage of rules your page passes, weighted by severity.",
    color: "text-emerald-400",
    border: "border-emerald-500/30",
    bg: "bg-emerald-500/5",
    iconBg: "bg-emerald-500/10",
    iconBorder: "border-emerald-500/20",
  },
  {
    title: "Performance Score",
    icon: Zap,
    description:
      "Uses the Lighthouse v10 log-normal scoring model. Core Web Vitals (LCP, FCP, TBT, CLS) are individually scored using cumulative distribution functions based on real-world data.",
    how: "Network throttling simulates real conditions per device. Each metric value is mapped to a 0-100 score using a log-normal distribution curve. The final performance score is a weighted combination of all individual metric scores.",
    color: "text-cyan-400",
    border: "border-cyan-500/30",
    bg: "bg-cyan-500/5",
    iconBg: "bg-cyan-500/10",
    iconBorder: "border-cyan-500/20",
  },
  {
    title: "SEO Score",
    icon: FileSearch,
    description:
      "Evaluated through a weighted checklist of SEO best practices. Each check contributes to the total score with critical issues weighing more heavily.",
    how: "Checks include: meta title length, description presence, heading hierarchy validity, canonical URL, HTTPS enforcement, structured data, Open Graph completeness, image alt text, and internal link structure. Missing critical elements (like titles) have a larger score impact than informational checks.",
    color: "text-orange-400",
    border: "border-orange-500/30",
    bg: "bg-orange-500/5",
    iconBg: "bg-orange-500/10",
    iconBorder: "border-orange-500/20",
  },
  {
    title: "Bundle & Tech Score",
    icon: Package,
    description:
      "Combines resource efficiency metrics (total transfer size, unused JavaScript ratio) with technology detection completeness.",
    how: "Transfer sizes are categorized (JS, CSS, images, fonts, other) and scored against efficiency thresholds. Code coverage analysis identifies unused JavaScript as a percentage of total JS. Technologies are identified with confidence scores based on multiple signal matches (headers, DOM, scripts).",
    color: "text-violet-400",
    border: "border-violet-500/30",
    bg: "bg-violet-500/5",
    iconBg: "bg-violet-500/10",
    iconBorder: "border-violet-500/20",
  },
  {
    title: "Next.js Insights Score",
    icon: FlaskConical,
    description:
      "Evaluates Next.js-specific best practices including image optimization, hydration efficiency, rendering strategy, and bundle patterns.",
    how: "Checks for next/image usage vs native img tags, measures __NEXT_DATA__ hydration payload size, verifies rendering mode choices, and audits component patterns. Each insight is classified by severity (critical, warning, info, pass) and category.",
    color: "text-pink-400",
    border: "border-pink-500/30",
    bg: "bg-pink-500/5",
    iconBg: "bg-pink-500/10",
    iconBorder: "border-pink-500/20",
  },
];

const glossary = [
  {
    term: "Core Web Vitals",
    definition:
      "A set of real-world, user-centered metrics defined by Google that quantify key aspects of user experience. They measure loading performance, interactivity, and visual stability of a page. Google uses these as ranking signals in search results.",
    category: "Performance",
  },
  {
    term: "LCP (Largest Contentful Paint)",
    definition:
      "Measures how long it takes for the largest visible content element (image, video, or text block) to render on screen. It reflects perceived loading speed — when users feel the page has mostly loaded.",
    threshold: "≤ 2.5s",
    category: "Performance",
  },
  {
    term: "FCP (First Contentful Paint)",
    definition:
      "The time from navigation to when the browser renders the first piece of DOM content (text, image, SVG, or canvas). It marks when users first see something on screen.",
    threshold: "≤ 1.8s",
    category: "Performance",
  },
  {
    term: "TBT (Total Blocking Time)",
    definition:
      "The total amount of time the main thread was blocked long enough to prevent input responsiveness, measured between FCP and Time to Interactive. High TBT means the page feels sluggish to interact with.",
    threshold: "≤ 200ms",
    category: "Performance",
  },
  {
    term: "CLS (Cumulative Layout Shift)",
    definition:
      "Measures visual stability by quantifying how much visible content unexpectedly shifts during page load. High CLS means elements jump around while loading, causing users to misclick or lose their place.",
    threshold: "≤ 0.1",
    category: "Performance",
  },
  {
    term: "TTFB (Time to First Byte)",
    definition:
      "The time between the browser requesting a page and receiving the first byte of response from the server. It measures server responsiveness and network latency.",
    threshold: "< 800ms",
    category: "Performance",
  },
  {
    term: "WCAG 2.2 (Web Content Accessibility Guidelines)",
    definition:
      "The latest version of the international standard for web accessibility published by the W3C. It defines how to make web content more accessible to people with disabilities, organized into 4 principles: Perceivable, Operable, Understandable, and Robust. We test against the AA conformance level.",
    category: "Accessibility",
  },
  {
    term: "Perceivable",
    definition:
      "The first WCAG principle. Information and user interface components must be presentable to users in ways they can perceive. This includes text alternatives for images, captions for audio, sufficient color contrast, and content that can be presented in different ways.",
    category: "Accessibility",
  },
  {
    term: "Operable",
    definition:
      "The second WCAG principle. User interface components and navigation must be operable. This means all functionality must be available from a keyboard, users have enough time to read content, content doesn't cause seizures, and users can easily navigate and find content.",
    category: "Accessibility",
  },
  {
    term: "Understandable",
    definition:
      "The third WCAG principle. Information and the operation of the user interface must be understandable. This means text is readable, pages appear and operate in predictable ways, and users are helped to avoid and correct mistakes.",
    category: "Accessibility",
  },
  {
    term: "Robust",
    definition:
      "The fourth WCAG principle. Content must be robust enough to be interpreted reliably by a wide variety of user agents, including assistive technologies. This involves valid HTML, proper ARIA usage, and correct name/role/value attributes.",
    category: "Accessibility",
  },
  {
    term: "ARIA (Accessible Rich Internet Applications)",
    definition:
      "A set of HTML attributes that define ways to make web content more accessible. ARIA roles, states, and properties supplement native HTML semantics to convey information to assistive technologies like screen readers.",
    category: "Accessibility",
  },
  {
    term: "Open Graph Protocol",
    definition:
      "A protocol created by Facebook that enables web pages to become rich objects in social media feeds. OG tags (og:title, og:description, og:image, etc.) control how your page appears when shared on Facebook, LinkedIn, and other platforms.",
    category: "SEO",
  },
  {
    term: "Twitter Cards",
    definition:
      "Meta tags (twitter:card, twitter:title, twitter:description, twitter:image) that control how your content appears when shared on X (Twitter). Card types include summary, summary_large_image, app, and player.",
    category: "SEO",
  },
  {
    term: "JSON-LD (Structured Data)",
    definition:
      "A method of encoding Linked Data using JSON, recommended by Google for structured data markup. It helps search engines understand your content and can enable rich results (snippets, carousels, FAQs) in search results. Common schemas include Article, Product, Organization, and BreadcrumbList.",
    category: "SEO",
  },
  {
    term: "Canonical URL",
    definition:
      'An HTML link element (rel="canonical") that tells search engines which version of a URL is the primary one. It prevents duplicate content issues when the same page is accessible via multiple URLs.',
    category: "SEO",
  },
  {
    term: "Heading Hierarchy",
    definition:
      "The logical structure of headings (H1-H6) on a page. A valid hierarchy starts with a single H1, followed by H2s, H3s nested under H2s, and so on. Breaking hierarchy (e.g., jumping from H1 to H4) confuses screen readers and hurts both accessibility and SEO.",
    category: "SEO",
  },
  {
    term: "Meta Robots Tag",
    definition:
      'An HTML meta tag that tells search engine crawlers how to index a page. Common directives include "index" (allow indexing), "noindex" (prevent indexing), "follow" (follow links), and "nofollow" (don\'t follow links).',
    category: "SEO",
  },
];

const categoryColors: Record<string, { text: string; bg: string; border: string }> = {
  Performance: { text: "text-cyan-400", bg: "bg-cyan-500/10", border: "border-cyan-500/20" },
  Accessibility: { text: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
  SEO: { text: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/20" },
};

export default function DocsPage() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Background effects */}
      <div className="fixed inset-0 bg-grid pointer-events-none" />
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed bottom-0 right-0 w-[600px] h-[400px] bg-cyan-500/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Navigation */}
      <nav className="relative z-50 border-b border-slate-800/50 backdrop-blur-xl bg-[#0a0e1a]/80">
        <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-cyan-500 shadow-lg shadow-emerald-500/25">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold text-white">AuditWave</span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <Link href="/#features" className="text-sm text-slate-400 hover:text-white transition-colors">
              Features
            </Link>
            <Link href="/#how-it-works" className="text-sm text-slate-400 hover:text-white transition-colors">
              How It Works
            </Link>
            <Link href="/docs" className="text-sm text-white font-medium">
              Docs
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/dashboard/accessibility">
              <Button size="sm">
                Start Scanning
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Page Header */}
      <section className="relative z-10 mx-auto max-w-5xl px-6 pt-16 pb-12">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={stagger}
        >
          <motion.div variants={fadeUp} custom={0}>
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors mb-8"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to home
            </Link>
          </motion.div>

          <motion.div variants={fadeUp} custom={1}>
            <Badge className="mb-4 px-4 py-1.5 text-sm">
              <BookOpen className="mr-1.5 h-3.5 w-3.5" />
              Documentation
            </Badge>
          </motion.div>

          <motion.h1
            variants={fadeUp}
            custom={2}
            className="text-4xl font-bold md:text-5xl"
          >
            How AuditWave audits your website
          </motion.h1>

          <motion.p
            variants={fadeUp}
            custom={3}
            className="mt-4 max-w-2xl text-lg text-slate-400"
          >
            Full transparency — know exactly what tools we use, how we calculate every score,
            and what each metric means. No black boxes.
          </motion.p>

          {/* Quick nav */}
          <motion.div variants={fadeUp} custom={4} className="mt-8 flex flex-wrap gap-3">
            <a href="#tools">
              <Badge variant="secondary" className="cursor-pointer hover:bg-slate-700 transition-colors">
                Tools &amp; Technologies
              </Badge>
            </a>
            <a href="#scoring">
              <Badge variant="secondary" className="cursor-pointer hover:bg-slate-700 transition-colors">
                How Scores Work
              </Badge>
            </a>
            <a href="#glossary">
              <Badge variant="secondary" className="cursor-pointer hover:bg-slate-700 transition-colors">
                Glossary &amp; Definitions
              </Badge>
            </a>
          </motion.div>
        </motion.div>
      </section>

      {/* Tools & Technologies */}
      <section id="tools" className="relative z-10 mx-auto max-w-5xl px-6 py-16">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          variants={stagger}
        >
          <motion.h2 variants={fadeUp} custom={0} className="text-2xl font-bold text-white mb-2 flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <Code2 className="h-4 w-4 text-emerald-400" />
            </div>
            Tools &amp; Technologies
          </motion.h2>
          <motion.p variants={fadeUp} custom={1} className="text-slate-400 mb-10 ml-11">
            The engines that power every AuditWave scan
          </motion.p>

          <div className="space-y-6">
            {tools.map((tool, i) => (
              <motion.div key={tool.name} variants={fadeUp} custom={i}>
                <Card className="hover:border-slate-700 transition-colors">
                  <CardContent className="p-6 md:p-8">
                    <div className="flex items-start gap-4 mb-5">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-800/50 border border-slate-700/50">
                        <tool.icon className="h-5 w-5 text-emerald-400" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white">{tool.name}</h3>
                        <p className="mt-1 text-sm text-slate-400 leading-relaxed">{tool.description}</p>
                      </div>
                    </div>
                    <div className="ml-15 grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {tool.details.map((detail) => (
                        <div
                          key={detail.label}
                          className="rounded-lg bg-slate-800/30 border border-slate-800 px-4 py-3"
                        >
                          <div className="text-xs text-slate-500 mb-1">{detail.label}</div>
                          <div className="text-sm text-slate-300">{detail.value}</div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* How Scores Are Calculated */}
      <section id="scoring" className="relative z-10 mx-auto max-w-5xl px-6 py-16">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          variants={stagger}
        >
          <motion.h2 variants={fadeUp} custom={0} className="text-2xl font-bold text-white mb-2 flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/10 border border-cyan-500/20">
              <Gauge className="h-4 w-4 text-cyan-400" />
            </div>
            How Scores Are Calculated
          </motion.h2>
          <motion.p variants={fadeUp} custom={1} className="text-slate-400 mb-10 ml-11">
            Transparent scoring methodology for every audit type
          </motion.p>

          <div className="space-y-6">
            {scoring.map((item, i) => (
              <motion.div key={item.title} variants={fadeUp} custom={i}>
                <Card className={`border-l-2 ${item.border}`}>
                  <CardContent className="p-6 md:p-8">
                    <div className="flex items-start gap-4 mb-4">
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${item.iconBg} ${item.iconBorder} border`}>
                        <item.icon className={`h-5 w-5 ${item.color}`} />
                      </div>
                      <div>
                        <h3 className={`text-lg font-semibold ${item.color}`}>{item.title}</h3>
                        <p className="mt-2 text-sm text-slate-400 leading-relaxed">{item.description}</p>
                      </div>
                    </div>
                    <div className={`ml-14 rounded-lg ${item.bg} border ${item.border} p-4`}>
                      <div className="text-xs font-medium text-slate-300 mb-1">How it works:</div>
                      <p className="text-sm text-slate-400 leading-relaxed">{item.how}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Score Thresholds */}
          <motion.div
            variants={fadeUp}
            custom={3}
            className="mt-10"
          >
            <Card>
              <CardContent className="p-6 md:p-8">
                <h3 className="text-lg font-semibold text-white mb-6">Score Color Coding</h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div className="flex items-center gap-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20 p-4">
                    <div className="h-4 w-4 rounded-full bg-emerald-500 shrink-0" />
                    <div>
                      <div className="text-sm font-semibold text-emerald-400">90–100: Good</div>
                      <div className="text-xs text-slate-500 mt-0.5">Excellent — no major action needed</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 rounded-xl bg-amber-500/5 border border-amber-500/20 p-4">
                    <div className="h-4 w-4 rounded-full bg-amber-500 shrink-0" />
                    <div>
                      <div className="text-sm font-semibold text-amber-400">70–89: Needs Improvement</div>
                      <div className="text-xs text-slate-500 mt-0.5">Some optimization opportunities exist</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 rounded-xl bg-red-500/5 border border-red-500/20 p-4">
                    <div className="h-4 w-4 rounded-full bg-red-500 shrink-0" />
                    <div>
                      <div className="text-sm font-semibold text-red-400">0–69: Poor</div>
                      <div className="text-xs text-slate-500 mt-0.5">Significant issues to address</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </section>

      {/* Glossary & Definitions */}
      <section id="glossary" className="relative z-10 mx-auto max-w-5xl px-6 py-16 pb-24">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          variants={stagger}
        >
          <motion.h2 variants={fadeUp} custom={0} className="text-2xl font-bold text-white mb-2 flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/10 border border-violet-500/20">
              <Info className="h-4 w-4 text-violet-400" />
            </div>
            Glossary &amp; Definitions
          </motion.h2>
          <motion.p variants={fadeUp} custom={1} className="text-slate-400 mb-10 ml-11">
            Every term and metric explained in plain language
          </motion.p>

          {/* Group by category */}
          {["Performance", "Accessibility", "SEO"].map((category) => (
            <div key={category} className="mb-10 last:mb-0">
              <div className="flex items-center gap-2 mb-4">
                <span className={`text-sm font-semibold ${categoryColors[category].text}`}>{category}</span>
                <div className="flex-1 border-t border-slate-800" />
              </div>
              <div className="space-y-3">
                {glossary
                  .filter((item) => item.category === category)
                  .map((item, i) => (
                    <motion.div key={item.term} variants={fadeUp} custom={i}>
                      <Card className="hover:border-slate-700 transition-colors">
                        <CardContent className="p-5">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <h4 className="text-sm font-semibold text-white mb-1.5">{item.term}</h4>
                              <p className="text-sm text-slate-400 leading-relaxed">{item.definition}</p>
                            </div>
                            {"threshold" in item && item.threshold && (
                              <div className={`shrink-0 rounded-lg ${categoryColors[category].bg} ${categoryColors[category].border} border px-3 py-1.5`}>
                                <div className="text-[10px] text-slate-500 uppercase tracking-wider">Good</div>
                                <div className={`text-sm font-semibold ${categoryColors[category].text}`}>
                                  {item.threshold}
                                </div>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
              </div>
            </div>
          ))}
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
              <span className="font-semibold text-white">AuditWave</span>
            </div>
            <div className="flex items-center gap-8 text-sm text-slate-400">
              <Link href="/#features" className="hover:text-white transition-colors">Features</Link>
              <Link href="/docs" className="hover:text-white transition-colors">Docs</Link>
              <Link href="/#how-it-works" className="hover:text-white transition-colors">How It Works</Link>
              <Link href="/privacy-policy" className="hover:text-white transition-colors">Privacy Policy</Link>
              <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
            </div>
            <p className="text-sm text-slate-500">
              © {new Date().getFullYear()} AuditWave. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
