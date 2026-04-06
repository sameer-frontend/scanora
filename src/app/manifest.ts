import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Scanora — Website Audit Tool",
    short_name: "Scanora",
    description:
      "Free website audit tool for accessibility, performance, and SEO analysis.",
    start_url: "/dashboard/accessibility",
    display: "standalone",
    background_color: "#0a0e1a",
    theme_color: "#10b981",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
