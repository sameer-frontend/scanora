# Scanora

Free website audit tool. Scan any URL for **WCAG 2.2 accessibility** issues, measure **Core Web Vitals** performance, and analyze **SEO** — all from one dashboard. Powered by Playwright, axe-core & Lighthouse scoring.

## Features

- **Accessibility Auditor** — WCAG 2.2 AA scanning via axe-core with 4 severity levels (critical → minor), code-level fix suggestions, and WCAG principle breakdown
- **Performance Optimizer** — Core Web Vitals (LCP, FCP, TBT, CLS, TTFB) using Lighthouse v10 scoring, asset breakdown by category, and optimization opportunities
- **SEO Auditor** — Meta tags, heading hierarchy, Open Graph & Twitter Card validation, JSON-LD structured data detection, link & image analysis
- **Multi-Device Testing** — Every audit runs across 4 viewports: Mobile (375×812), Tablet (768×1024), Laptop (1366×768), Desktop (1920×1080)
- **Screenshots** — Full-page screenshots captured per device during each scan
- **PDF Export** — Client-side report generation scoped per audit category
- **100% Free** — No accounts, no paywalls, no tracking cookies

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 (App Router, Turbopack) |
| UI | React 19, Tailwind CSS 4, Radix UI, Framer Motion |
| Charts | Recharts |
| Icons | Lucide React |
| Browser Automation | Playwright Core + @sparticuz/chromium-min (serverless) |
| Accessibility Engine | @axe-core/playwright |
| PDF Generation | jsPDF + jspdf-autotable |
| Deployment | Vercel (serverless functions, 2048 MB, 300s timeout) |

## Getting Started

### Prerequisites

- Node.js 18+
- npm, yarn, pnpm, or bun

### Installation

```bash
git clone <repo-url>
cd scanora
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

### Build

```bash
npm run build
npm start
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_SITE_URL` | Site base URL | `https://scanora.dev` |

## Project Structure

```
src/
├── app/
│   ├── layout.tsx                  # Root layout, metadata, fonts
│   ├── page.tsx                    # Landing page with JSON-LD
│   ├── opengraph-image.tsx         # Dynamic OG image generation
│   ├── icon.tsx                    # Dynamic favicon generation
│   ├── apple-icon.tsx              # Apple touch icon
│   ├── sitemap.ts                  # Dynamic sitemap
│   ├── robots.ts                   # Robots.txt
│   ├── manifest.ts                 # PWA manifest
│   ├── (dashboard)/
│   │   ├── layout.tsx              # Dashboard shell with sidebar
│   │   └── dashboard/
│   │       ├── accessibility/      # Accessibility audit page
│   │       ├── performance/        # Performance audit page
│   │       ├── seo/                # SEO audit page
│   │       ├── reports/            # Reports page
│   │       └── settings/           # Settings page
│   ├── api/analyze/
│   │   ├── accessibility/route.ts  # axe-core WCAG scanning
│   │   ├── performance/route.ts    # Core Web Vitals measurement
│   │   └── seo/route.ts           # SEO data extraction
│   ├── docs/                       # Documentation
│   ├── privacy-policy/             # Privacy Policy
│   └── terms/                      # Terms & Conditions
├── components/
│   ├── landing-page.tsx            # Landing page UI
│   ├── back-button.tsx             # Client-side back navigation
│   ├── dashboard/                  # Dashboard components
│   │   ├── sidebar.tsx
│   │   ├── scan-form.tsx
│   │   ├── scan-states.tsx
│   │   ├── score-ring.tsx
│   │   ├── device-tabs.tsx
│   │   ├── screenshot-card.tsx
│   │   ├── cross-device-comparison.tsx
│   │   └── mini-chart.tsx
│   └── ui/                         # Radix-based primitives
├── lib/
│   ├── types.ts                    # TypeScript interfaces
│   ├── scan-context.tsx            # Scan state management
│   ├── browser-helpers.ts          # Playwright stealth helpers
│   ├── export-pdf.ts              # PDF report generation
│   ├── constants.ts                # Animation variants & styles
│   └── utils.ts                    # Utilities
```

## API Routes

All routes accept `POST` with `{ url: string }` and scan across 4 device viewports.

| Endpoint | Description |
|----------|-------------|
| `/api/analyze/accessibility` | Runs axe-core WCAG 2.2 AA audit, returns violations by severity with fix suggestions |
| `/api/analyze/performance` | Measures Core Web Vitals with Lighthouse v10 scoring, asset breakdown, opportunities |
| `/api/analyze/seo` | Extracts meta tags, headings, OG/Twitter cards, structured data, link & image analysis |

## Deploy

Deploy to Vercel with zero configuration:



The `vercel.json` configures serverless functions with 2048 MB memory and 300s max duration for browser automation.

## License

All rights reserved.
