import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type {
  DeviceAccessibilityResult,
  DevicePerformanceResult,
  DeviceSeoResult,
} from "@/lib/types";

// ── Brand Color Palette (matches website theme) ──────────────
type RGB = [number, number, number];
const C = {
  navy:    [10, 14, 26]    as RGB, // --background
  emerald: [16, 185, 129]  as RGB, // --primary
  cyan:    [6, 182, 212]   as RGB, // --accent
  orange:  [249, 115, 22]  as RGB,
  violet:  [139, 92, 246]  as RGB,
  red:     [239, 68, 68]   as RGB, // --destructive
  amber:   [245, 158, 11]  as RGB,
  blue:    [59, 130, 246]  as RGB,
  green:   [34, 197, 94]   as RGB,
  dark:    [15, 23, 42]    as RGB,
  slate:   [100, 116, 139] as RGB,
  gray:    [148, 163, 184] as RGB,
  light:   [241, 245, 249] as RGB,
  lighter: [248, 250, 252] as RGB,
  white:   [255, 255, 255] as RGB,
  border:  [226, 232, 240] as RGB,
};

const SCOPE_ACCENT: Record<string, RGB> = {
  accessibility: C.emerald,
  performance: C.cyan,
  seo: C.orange,
};

function scoreColor(s: number): RGB {
  if (s >= 90) return C.emerald;
  if (s >= 50) return C.amber;
  return C.red;
}

function scoreLabel(s: number): string {
  if (s >= 90) return "Excellent";
  if (s >= 70) return "Good";
  if (s >= 50) return "Needs Work";
  return "Poor";
}

function ensurePage(doc: jsPDF, y: number, needed: number): number {
  if (y + needed > 275) { doc.addPage(); return 25; }
  return y;
}

// ── Drawing Primitives ───────────────────────────────────────

/** Draws a donut score ring with centered score text */
function drawDonut(
  doc: jsPDF, cx: number, cy: number, outerR: number, innerR: number,
  score: number, color: RGB,
) {
  const steps = 72;
  // Background track
  for (let i = 0; i < steps; i++) {
    const a1 = (i / steps) * Math.PI * 2 - Math.PI / 2;
    const a2 = ((i + 1) / steps) * Math.PI * 2 - Math.PI / 2;
    doc.setFillColor(...C.light);
    doc.triangle(
      cx + outerR * Math.cos(a1), cy + outerR * Math.sin(a1),
      cx + outerR * Math.cos(a2), cy + outerR * Math.sin(a2),
      cx, cy, "F",
    );
  }
  // Score arc
  const pct = Math.min(score / 100, 1);
  const vSteps = Math.max(4, Math.ceil(pct * steps));
  for (let i = 0; i < vSteps; i++) {
    const a1 = -Math.PI / 2 + (i / vSteps) * pct * Math.PI * 2;
    const a2 = -Math.PI / 2 + ((i + 1) / vSteps) * pct * Math.PI * 2;
    doc.setFillColor(...color);
    doc.triangle(
      cx + outerR * Math.cos(a1), cy + outerR * Math.sin(a1),
      cx + outerR * Math.cos(a2), cy + outerR * Math.sin(a2),
      cx, cy, "F",
    );
  }
  // Inner hole
  const hSteps = 54;
  for (let i = 0; i < hSteps; i++) {
    const a1 = (i / hSteps) * Math.PI * 2;
    const a2 = ((i + 1) / hSteps) * Math.PI * 2;
    doc.setFillColor(...C.white);
    doc.triangle(
      cx + innerR * Math.cos(a1), cy + innerR * Math.sin(a1),
      cx + innerR * Math.cos(a2), cy + innerR * Math.sin(a2),
      cx, cy, "F",
    );
  }
  // Score text
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...color);
  doc.text(`${score}`, cx, cy + 2, { align: "center" });
  doc.setFontSize(7);
  doc.setTextColor(...C.slate);
  doc.setFont("helvetica", "normal");
  doc.text("out of 100", cx, cy + 7, { align: "center" });
}

