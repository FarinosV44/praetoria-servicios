import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/seo";
import { SERVICE_TRADES } from "@/config/service-content";

/**
 * sitemap.xml (issue #18). Only real, indexable pages — no per-municipality
 * duplication (D10). Service pages come from the trades that actually have
 * editorial content.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    { url: siteUrl("/"), lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: siteUrl("/solicitar"), lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: siteUrl("/servicios"), lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: siteUrl("/cobertura"), lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: siteUrl("/confianza"), lastModified: now, changeFrequency: "yearly", priority: 0.6 },
    // Legal pages are provisional and noindex (issue #17) — deliberately not listed.
  ];

  const servicePages: MetadataRoute.Sitemap = SERVICE_TRADES.map((t) => ({
    url: siteUrl(`/servicios/${t.key}`),
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  return [...staticPages, ...servicePages];
}
