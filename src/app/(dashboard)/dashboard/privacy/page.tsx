"use client";

import { motion } from "framer-motion";
import {
  Lock,
  Users,
  Eye,
  Globe2,
  ArrowUpRight,
  ArrowDownRight,
  MonitorSmartphone,
  Smartphone,
  Monitor,
  Clock,
  TrendingUp,
  MousePointer,
  FileText,
  Shield,
  CheckCircle2,
  ExternalLink,
  Copy,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MiniChart } from "@/components/dashboard/mini-chart";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

const visitorData = {
  today: 2847,
  change: 12.4,
  pageviews: 8934,
  bounceRate: 34.2,
  avgDuration: "2m 45s",
};

const topPages = [
  { path: "/", views: 3420, unique: 2105, bounce: 28 },
  { path: "/pricing", views: 1890, unique: 1450, bounce: 22 },
  { path: "/blog/ai-accessibility", views: 1204, unique: 980, bounce: 38 },
  { path: "/features", views: 876, unique: 654, bounce: 31 },
  { path: "/docs/getting-started", views: 654, unique: 520, bounce: 45 },
  { path: "/blog/web-vitals-guide", views: 542, unique: 430, bounce: 42 },
];

const referrers = [
  { source: "Google", visitors: 1200, pct: 42 },
  { source: "Direct", visitors: 680, pct: 24 },
  { source: "Twitter/X", visitors: 420, pct: 15 },
  { source: "GitHub", visitors: 310, pct: 11 },
  { source: "Hacker News", visitors: 148, pct: 5 },
  { source: "Other", visitors: 89, pct: 3 },
];

const browsers = [
  { name: "Chrome", pct: 64, color: "from-emerald-500 to-green-500" },
  { name: "Safari", pct: 19, color: "from-blue-500 to-indigo-500" },
  { name: "Firefox", pct: 10, color: "from-amber-500 to-orange-500" },
  { name: "Edge", pct: 5, color: "from-cyan-500 to-teal-500" },
  { name: "Other", pct: 2, color: "from-slate-500 to-slate-400" },
];

const countries = [
  { name: "United States", visitors: 1240, pct: 44, flag: "🇺🇸" },
  { name: "United Kingdom", visitors: 380, pct: 13, flag: "🇬🇧" },
  { name: "Germany", visitors: 320, pct: 11, flag: "🇩🇪" },
  { name: "Canada", visitors: 210, pct: 7, flag: "🇨🇦" },
  { name: "India", visitors: 190, pct: 7, flag: "🇮🇳" },
  { name: "France", visitors: 160, pct: 6, flag: "🇫🇷" },
];