/** Mini donut for distribution charts */
function drawMiniDonut(
  doc: jsPDF, cx: number, cy: number, r: number, innerR: number,
  value: number, max: number, color: RGB,
) {
  const steps = 48;
  for (let i = 0; i < steps; i++) {
    const a1 = (i / steps) * Math.PI * 2 - Math.PI / 2;
    const a2 = ((i + 1) / steps) * Math.PI * 2 - Math.PI / 2;
    doc.setFillColor(...C.light);
    doc.triangle(cx + r * Math.cos(a1), cy + r * Math.sin(a1), cx + r * Math.cos(a2), cy + r * Math.sin(a2), cx, cy, "F");
  }
  const pct = max > 0 ? Math.min(value / max, 1) : 0;
  const vs = Math.max(3, Math.ceil(pct * steps));
  for (let i = 0; i < vs; i++) {
    const a1 = -Math.PI / 2 + (i / vs) * pct * Math.PI * 2;
    const a2 = -Math.PI / 2 + ((i + 1) / vs) * pct * Math.PI * 2;
    doc.setFillColor(...color);
    doc.triangle(cx + r * Math.cos(a1), cy + r * Math.sin(a1), cx + r * Math.cos(a2), cy + r * Math.sin(a2), cx, cy, "F");
  }
  const hs = 36;
  for (let i = 0; i < hs; i++) {
    const a1 = (i / hs) * Math.PI * 2;
    const a2 = ((i + 1) / hs) * Math.PI * 2;
    doc.setFillColor(...C.white);
    doc.triangle(cx + innerR * Math.cos(a1), cy + innerR * Math.sin(a1), cx + innerR * Math.cos(a2), cy + innerR * Math.sin(a2), cx, cy, "F");
  }
}

/** Horizontal bar with label and value text */
function drawHBar(
  doc: jsPDF, x: number, y: number, width: number, height: number,
  value: number, max: number, color: RGB, label: string, valueText: string,
) {
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...C.dark);
  doc.text(label, x, y - 2);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...color);
  doc.text(valueText, x + width, y - 2, { align: "right" });
  // Track
  doc.setFillColor(...C.light);
  doc.roundedRect(x, y, width, height, height / 2, height / 2, "F");
  // Fill
  const barW = max > 0 ? Math.max(height, (value / max) * width) : height;
  doc.setFillColor(...color);
  doc.roundedRect(x, y, Math.min(barW, width), height, height / 2, height / 2, "F");
}

/** Stat card with colored top accent */
function drawStatCard(
  doc: jsPDF, x: number, y: number, w: number, h: number,
  label: string, value: string, color: RGB,
) {
  doc.setFillColor(...C.lighter);
  doc.setDrawColor(...C.border);
  doc.setLineWidth(0.3);
  doc.roundedRect(x, y, w, h, 2, 2, "FD");
  // Accent bar
  doc.setFillColor(...color);
  doc.roundedRect(x + 3, y + 2, w - 6, 1.5, 0.5, 0.5, "F");
  // Value
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...color);
  doc.text(value, x + w / 2, y + 14, { align: "center" });
  // Label
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...C.slate);
  doc.text(label, x + w / 2, y + 20, { align: "center" });
}

/** Gradient header banner (dark navy → slightly lighter) with emerald-to-cyan accent line */
function drawCoverHeader(doc: jsPDF, pw: number, h: number) {
  const steps = h;
  for (let i = 0; i < steps; i++) {
    const t = i / steps;
    doc.setFillColor(
      Math.round(10 + t * 5),
      Math.round(14 + t * 9),
      Math.round(26 + t * 16),
    );
    doc.rect(0, i, pw, 1.2, "F");
  }
  // Accent gradient line at bottom
  const lineY = h - 1.5;
  const segs = 60;
  const segW = pw / segs;
  for (let i = 0; i < segs; i++) {
    const t = i / segs;
    doc.setFillColor(
      Math.round(16 + t * (6 - 16)),
      Math.round(185 + t * (182 - 185)),
      Math.round(129 + t * (212 - 129)),
    );
    doc.rect(i * segW, lineY, segW + 0.5, 1.5, "F");
  }
}

/** Section header with colored accent line */
function drawSectionHeader(doc: jsPDF, y: number, title: string, subtitle: string, color: RGB): number {
  y = ensurePage(doc, y, 20);
  doc.setFillColor(...color);
  doc.roundedRect(14, y, 40, 1.5, 0.5, 0.5, "F");
  y += 6;
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...C.dark);
  doc.text(title, 14, y);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...C.slate);
  doc.text(subtitle, 14, y + 6);
  return y + 14;
}

