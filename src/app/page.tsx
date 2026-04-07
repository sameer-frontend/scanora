import LandingPage from "@/components/landing-page";

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      name: "AuditWave",
      url: process.env.NEXT_PUBLIC_SITE_URL || "https://auditwave.dev",
      description:
        "Free online website audit tool for accessibility, performance, and SEO analysis.",
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: `${process.env.NEXT_PUBLIC_SITE_URL || "https://auditwave.dev"}/dashboard/accessibility`,
        },
        "query-input": "required name=search_term_string",
      },
    },
    {
      "@type": "SoftwareApplication",
      name: "AuditWave",
      applicationCategory: "DeveloperApplication",
      operatingSystem: "Web",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
      },
      description:
        "All-in-one website audit tool: accessibility, performance, SEO, bundle analysis, Next.js insights, and A/B comparison — all from one dashboard.",
      featureList: [
        "WCAG 2.2 AA accessibility audit via axe-core",
        "Lighthouse v10 performance scoring with Core Web Vitals",
        "SEO analysis with Open Graph, structured data, and keyword density",
        "Bundle & technology stack detection with code coverage",
        "Next.js-specific optimization insights",
        "A/B performance comparison between two URLs",
        "Multi-device testing (mobile, tablet, laptop, desktop)",
        "PDF report export",
      ],
    },
  ],
};

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <LandingPage />
    </>
  );
}
