/**
 * Sitemap fetching & parsing utility.
 * Used by API routes in full-site mode to discover pages before falling back to link crawling.
 */

/** Parse a sitemap XML string and extract <loc> URLs */
function extractUrls(xml: string): string[] {
  const urls: string[] = [];
  const locRegex = /<loc>\s*(.*?)\s*<\/loc>/gi;
  let match: RegExpExecArray | null;
  while ((match = locRegex.exec(xml)) !== null) {
    const url = match[1].trim();
    if (url.startsWith("http")) urls.push(url);
  }
  return urls;
}

/** Check if a sitemap XML is a sitemap index (contains <sitemapindex>) */
function isSitemapIndex(xml: string): boolean {
  return /<sitemapindex[\s>]/i.test(xml);
}

/**
 * Fetch and parse the sitemap for a given origin.
 * Tries /sitemap.xml first, then /sitemap_index.xml.
 * If the sitemap is a sitemap index, recursively fetches child sitemaps.
 * Returns an array of page URLs, or an empty array if no sitemap exists.
 */
export async function fetchSitemapUrls(
  origin: string,
  signal?: AbortSignal
): Promise<string[]> {
  const candidates = [
    `${origin}/sitemap.xml`,
    `${origin}/sitemap_index.xml`,
  ];

  for (const sitemapUrl of candidates) {
    try {
      const res = await fetch(sitemapUrl, {
        signal,
        headers: { "User-Agent": "WebGuard-Scanner/1.0" },
      });
      if (!res.ok) continue;

      const contentType = res.headers.get("content-type") || "";
      const text = await res.text();

      // Basic sanity check — must look like XML
      if (!text.includes("<") || (!text.includes("<urlset") && !text.includes("<sitemapindex"))) {
        continue;
      }

      if (isSitemapIndex(text)) {
        // Extract child sitemap URLs and fetch each
        const childUrls = extractUrls(text);
        const allPageUrls: string[] = [];

        // Limit child sitemap fetches to avoid runaway requests
        const childSitemaps = childUrls.slice(0, 10);
        await Promise.all(
          childSitemaps.map(async (childUrl) => {
            try {
              const childRes = await fetch(childUrl, {
                signal,
                headers: { "User-Agent": "WebGuard-Scanner/1.0" },
              });
              if (!childRes.ok) return;
              const childText = await childRes.text();
              allPageUrls.push(...extractUrls(childText));
            } catch {
              /* skip failed child sitemaps */
            }
          })
        );

        if (allPageUrls.length > 0) {
          // Deduplicate and filter to same origin
          return [...new Set(allPageUrls)].filter((u) => u.startsWith(origin));
        }
      } else {
        const urls = extractUrls(text);
        if (urls.length > 0) {
          return [...new Set(urls)].filter((u) => u.startsWith(origin));
        }
      }
    } catch {
      /* sitemap not available, continue */
    }
  }

  return [];
}
