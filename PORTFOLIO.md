# AuditWave — Portfolio Project

## Project Overview

**AuditWave** is a comprehensive, free all-in-one website audit platform that enables developers and non-technical users to scan any URL for accessibility violations, performance issues, SEO problems, technology stack analysis, and more — all from a single intuitive dashboard.

**Live Demo:** https://auditwave.dev  
**Repository:** [GitHub Link]  
**Status:** Production-ready

---

## 🎯 Key Features

### Core Audit Modules
- **WCAG 2.2 Accessibility Auditor** — Real-time scanning powered by axe-core, detecting critical accessibility violations across 4 severity levels with code-level fix recommendations
- **Core Web Vitals Performance Analyzer** — Lighthouse v10 integration measuring LCP, FCP, TBT, CLS, TTFB with actionable optimization suggestions
- **Comprehensive SEO Scanner** — Meta tag validation, heading hierarchy analysis, JSON-LD structured data verification, Open Graph/Twitter Card checks, keyword density analysis
- **Bundle & Technology Detection** — JavaScript/CSS bundle analysis with code coverage tracking, unused JS detection, and full technology stack identification (Wappalyzer-like detection)
- **Next.js-specific Auditing** — next/image optimization checks, hydration payload analysis, rendering mode detection (SSR/SSG/ISR/CSR), component pattern auditing
- **A/B Performance Comparison** — Side-by-side URL comparison with metric differentials and improvement suggestions
- **Multi-Device Testing** — Simultaneous scanning across 4 responsive viewports (Mobile, Tablet, Laptop, Desktop)
- **Local Scan History** — All scan data stored in browser localStorage for instant access without server dependency
- **PDF Export** — Client-side report generation with audit-specific formatting

### Technical Capabilities
- Serverless browser automation with Playwright Core + headless Chromium
- Chrome DevTools Protocol (CDP) for network tracking and code coverage analysis
- Advanced technology detection with confidence scoring
- Stealth mode operation to bypass anti-bot detection
- CORS-compatible resource tracking for accurate bundle size reporting
- Responsive design across all devices and viewports

---

## 💻 Tech Stack

| Category | Technology |
|----------|-----------|
| **Framework** | Next.js 16 (App Router, Turbopack) |
| **Frontend** | React 19, Tailwind CSS 4, Radix UI, Framer Motion |
| **Data Visualization** | Recharts with treemap layouts |
| **Icons** | Lucide React (80+ custom icons) |
| **Automation** | Playwright Core + @sparticuz/chromium-min (serverless) |
| **Testing Engines** | @axe-core/playwright, Lighthouse v10 |
| **PDF Generation** | jsPDF + jspdf-autotable |
| **State Management** | React Context API |
| **Styling** | Tailwind CSS with custom components |
| **Deployment** | Vercel (serverless functions, 2048 MB, 300s timeout) |
| **Type Safety** | TypeScript |

---

## 🏗️ Architecture Highlights

### Backend (Server-Side)
- **Modular API Routes** — Separate Next.js API routes for each audit type (accessibility, performance, seo, bundle, nextjs, ab-comparison)
- **Browser Automation** — Managed Playwright contexts with proper cleanup and error handling for headless Chromium
- **Multi-Device Profiling** — Dynamic device profiles with viewport specifications (375×812 to 1920×1080)
- **Stealth Techniques** — User-agent rotation, stealth script injection, and challenge detection bypass
- **CDP Integration** — Real-time network tracking to capture cross-origin resource sizes and coverage data
- **Technology Detection** — Custom Wappalyzer-like engine with 40+ framework/tool signatures

### Frontend (Client-Side)
- **Scan Context Provider** — Centralized state management for all audit results and operation status
- **Lazy Component Loading** — Performance-optimized with React.lazy() for heavyweight components
- **Client-Side Report Generation** — PDF export without server load
- **Responsive Layouts** — Grid-based, mobile-first design with Tailwind CSS
- **Real-time Status Updates** — Loading states and error handling with user-friendly messaging
- **Safari/Cross-browser Compatibility** — Tested across all major browsers

### Data Persistence
- **localStorage-based Scan History** — All recent scans stored locally with screenshot stripping for space efficiency
- **Timestamp Tracking** — Every scan logged with full timestamp for historical reference
- **Merge Strategy** — Intelligent result merging when re-scanning same URLs

