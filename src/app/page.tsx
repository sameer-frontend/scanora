import LandingPage from "@/components/landing-page";

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      name: "Scanora",
      url: process.env.NEXT_PUBLIC_SITE_URL || "https://scanora.dev",
      description:
        "Free online website audit tool for accessibility, performance, and SEO analysis.",
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: `${process.env.NEXT_PUBLIC_SITE_URL || "https://scanora.dev"}/dashboard/accessibility`,
        },
        "query-input": "required name=search_term_string",
      },
    },
    {
      "@type": "SoftwareApplication",
      name: "Scanora",
      applicationCategory: "DeveloperApplication",
      operatingSystem: "Web",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
      },
      description:
        "Scan websites for WCAG 2.2 accessibility issues, measure Core Web Vitals performance with Lighthouse, and analyze SEO — all from one dashboard.",
      featureList: [
        "WCAG 2.2 AA accessibility audit via axe-core",
        "Lighthouse v10 performance scoring",
        "SEO analysis with Open Graph and structured data checks",
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