/** Add a subsection title */
function drawSubtitle(doc: jsPDF, y: number, title: string): number {
  y = ensurePage(doc, y, 12);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...C.dark);
  doc.text(title, 14, y);
  return y + 8;
}

// ═══════════════════════════════════════════════════════════════
//  MAIN EXPORT
// ═══════════════════════════════════════════════════════════════

export type ReportScope = "accessibility" | "performance" | "seo";

export function exportPdfReport({
  url,
  scope,
  accessibilityData,
  performanceData,
  seoData,
}: {
  url: string;
  scope: ReportScope;
  accessibilityData: DeviceAccessibilityResult[] | null;
  performanceData: DevicePerformanceResult[] | null;
  seoData: DeviceSeoResult[] | null;
}) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pw = doc.internal.pageSize.getWidth();
  const accent = SCOPE_ACCENT[scope];

  const scopeLabels: Record<ReportScope, string> = {
    accessibility: "Accessibility",
    performance: "Performance",
    seo: "SEO",
  };

  const scopeDesc: Record<ReportScope, string> = {
    accessibility: "WCAG compliance & assistive technology audit",
    performance: "Core Web Vitals & loading performance analysis",
    seo: "Search engine optimization & metadata review",
  };

  // ── Cover Header ───────────────────────────────────────────
  drawCoverHeader(doc, pw, 55);

  // Brand
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...C.emerald);
  doc.text("SCANORA", 14, 16);

  // Scope badge
  const badgeText = scopeLabels[scope].toUpperCase();
  const badgeW = doc.getTextWidth(badgeText) * 0.8 + 8;
  doc.setFillColor(...accent);
  doc.roundedRect(pw - 14 - badgeW, 10, badgeW, 8, 2, 2, "F");
  doc.setFontSize(7);
  doc.setTextColor(...C.white);
  doc.setFont("helvetica", "bold");
  doc.text(badgeText, pw - 14 - badgeW / 2, 15.5, { align: "center" });

  // Title
  doc.setFontSize(20);
  doc.setTextColor(...C.white);
  doc.setFont("helvetica", "bold");
  doc.text(`${scopeLabels[scope]} Report`, 14, 32);

  // URL & date
  doc.setFontSize(9);
  doc.setTextColor(...C.gray);
  doc.setFont("helvetica", "normal");
  doc.text(url, 14, 40);
  doc.text(
    `Generated ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`,
    14, 47,
  );

  let y = 65;

  // ── ACCESSIBILITY ──────────────────────────────────────────
  if (scope === "accessibility" && accessibilityData?.length) {
    for (const result of accessibilityData) {
      const { data, device } = result;
      y = drawSectionHeader(doc, y, `${device.name} — ${device.width}×${device.height}`, scopeDesc[scope], accent);

      // Score donut + stat cards
      y = ensurePage(doc, y, 55);
      drawDonut(doc, 40, y + 20, 15, 10, data.score, scoreColor(data.score));
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...scoreColor(data.score));
      doc.text(scoreLabel(data.score), 40, y + 38, { align: "center" });

      const cardW = 30;
      const cardGap = 4;
      const cx = 70;
      drawStatCard(doc, cx, y, cardW, 24, "Critical", `${data.stats.critical}`, C.red);
      drawStatCard(doc, cx + cardW + cardGap, y, cardW, 24, "Serious", `${data.stats.serious}`, C.amber);
      drawStatCard(doc, cx + (cardW + cardGap) * 2, y, cardW, 24, "Moderate", `${data.stats.moderate}`, C.blue);
      drawStatCard(doc, cx + (cardW + cardGap) * 3, y, cardW, 24, "Minor", `${data.stats.minor}`, C.slate);
      y += 48;

      // Severity bar chart
      y = drawSubtitle(doc, y, "Issue Severity Breakdown");
      const maxIss = Math.max(data.stats.critical, data.stats.serious, data.stats.moderate, data.stats.minor, 1);
      drawHBar(doc, 14, y, pw - 28, 4, data.stats.critical, maxIss, C.red, "Critical", `${data.stats.critical}`);
      y += 14;
      drawHBar(doc, 14, y, pw - 28, 4, data.stats.serious, maxIss, C.amber, "Serious", `${data.stats.serious}`);
      y += 14;
      drawHBar(doc, 14, y, pw - 28, 4, data.stats.moderate, maxIss, C.blue, "Moderate", `${data.stats.moderate}`);
      y += 14;
      drawHBar(doc, 14, y, pw - 28, 4, data.stats.minor, maxIss, C.slate, "Minor", `${data.stats.minor}`);
      y += 14;

      // WCAG Principles chart
      y = ensurePage(doc, y, 50);
      y = drawSubtitle(doc, y, "WCAG Principles");
      const principles = [
        { name: "Perceivable", score: data.principles.perceivable.score, issues: data.principles.perceivable.issueCount },
        { name: "Operable", score: data.principles.operable.score, issues: data.principles.operable.issueCount },
        { name: "Understandable", score: data.principles.understandable.score, issues: data.principles.understandable.issueCount },
        { name: "Robust", score: data.principles.robust.score, issues: data.principles.robust.issueCount },
      ];
      for (const p of principles) {
        y = ensurePage(doc, y, 14);
        drawHBar(doc, 14, y, pw - 28, 4, p.score, 100, scoreColor(p.score), `${p.name} (${p.issues} issues)`, `${p.score}%`);
        y += 14;
      }

      // Issues table
      if (data.issues.length > 0) {
        y = ensurePage(doc, y, 30);
        y = drawSubtitle(doc, y, "Issues Found");
        autoTable(doc, {
          startY: y,
          head: [["Severity", "Issue", "WCAG", "Recommended Fix"]],
          body: data.issues.map((issue) => [
            issue.severity.charAt(0).toUpperCase() + issue.severity.slice(1),
            issue.title,
            issue.wcag || "—",
            issue.fix?.slice(0, 80) || "—",
          ]),
          margin: { left: 14, right: 14 },
          styles: { fontSize: 7, cellPadding: 3, overflow: "linebreak", lineColor: C.border, lineWidth: 0.2 },
          headStyles: { fillColor: accent, textColor: C.white, fontStyle: "bold", lineWidth: 0 },
          alternateRowStyles: { fillColor: C.lighter },
          columnStyles: {
            0: { cellWidth: 18, fontStyle: "bold" },
            1: { cellWidth: 50 },
            2: { cellWidth: 20 },
            3: { cellWidth: "auto" },
          },
          didParseCell(data) {
            if (data.section === "body" && data.column.index === 0) {
              const val = String(data.cell.raw).toLowerCase();
              if (val === "critical") data.cell.styles.textColor = C.red;
              else if (val === "serious") data.cell.styles.textColor = C.amber;
              else if (val === "moderate") data.cell.styles.textColor = C.blue;
              else data.cell.styles.textColor = C.slate;
            }
          },
        });
        y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 12;
      }
      y += 5;
    }
  }

  // ── PERFORMANCE ────────────────────────────────────────────
  if (scope === "performance" && performanceData?.length) {
    for (const result of performanceData) {
      const { data, device } = result;
      y = drawSectionHeader(doc, y, `${device.name} — ${device.width}×${device.height}`, scopeDesc[scope], accent);

      // Score donut + CWV cards
      y = ensurePage(doc, y, 55);
      drawDonut(doc, 40, y + 20, 15, 10, data.score, scoreColor(data.score));
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...scoreColor(data.score));
      doc.text(scoreLabel(data.score), 40, y + 38, { align: "center" });

      const cwv = data.coreWebVitals;
      const cwvItems = [
        { label: "LCP", value: cwv.lcp.value, rating: cwv.lcp.rating },
        { label: "FCP", value: cwv.fcp.value, rating: cwv.fcp.rating },
        { label: "TBT", value: cwv.tbt.value, rating: cwv.tbt.rating },
        { label: "CLS", value: cwv.cls.value, rating: cwv.cls.rating },
      ];
      const cW = 30, cG = 4, cX = 70;
      cwvItems.forEach((item, i) => {
        const rc: RGB = item.rating === "good" ? C.emerald : item.rating === "needs-improvement" ? C.amber : C.red;
        drawStatCard(doc, cX + (cW + cG) * i, y, cW, 24, item.label, item.value, rc);
      });
      y += 48;

      // CWV gauge bars
      y = ensurePage(doc, y, 50);
      y = drawSubtitle(doc, y, "Core Web Vitals");
      const cwvBars = [
        { name: "Largest Contentful Paint", val: data.metrics.lcp, max: 4000, display: cwv.lcp.value, rating: cwv.lcp.rating },
        { name: "First Contentful Paint", val: data.metrics.fcp, max: 3000, display: cwv.fcp.value, rating: cwv.fcp.rating },
        { name: "Total Blocking Time", val: data.metrics.tbt, max: 600, display: cwv.tbt.value, rating: cwv.tbt.rating },
        { name: "Cumulative Layout Shift", val: data.metrics.cls * 1000, max: 250, display: cwv.cls.value, rating: cwv.cls.rating },
      ];
      for (const m of cwvBars) {
        y = ensurePage(doc, y, 14);
        const rc: RGB = m.rating === "good" ? C.emerald : m.rating === "needs-improvement" ? C.amber : C.red;
        drawHBar(doc, 14, y, pw - 28, 4, Math.min(m.val, m.max), m.max, rc, m.name, m.display);
        y += 14;
      }

      // Loading metrics cards
      y = ensurePage(doc, y, 38);
      y = drawSubtitle(doc, y, "Loading Metrics");
      const loadItems = [
        { label: "TTFB", value: `${data.metrics.ttfb}ms` },
        { label: "DOM Ready", value: `${data.metrics.domContentLoaded}ms` },
        { label: "Full Load", value: `${data.metrics.loadTime}ms` },
        { label: "Page Size", value: `${(data.metrics.totalSize / 1024).toFixed(0)} KB` },
      ];
      const mW = (pw - 28 - 12) / 4;
      loadItems.forEach((m, i) => {
        drawStatCard(doc, 14 + (mW + 4) * i, y, mW, 22, m.label, m.value, C.cyan);
      });
      y += 30;

      // Asset breakdown bars + mini donuts
      if (data.assets) {
        y = ensurePage(doc, y, 80);
        y = drawSubtitle(doc, y, "Asset Breakdown");
        const assetTypes = [
          { name: "Scripts", d: data.assets.scripts, color: C.orange },
          { name: "Stylesheets", d: data.assets.stylesheets, color: C.cyan },
          { name: "Images", d: data.assets.images, color: C.emerald },
          { name: "Fonts", d: data.assets.fonts, color: C.violet },
          { name: "Other", d: data.assets.other, color: C.slate },
        ];
        const maxBytes = Math.max(...assetTypes.map((a) => a.d.sizeBytes), 1);
        for (const a of assetTypes) {
          y = ensurePage(doc, y, 14);
          drawHBar(doc, 14, y, pw - 28, 4, a.d.sizeBytes, maxBytes, a.color, `${a.name} (${a.d.count} files)`, a.d.size);
          y += 14;
        }

        // Mini donut distribution row
        y = ensurePage(doc, y, 30);
        const totalBytes = assetTypes.reduce((s, a) => s + a.d.sizeBytes, 0) || 1;
        const gap = (pw - 28) / 5;
        assetTypes.forEach((a, i) => {
          const cx = 14 + gap * i + gap / 2;
          drawMiniDonut(doc, cx, y + 10, 8, 5, a.d.sizeBytes, totalBytes, a.color);
          doc.setFontSize(6);
          doc.setFont("helvetica", "bold");
          doc.setTextColor(...a.color);
          doc.text(`${Math.round((a.d.sizeBytes / totalBytes) * 100)}%`, cx, y + 12, { align: "center" });
          doc.setFontSize(6);
          doc.setTextColor(...C.slate);
          doc.setFont("helvetica", "normal");
          doc.text(a.name, cx, y + 22, { align: "center" });
        });
        y += 30;
      }

      // Opportunities table
      if (data.opportunities.length > 0) {
        y = ensurePage(doc, y, 30);
        y = drawSubtitle(doc, y, "Optimization Opportunities");
        autoTable(doc, {
          startY: y,
          head: [["Opportunity", "Estimated Savings", "Impact"]],
          body: data.opportunities.map((o) => [o.title, o.savings, o.impact.charAt(0).toUpperCase() + o.impact.slice(1)]),
          margin: { left: 14, right: 14 },
          styles: { fontSize: 7, cellPadding: 3, overflow: "linebreak", lineColor: C.border, lineWidth: 0.2 },
          headStyles: { fillColor: accent, textColor: C.white, fontStyle: "bold", lineWidth: 0 },
          alternateRowStyles: { fillColor: C.lighter },
          columnStyles: {
            0: { cellWidth: "auto" },
            1: { cellWidth: 35 },
            2: { cellWidth: 20, fontStyle: "bold" },
          },
          didParseCell(data) {
            if (data.section === "body" && data.column.index === 2) {
              const val = String(data.cell.raw).toLowerCase();
              if (val === "high") data.cell.styles.textColor = C.red;
              else if (val === "medium") data.cell.styles.textColor = C.amber;
              else data.cell.styles.textColor = C.emerald;
            }
          },
        });
        y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 12;
      }
      y += 5;
    }
  }

  // ── SEO ────────────────────────────────────────────────────
  if (scope === "seo" && seoData?.length) {
    for (const result of seoData) {
      const { data, device } = result;
      y = drawSectionHeader(doc, y, `${device.name} — ${device.width}×${device.height}`, scopeDesc[scope], accent);

      // Score donut + quick stat cards
      y = ensurePage(doc, y, 55);
      drawDonut(doc, 40, y + 20, 15, 10, data.score, scoreColor(data.score));
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...scoreColor(data.score));
      doc.text(scoreLabel(data.score), 40, y + 38, { align: "center" });

      const qCards = [
        { label: "Headings", value: `${data.headings.headings.length}`, color: data.headings.hasH1 ? C.emerald : C.red },
        { label: "Links", value: `${data.links.internal + data.links.external}`, color: C.cyan },
        { label: "Images", value: `${data.images.total}`, color: data.images.withoutAlt > 0 ? C.amber : C.emerald },
        { label: "OG Tags", value: `${5 - data.openGraph.missing.length}/5`, color: data.openGraph.missing.length > 2 ? C.red : C.emerald },
      ];
      const qW = 30, qG = 4, qX = 70;
      qCards.forEach((c, i) => {
        drawStatCard(doc, qX + (qW + qG) * i, y, qW, 24, c.label, c.value, c.color);
      });
      y += 48;

      // Meta information with colored status dots
      y = ensurePage(doc, y, 60);
      y = drawSubtitle(doc, y, "Meta Information");
      const metaItems = [
        { key: "Title", value: data.title.value?.slice(0, 70) || "Missing", status: data.title.status },
        { key: "Meta Description", value: data.metaDescription.value?.slice(0, 70) || "Missing", status: data.metaDescription.status },
        { key: "Canonical URL", value: data.canonical.url || "Not set", status: data.canonical.isValid ? "good" : "error" },
        { key: "Language", value: data.language.value || "Missing", status: data.language.hasLang ? "good" : "error" },
        { key: "Viewport", value: data.viewport.hasTag ? "Set" : "Missing", status: data.viewport.hasTag ? "good" : "error" },
        { key: "Robots", value: `${data.robots.index ? "Index" : "Noindex"}, ${data.robots.follow ? "Follow" : "Nofollow"}`, status: data.robots.index ? "good" : "warning" },
      ];
      for (const item of metaItems) {
        y = ensurePage(doc, y, 8);
        const sc: RGB = item.status === "good" ? C.emerald : item.status === "warning" ? C.amber : C.red;
        doc.setFillColor(...sc);
        doc.circle(16, y - 1, 1.2, "F");
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(...C.slate);
        doc.text(item.key, 20, y);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...C.dark);
        const vt = item.value.length > 70 ? item.value.slice(0, 67) + "..." : item.value;
        doc.text(vt, 60, y);
        y += 7;
      }
      y += 4;

      // Content analysis bars
      y = ensurePage(doc, y, 60);
      y = drawSubtitle(doc, y, "Content Analysis");
      const contentBars = [
        { name: "H1 Tags", value: data.headings.h1Count, max: 3, color: data.headings.h1Count === 1 ? C.emerald : C.amber, vt: `${data.headings.h1Count}` },
        { name: "Internal Links", value: data.links.internal, max: Math.max(data.links.internal, data.links.external, 1), color: C.cyan, vt: `${data.links.internal}` },
        { name: "External Links", value: data.links.external, max: Math.max(data.links.internal, data.links.external, 1), color: C.orange, vt: `${data.links.external}` },
        { name: "Images with Alt", value: data.images.withAlt, max: Math.max(data.images.total, 1), color: C.emerald, vt: `${data.images.withAlt}/${data.images.total}` },
        { name: "Images without Alt", value: data.images.withoutAlt, max: Math.max(data.images.total, 1), color: C.red, vt: `${data.images.withoutAlt}/${data.images.total}` },
      ];
      for (const b of contentBars) {
        y = ensurePage(doc, y, 14);
        drawHBar(doc, 14, y, pw - 28, 4, b.value, b.max, b.color, b.name, b.vt);
        y += 14;
      }

      // Structured Data & Open Graph info cards
      y = ensurePage(doc, y, 30);
      const halfW = (pw - 28 - 8) / 2;
      // Structured Data card
      doc.setFillColor(...C.lighter);
      doc.setDrawColor(...C.border);
      doc.setLineWidth(0.3);
      doc.roundedRect(14, y, halfW, 20, 2, 2, "FD");
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...C.dark);
      doc.text("Structured Data", 18, y + 7);
      doc.setFontSize(7);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...C.slate);
      doc.text(data.structuredData.hasJsonLd ? `${data.structuredData.count} JSON-LD block(s)` : "No structured data found", 18, y + 13);
      doc.setFillColor(...(data.structuredData.hasJsonLd ? C.emerald : C.red));
      doc.circle(14 + halfW - 6, y + 10, 2, "F");

      // Open Graph card
      doc.setFillColor(...C.lighter);
      doc.setDrawColor(...C.border);
      doc.roundedRect(14 + halfW + 8, y, halfW, 20, 2, 2, "FD");
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...C.dark);
      doc.text("Open Graph", 18 + halfW + 8, y + 7);
      doc.setFontSize(7);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...C.slate);
      const ogCount = 5 - data.openGraph.missing.length;
      doc.text(
        `${ogCount}/5 tags set${data.openGraph.missing.length > 0 ? ` · Missing: ${data.openGraph.missing.join(", ")}` : ""}`,
        18 + halfW + 8, y + 13,
      );
      doc.setFillColor(...(ogCount >= 4 ? C.emerald : ogCount >= 2 ? C.amber : C.red));
      doc.circle(14 + halfW * 2 + 8 - 6, y + 10, 2, "F");
      y += 28;

      // Issues table
      const nonPassIssues = data.issues.filter((i) => i.severity !== "pass");
      if (nonPassIssues.length > 0) {
        y = ensurePage(doc, y, 30);
        y = drawSubtitle(doc, y, "Issues & Recommendations");
        autoTable(doc, {
          startY: y,
          head: [["Severity", "Issue", "Category"]],
          body: nonPassIssues.map((issue) => [
            issue.severity.charAt(0).toUpperCase() + issue.severity.slice(1),
            issue.title,
            issue.category,
          ]),
          margin: { left: 14, right: 14 },
          styles: { fontSize: 7, cellPadding: 3, overflow: "linebreak", lineColor: C.border, lineWidth: 0.2 },
          headStyles: { fillColor: accent, textColor: C.white, fontStyle: "bold", lineWidth: 0 },
          alternateRowStyles: { fillColor: C.lighter },
          columnStyles: {
            0: { cellWidth: 20, fontStyle: "bold" },
            1: { cellWidth: "auto" },
            2: { cellWidth: 30 },
          },
          didParseCell(data) {
            if (data.section === "body" && data.column.index === 0) {
              const val = String(data.cell.raw).toLowerCase();
              if (val === "critical") data.cell.styles.textColor = C.red;
              else if (val === "warning") data.cell.styles.textColor = C.amber;
              else data.cell.styles.textColor = C.slate;
            }
          },
        });
        y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 12;
      }
      y += 5;
    }
  }

  // ── Footer on every page ───────────────────────────────────
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    // Divider line
    doc.setDrawColor(...C.border);
    doc.setLineWidth(0.3);
    doc.line(14, 283, pw - 14, 283);
    // Footer text
    doc.setFontSize(6.5);
    doc.setTextColor(...C.gray);
    doc.setFont("helvetica", "normal");
    doc.text("Scanora", 14, 288);
    doc.text(url, pw / 2, 288, { align: "center" });
    doc.text(`Page ${i} of ${totalPages}`, pw - 14, 288, { align: "right" });
  }

  // ── Download ───────────────────────────────────────────────
  const hostname = (() => {
    try { return new URL(url).hostname; } catch { return "site"; }
  })();
  doc.save(`Scanora-${scopeLabels[scope]}-${hostname}-${Date.now()}.pdf`);
}
