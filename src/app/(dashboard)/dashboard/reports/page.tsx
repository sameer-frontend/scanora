"use client";

import { motion } from "framer-motion";
import {
  FileText,
  Download,
  Calendar,
  Clock,
  Filter,
  ArrowUpRight,
  Accessibility,
  Zap,
  Lock,
  Share2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

const reports = [
  {
    id: 1,
    title: "Weekly Accessibility Audit",
    type: "accessibility",
    date: "Mar 25, 2026",
    score: 92,
    issues: 28,
    status: "completed",
    icon: Accessibility,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
  },
  {
    id: 2,
    title: "Performance Analysis",
    type: "performance",
    date: "Mar 24, 2026",
    score: 78,
    issues: 15,
    status: "completed",
    icon: Zap,
    color: "text-cyan-400",
    bg: "bg-cyan-500/10",
  },
  {
    id: 3,
    title: "Privacy Compliance Report",
    type: "privacy",
    date: "Mar 23, 2026",
    score: 95,
    issues: 3,
    status: "completed",
    icon: Lock,
    color: "text-violet-400",
    bg: "bg-violet-500/10",
  },
  {
    id: 4,
    title: "Full Site Audit",
    type: "all",
    date: "Mar 20, 2026",
    score: 87,
    issues: 46,
    status: "completed",
    icon: FileText,
    color: "text-slate-400",
    bg: "bg-slate-500/10",
  },
  {
    id: 5,
    title: "Weekly Accessibility Audit",
    type: "accessibility",
    date: "Mar 18, 2026",
    score: 89,
    issues: 35,
    status: "completed",
    icon: Accessibility,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
  },
  {
    id: 6,
    title: "Performance Analysis",
    type: "performance",
    date: "Mar 17, 2026",
    score: 80,
    issues: 12,
    status: "completed",
    icon: Zap,
    color: "text-cyan-400",
    bg: "bg-cyan-500/10",
  },
];

export default function ReportsPage() {
  return (
    <motion.div initial="hidden" animate="visible" className="space-y-6">
      {/* Header */}
      <motion.div variants={fadeUp} custom={0} className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-500/10 border border-slate-500/20">
            <FileText className="h-5 w-5 text-slate-400" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white">Reports</h1>
            <p className="text-slate-400 text-xs sm:text-sm">View and export your audit reports</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm">
            <Calendar className="h-4 w-4 mr-1" /> Schedule
          </Button>
          <Button size="sm">
            <FileText className="h-4 w-4 mr-1" /> Generate Report
          </Button>
        </div>
      </motion.div>

      {/* Summary */}
      <motion.div variants={fadeUp} custom={1}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-white">24</div>
              <div className="text-xs text-slate-400 mt-1">Total Reports</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-emerald-400">87</div>
              <div className="text-xs text-slate-400 mt-1">Avg. Score</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-amber-400">46</div>
              <div className="text-xs text-slate-400 mt-1">Open Issues</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-cyan-400">128</div>
              <div className="text-xs text-slate-400 mt-1">Auto-Fixed</div>
            </CardContent>
          </Card>
        </div>
      </motion.div>

      {/* Reports list */}
      <motion.div variants={fadeUp} custom={2}>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Report History</CardTitle>
              <Button variant="ghost" size="sm">
                <Filter className="h-4 w-4 mr-1" /> Filter
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {reports.map((report) => {
                const Icon = report.icon;
                return (
                  <div
                    key={report.id}
                    className="flex items-center gap-4 rounded-lg border border-slate-800/50 bg-slate-800/20 p-4 hover:bg-slate-800/40 transition-colors cursor-pointer"
                  >
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${report.bg}`}>
                      <Icon className={`h-5 w-5 ${report.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-white">{report.title}</h4>
                      <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-400">
                        <Clock className="h-3 w-3" /> {report.date}
                        <span>·</span>
                        <span>{report.issues} issues found</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 shrink-0">
                      <div className="text-right">
                        <div className={`text-lg font-bold ${
                          report.score >= 90 ? "text-emerald-400" :
                          report.score >= 70 ? "text-amber-400" : "text-red-400"
                        }`}>
                          {report.score}
                        </div>
                        <div className="text-xs text-slate-500">score</div>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Share2 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <ArrowUpRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
