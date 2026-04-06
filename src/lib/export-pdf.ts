import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type {
  DeviceAccessibilityResult,
  DevicePerformanceResult,
  DeviceSeoResult,
} from "@/lib/types";

const COLORS = {
  primary: [16, 185, 129] as [number, number, number], // emerald-500
  cyan: [6, 182, 212] as [number, number, number],
  orange: [249, 115, 22] as [number, number, number],
  dark: [15, 23, 42] as [number, number, number],
  muted: [100, 116, 139] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
  red: [239, 68, 68] as [number, number, number],
  amber: [245, 158, 11] as [number, number, number],
  blue: [59, 130, 246] as [number, number, number],
};

function scoreColor(score: number): [number, number, number] {
  if (score >= 90) return COLORS.primary;
  if (score >= 50) return COLORS.amber;
  return COLORS.red;
}

function addPageHeader(doc: jsPDF, y: number, title: string, color: [number, number, number]): number {
  doc.setFillColor(...color);
  doc.roundedRect(14, y, 6, 18, 2, 2, "F");
  doc.setFontSize(16);
  doc.setTextColor(...COLORS.dark);
  doc.setFont("helvetica", "bold");
  doc.text(title, 26, y + 12);
  return y + 28;
}

function addSectionTitle(doc: jsPDF, y: number, title: string): number {
  if (y > 260) { doc.addPage(); y = 20; }
  doc.setFontSize(11);
  doc.setTextColor(...COLORS.dark);
  doc.setFont("helvetica", "bold");
  doc.text(title, 14, y);
  return y + 8;
}

function addKeyValue(doc: jsPDF, y: number, key: string, value: string, valueColor?: [number, number, number]): number {
  if (y > 275) { doc.addPage(); y = 20; }
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...COLORS.muted);
  doc.text(key, 18, y);
  doc.setTextColor(...(valueColor ?? COLORS.dark));
  doc.setFont("helvetica", "bold");
  doc.text(value, 80, y);
  doc.setFont("helvetica", "normal");
  return y + 6;
}