export default function PrivacyPage() {
  return (
    <motion.div initial="hidden" animate="visible" className="space-y-6">
      {/* Header */}
      <motion.div variants={fadeUp} custom={0} className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 border border-violet-500/20">
            <Lock className="h-5 w-5 text-violet-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Privacy-First Analytics</h1>
            <p className="text-slate-400 text-sm">Cookie-free tracking · GDPR/CCPA compliant · &lt;1KB script</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="success" className="gap-1.5">
            <Shield className="h-3 w-3" /> GDPR Compliant
          </Badge>
          <Badge variant="success" className="gap-1.5">
            <CheckCircle2 className="h-3 w-3" /> No Cookies
          </Badge>
        </div>
      </motion.div>

      {/* Tracking script snippet */}
      <motion.div variants={fadeUp} custom={1}>
        <Card className="border-violet-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/10">
                  <FileText className="h-4 w-4 text-violet-400" />
                </div>
                <div>
                  <div className="text-sm font-medium text-white">Tracking Script</div>
                  <div className="text-xs text-slate-400">Add this to your site&apos;s &lt;head&gt; tag · 0.8KB gzipped</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <code className="rounded-md bg-slate-900 border border-slate-800 px-3 py-1.5 font-mono text-xs text-slate-300">
                  &lt;script src=&quot;https://cdn.webguard.ai/t.js&quot; data-site=&quot;abc123&quot;&gt;&lt;/script&gt;
                </code>
                <Button variant="ghost" size="sm">
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Real-time stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        {[
          {
            label: "Visitors Today",
            value: visitorData.today.toLocaleString(),
            change: `+${visitorData.change}%`,
            up: true,
            icon: Users,
          },
          {
            label: "Page Views",
            value: visitorData.pageviews.toLocaleString(),
            change: "+8.2%",
            up: true,
            icon: Eye,
          },
          {
            label: "Bounce Rate",
            value: `${visitorData.bounceRate}%`,
            change: "-2.1%",
            up: true,
            icon: MousePointer,
          },
          {
            label: "Avg Duration",
            value: visitorData.avgDuration,
            change: "+15s",
            up: true,
            icon: Clock,
          },
          {
            label: "Live Visitors",
            value: "42",
            change: "real-time",
            up: true,
            icon: Globe2,
            live: true,
          },
        ].map((stat, i) => (
          <motion.div key={stat.label} variants={fadeUp} custom={2 + i}>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <stat.icon className="h-4 w-4 text-slate-500" />
                  {stat.live ? (
                    <span className="flex items-center gap-1 text-xs text-emerald-400">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      live
                    </span>
                  ) : (
                    <span className={`text-xs font-medium ${stat.up ? "text-emerald-400" : "text-red-400"}`}>
                      {stat.change}
                    </span>
                  )}
                </div>
                <div className="text-2xl font-bold text-white">{stat.value}</div>
                <div className="text-xs text-slate-400">{stat.label}</div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Visitors chart placeholder + Insights */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <motion.div variants={fadeUp} custom={7} className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Visitor Trends</CardTitle>
                <Tabs defaultValue="7d">
                  <TabsList>
                    <TabsTrigger value="24h">24h</TabsTrigger>
                    <TabsTrigger value="7d">7d</TabsTrigger>
                    <TabsTrigger value="30d">30d</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Simplified chart representation */}
                <div className="relative h-48 rounded-lg border border-slate-800/50 bg-slate-800/10 overflow-hidden">
                  <MiniChart
                    data={[1200, 1800, 1600, 2100, 1900, 2400, 2847]}
                    color="#8b5cf6"
                    height={192}
                  />
                  <div className="absolute bottom-0 left-0 right-0 flex justify-between px-4 pb-2 text-[10px] text-slate-500">
                    <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: "Peak Hour", value: "2PM-3PM", sub: "342 visitors" },
                    { label: "Top Device", value: "Desktop", sub: "68% of traffic" },
                    { label: "New vs Return", value: "62% / 38%", sub: "new visitors growing" },
                  ].map((stat) => (
                    <div key={stat.label} className="rounded-lg border border-slate-800/50 bg-slate-800/20 p-3">
                      <div className="text-xs text-slate-400">{stat.label}</div>
                      <div className="text-sm font-medium text-white mt-0.5">{stat.value}</div>
                      <div className="text-xs text-slate-500">{stat.sub}</div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={fadeUp} custom={8}>
          <Card className="h-full border-violet-500/20">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-violet-400" />
                Weekly Insights
              </CardTitle>
              <Badge variant="secondary" className="w-fit">This Week</Badge>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  {
                    insight: "Your bounce rate dropped 23% on mobile from Germany after the font optimization last Tuesday.",
                    type: "positive",
                  },
                  {
                    insight: "Traffic from Twitter/X surged 340% following your thread about accessibility standards.",
                    type: "positive",
                  },
                  {
                    insight: "The /blog/ai-accessibility page has the highest engagement (4m 30s avg), consider creating more AI-related content.",
                    type: "info",
                  },
                  {
                    insight: "Weekend traffic is 60% lower — consider scheduling social posts for Monday-Friday.",
                    type: "neutral",
                  },
                ].map((item, i) => (
                  <div key={i} className="rounded-lg border border-slate-800/50 bg-slate-800/20 p-3">
                    <div className="flex items-start gap-2">
                      {item.type === "positive" ? (
                        <ArrowUpRight className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                      ) : item.type === "info" ? (
                        <TrendingUp className="h-4 w-4 text-violet-400 shrink-0 mt-0.5" />
                      ) : (
                        <ArrowDownRight className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                      )}
                      <p className="text-xs text-slate-300 leading-relaxed">{item.insight}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Top Pages, Referrers, Geo */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <motion.div variants={fadeUp} custom={9}>
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-base">Top Pages</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {topPages.map((page) => (
                  <div key={page.path} className="flex items-center justify-between text-sm">
                    <span className="text-slate-300 truncate max-w-[140px] font-mono text-xs">{page.path}</span>
                    <div className="flex items-center gap-4 shrink-0">
                      <span className="text-xs text-slate-400 w-12 text-right">{page.views.toLocaleString()}</span>
                      <span className={`text-xs w-8 text-right ${page.bounce > 40 ? "text-amber-400" : "text-emerald-400"}`}>
                        {page.bounce}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={fadeUp} custom={10}>
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-base">Referrers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {referrers.map((ref) => (
                  <div key={ref.source}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-slate-300">{ref.source}</span>
                      <span className="text-xs text-slate-400">{ref.visitors.toLocaleString()}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-violet-500 to-purple-500"
                        style={{ width: `${ref.pct}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={fadeUp} custom={11}>
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-base">Countries</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {countries.map((country) => (
                  <div key={country.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{country.flag}</span>
                      <span className="text-sm text-slate-300">{country.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400">{country.visitors.toLocaleString()}</span>
                      <span className="text-xs text-violet-400 w-8 text-right">{country.pct}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Browser/Device breakdown */}
      <motion.div variants={fadeUp} custom={12}>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Browser & Device</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div>
                <h4 className="text-sm text-slate-400 mb-3">Browsers</h4>
                <div className="space-y-2">
                  {browsers.map((browser) => (
                    <div key={browser.name}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-slate-300">{browser.name}</span>
                        <span className="text-xs text-slate-400">{browser.pct}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className={`h-full rounded-full bg-gradient-to-r ${browser.color}`}
                          style={{ width: `${browser.pct}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="text-sm text-slate-400 mb-3">Devices</h4>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { type: "Desktop", pct: 68, icon: Monitor },
                    { type: "Mobile", pct: 28, icon: Smartphone },
                    { type: "Tablet", pct: 4, icon: MonitorSmartphone },
                  ].map((device) => (
                    <div key={device.type} className="rounded-lg border border-slate-800/50 bg-slate-800/20 p-4 text-center">
                      <device.icon className="h-6 w-6 text-violet-400 mx-auto mb-2" />
                      <div className="text-lg font-bold text-white">{device.pct}%</div>
                      <div className="text-xs text-slate-400">{device.type}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