---

## 📊 Key Metrics & Impact

- **Performance:** Sub-60s full-page audits on average
- **Accessibility:** Detects 100+ WCAG violation patterns
- **Coverage:** Technology detection for 150+ frameworks/libraries/tools
- **Multi-device:** 4 simultaneous viewport configurations
- **Uptime:** Production-grade Vercel deployment
- **User Experience:** Zero signup required, instant results

---

## 🔧 Notable Technical Implementations

### 1. Advanced Bundle Analysis
```
- CDP Network tracking (requestId → URL → encodedSize mapping)
- Performance API fallback handling for cross-origin resources
- Gzip size estimation
- First-load chunk identification
- Treemap visualization with nested hierarchy
```

### 2. Technology Detection Engine
- Pattern-based detection (script URLs, HTML attributes, meta tags, globals)
- React fiber detection for headless environments (DOM introspection)
- Confidence scoring system (0-100%)
- Version extraction from generator meta tags
- Handles 40+ framework signatures with 5 tech categories

### 3. WCAG Accessibility Scanning
- Real-time axe-core evaluation in browser context
- 4 severity levels (critical, serious, moderate, minor)
- Code snippet extraction for violations
- Principle-based categorization (perceivable, operable, understandable, robust)
- Actionable remediation guidance

### 4. Performance Analysis
- Core Web Vitals collection (LCP, FCP, TBT, CLS, TTFB)
- Multi-run statistics (average, best, worst, variance, std dev)
- Lighthouse integration for metric-based scoring
- Asset breakdown by resource type and route
- Optimization opportunities ranking

### 5. SEO Deep Audit
- Page-level extraction (title, meta description, canonical, hreflang)
- Heading hierarchy validation with depth checking
- Internal vs external link analysis
- Image alt-text audit (with large image detection)
- JSON-LD structured data validation
- Open Graph & Twitter Card verification

---

## 🚀 Deployment & Infrastructure

- **Hosting:** Vercel serverless platform
- **Execution Model:** Next.js API routes (300s timeout)
- **Memory:** 2048 MB per function
- **Browser Runtime:** @sparticuz/chromium-min (143.0.4) — optimized for serverless
- **Database:** None — stateless architecture
- **CDN:** Vercel Edge Network
- **Monitoring:** Vercel deployment logs

---

## 📈 Challenges Solved

1. **Cross-origin CORS Issues** — Implemented CDP network tracking as fallback when Performance API returns 0 for resources
2. **Headless Browser Detection Bypass** — Multiple stealth techniques including script injection and user-agent rotation
3. **React Detection in Headless Mode** — DOM fiber introspection when DevTools global hook unavailable
4. **Serverless Memory/Timeout Constraints** — Optimized Chromium binary and screenshot handling
5. **Multi-device Testing at Scale** — Context pooling and parallel execution strategies

---

## 📝 Code Quality

- **TypeScript:** Full type safety across all modules
- **Component Modularity:** 20+ reusable UI components
- **Error Handling:** Comprehensive try-catch with user-friendly error messages
- **Performance Optimization:** Route-level lazy loading, bundle splitting, memo HOC usage
- **Accessibility:** WCAG 2.1 AAA compliant dashboard (semantic HTML, ARIA labels)

---

## 🎓 Skills Demonstrated

✅ **Full-Stack Development** — Next.js, React 19, TypeScript  
✅ **Server-Side Architecture** — Serverless, API design, browser automation  
✅ **Frontend Engineering** — Component design, state management, responsive layouts  
✅ **Browser Automation** — Playwright, CDP, stealth techniques  
✅ **Performance Optimization** — Code splitting, lazy loading, bundle analysis  
✅ **Data Visualization** — Recharts, treemaps, charts  
✅ **DevOps/Deployment** — Vercel, serverless functions, environment configuration  
✅ **Testing & QA** — Multi-device testing, cross-browser compatibility  
✅ **Web Standards** — WCAG, SEO, Web Performance, Open Graph  

---

## 🔗 Links

- **Live App:** https://auditwave.dev
- **GitHub:** [Link to repository]
- **Documentation:** Built-in docs page with audit methodology