function ensureSpace(doc: jsPDF, y: number, needed: number): number {
  if (y + needed > 280) { doc.addPage(); return 20; }
  return y;
}

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
  const pageWidth = doc.internal.pageSize.getWidth();

  const scopeLabels: Record<ReportScope, string> = {
    accessibility: "Accessibility",
    performance: "Performance",
    seo: "SEO",
  };

  // ── Cover / Title ──────────────────────────────────────────
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageWidth, 60, "F");
  doc.setFontSize(22);
  doc.setTextColor(...COLORS.white);
  doc.setFont("helvetica", "bold");
  doc.text(`Scanora ${scopeLabels[scope]} Report`, 14, 28);
  doc.setFontSize(10);
  doc.setTextColor(148, 163, 184);
  doc.setFont("helvetica", "normal");
  doc.text(url, 14, 38);
  doc.text(`Generated: ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`, 14, 46);

  let y = 70;

  // ── Accessibility Section ──────────────────────────────────
  if (scope === "accessibility" && accessibilityData && accessibilityData.length > 0) {
    y = ensureSpace(doc, y, 40);
    y = addPageHeader(doc, y, "Accessibility Audit", COLORS.primary);

    for (const result of accessibilityData) {
      y = ensureSpace(doc, y, 30);
      y = addSectionTitle(doc, y, `Device: ${result.device.name} (${result.device.width}×${result.device.height})`);
      y = addKeyValue(doc, y, "Score", `${result.data.score}/100`, scoreColor(result.data.score));
      y = addKeyValue(doc, y, "Critical", `${result.data.stats.critical}`, result.data.stats.critical > 0 ? COLORS.red : COLORS.primary);
      y = addKeyValue(doc, y, "Serious", `${result.data.stats.serious}`, result.data.stats.serious > 0 ? COLORS.amber : COLORS.primary);
      y = addKeyValue(doc, y, "Moderate", `${result.data.stats.moderate}`, result.data.stats.moderate > 0 ? COLORS.blue : COLORS.primary);
      y = addKeyValue(doc, y, "Minor", `${result.data.stats.minor}`);
      y += 4;

      // Issues table
      if (result.data.issues.length > 0) {
        y = ensureSpace(doc, y, 20);
        const tableData = result.data.issues.map((issue) => [
          issue.severity.charAt(0).toUpperCase() + issue.severity.slice(1),
          issue.title,
          issue.wcag || "—",
          issue.fix?.slice(0, 80) || "—",
        ]);

        autoTable(doc, {
          startY: y,
          head: [["Severity", "Issue", "WCAG", "Recommended Fix"]],
          body: tableData,
          margin: { left: 14, right: 14 },
          styles: { fontSize: 7, cellPadding: 2, overflow: "linebreak" },
          headStyles: { fillColor: COLORS.primary, textColor: COLORS.white, fontStyle: "bold" },
          columnStyles: {
            0: { cellWidth: 18 },
            1: { cellWidth: 50 },
            2: { cellWidth: 20 },
            3: { cellWidth: "auto" },
          },
          didParseCell(data) {
            if (data.section === "body" && data.column.index === 0) {
              const val = String(data.cell.raw).toLowerCase();
              if (val === "critical") data.cell.styles.textColor = COLORS.red;
              else if (val === "serious") data.cell.styles.textColor = COLORS.amber;
              else if (val === "moderate") data.cell.styles.textColor = COLORS.blue;
            }
          },
        });
        y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
      }
    }
  }

  // ── Performance Section ────────────────────────────────────
  if (scope === "performance" && performanceData && performanceData.length > 0) {
    y = ensureSpace(doc, y, 50);
    y = addPageHeader(doc, y, "Performance Audit", COLORS.cyan);

    for (const result of performanceData) {
      y = ensureSpace(doc, y, 50);
      y = addSectionTitle(doc, y, `Device: ${result.device.name} (${result.device.width}×${result.device.height})`);
      y = addKeyValue(doc, y, "Score", `${result.data.score}/100`, scoreColor(result.data.score));

      // Core Web Vitals
      const cwv = result.data.coreWebVitals;
      y = ensureSpace(doc, y, 30);
      const vitals = [
        ["LCP", cwv.lcp.value, cwv.lcp.rating],
        ["FCP", cwv.fcp.value, cwv.fcp.rating],
        ["TBT", cwv.tbt.value, cwv.tbt.rating],
        ["CLS", cwv.cls.value, cwv.cls.rating],
      ] as const;

      autoTable(doc, {
        startY: y,
        head: [["Metric", "Value", "Rating"]],
        body: vitals.map(([m, v, r]) => [m, v, r.charAt(0).toUpperCase() + r.slice(1).replace("-", " ")]),
        margin: { left: 14, right: 14 },
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: COLORS.cyan, textColor: COLORS.white, fontStyle: "bold" },
        didParseCell(data) {
          if (data.section === "body" && data.column.index === 2) {
            const val = String(data.cell.raw).toLowerCase();
            if (val === "good") data.cell.styles.textColor = COLORS.primary;
            else if (val.includes("needs")) data.cell.styles.textColor = COLORS.amber;
            else if (val === "poor") data.cell.styles.textColor = COLORS.red;
          }
        },
      });
      y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 6;

      // Additional metrics
      y = ensureSpace(doc, y, 20);
      y = addKeyValue(doc, y, "TTFB", `${result.data.metrics.ttfb}ms`);
      y = addKeyValue(doc, y, "DOM Ready", `${result.data.metrics.domContentLoaded}ms`);
      y = addKeyValue(doc, y, "Full Load", `${result.data.metrics.loadTime}ms`);
      y = addKeyValue(doc, y, "Page Size", `${(result.data.metrics.totalSize / 1024).toFixed(0)} KB`);
      y += 4;

      // Opportunities
      if (result.data.opportunities.length > 0) {
        y = ensureSpace(doc, y, 20);
        autoTable(doc, {
          startY: y,
          head: [["Opportunity", "Savings", "Impact"]],
          body: result.data.opportunities.map((o) => [o.title, o.savings, o.impact]),
          margin: { left: 14, right: 14 },
          styles: { fontSize: 7, cellPadding: 2, overflow: "linebreak" },
          headStyles: { fillColor: COLORS.cyan, textColor: COLORS.white, fontStyle: "bold" },
          didParseCell(data) {
            if (data.section === "body" && data.column.index === 2) {
              const val = String(data.cell.raw).toLowerCase();
              if (val === "high") data.cell.styles.textColor = COLORS.red;
              else if (val === "medium") data.cell.styles.textColor = COLORS.amber;
            }
          },
        });
        y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
      }
    }
  }

  // ── SEO Section ────────────────────────────────────────────
  if (scope === "seo" && seoData && seoData.length > 0) {
    y = ensureSpace(doc, y, 50);
    y = addPageHeader(doc, y, "SEO Audit", COLORS.orange);

    for (const result of seoData) {
      y = ensureSpace(doc, y, 40);
      y = addSectionTitle(doc, y, `Device: ${result.device.name} (${result.device.width}×${result.device.height})`);
      y = addKeyValue(doc, y, "Score", `${result.data.score}/100`, scoreColor(result.data.score));
      y = addKeyValue(doc, y, "Title", result.data.title.value?.slice(0, 60) || "Missing");
      y = addKeyValue(doc, y, "Meta Desc.", result.data.metaDescription.value?.slice(0, 60) || "Missing");
      y = addKeyValue(doc, y, "Canonical", result.data.canonical.url || "Not set");
      y = addKeyValue(doc, y, "Language", result.data.language.value || "Missing");
      y += 2;

      // Quick stats
      y = ensureSpace(doc, y, 16);
      y = addKeyValue(doc, y, "Headings", `H1: ${result.data.headings.h1Count} | Total: ${result.data.headings.headings.length}`);
      y = addKeyValue(doc, y, "Links", `Internal: ${result.data.links.internal} | External: ${result.data.links.external}`);
      y = addKeyValue(doc, y, "Images", `Total: ${result.data.images.total} | Missing alt: ${result.data.images.withoutAlt}`, result.data.images.withoutAlt > 0 ? COLORS.amber : undefined);
      y = addKeyValue(doc, y, "Open Graph", `${5 - result.data.openGraph.missing.length}/5 set`);
      y = addKeyValue(doc, y, "Structured Data", result.data.structuredData.hasJsonLd ? `${result.data.structuredData.count} block(s)` : "None");
      y += 4;

      // Issues table
      const nonPassIssues = result.data.issues.filter((i) => i.severity !== "pass");
      if (nonPassIssues.length > 0) {
        y = ensureSpace(doc, y, 20);
        autoTable(doc, {
          startY: y,
          head: [["Severity", "Issue", "Category"]],
          body: nonPassIssues.map((issue) => [
            issue.severity.charAt(0).toUpperCase() + issue.severity.slice(1),
            issue.title,
            issue.category,
          ]),
          margin: { left: 14, right: 14 },
          styles: { fontSize: 7, cellPadding: 2, overflow: "linebreak" },
          headStyles: { fillColor: COLORS.orange, textColor: COLORS.white, fontStyle: "bold" },
          didParseCell(data) {
            if (data.section === "body" && data.column.index === 0) {
              const val = String(data.cell.raw).toLowerCase();
              if (val === "critical") data.cell.styles.textColor = COLORS.red;
              else if (val === "warning") data.cell.styles.textColor = COLORS.amber;
            }
          },
        });
        y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
      }
    }
  }

  // ── Footer on each page ────────────────────────────────────
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(...COLORS.muted);
    doc.setFont("helvetica", "normal");
    doc.text(`Scanora Report · ${url} · Page ${i}/${totalPages}`, pageWidth / 2, 290, { align: "center" });
  }

  // ── Download ───────────────────────────────────────────────
  const hostname = (() => {
    try { return new URL(url).hostname; } catch { return "site"; }
  })();
  doc.save(`Scanora-report-${hostname}-${Date.now()}.pdf`);
}
