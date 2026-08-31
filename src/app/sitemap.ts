import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/seo";
import { SERVICE_TRADES } from "@/config/service-content";
import { PROBLEM_SLUGS } from "@/config/problems";
import { contentService } from "@/server/services/content";
import { localPageService } from "@/server/services/localPage";

/**
 * sitemap.xml (issue #18). Only real, indexable pages — no per-municipality
 * duplication (D10). Service pages come from the trades that actually have
 * editorial content.
 *
 * Rendered per-request: published guides (issue #24) and indexable municipio
 * pages (issue #25) are admin-controlled, so the sitemap must reflect the
 * database without a rebuild.
 */
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    { url: siteUrl("/"), lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: siteUrl("/solicitar"), lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: siteUrl("/servicios"), lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: siteUrl("/problemas"), lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: siteUrl("/zonas"), lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: siteUrl("/cobertura"), lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: siteUrl("/confianza"), lastModified: now, changeFrequency: "yearly", priority: 0.6 },
    { url: siteUrl("/trabaja-con-nosotros"), lastModified: now, changeFrequency: "yearly", priority: 0.4 },
    // Legal pages are provisional and noindex (issue #17) — deliberately not listed.
  ];

  const servicePages: MetadataRoute.Sitemap = SERVICE_TRADES.map((t) => ({
    url: siteUrl(`/servicios/${t.key}`),
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  // Curated problem pages (issue #25) — every one is real, hand-written content.
  const problemPages: MetadataRoute.Sitemap = PROBLEM_SLUGS.map((slug) => ({
    url: siteUrl(`/problemas/${slug}`),
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  // Municipio pages (issue #25) — ONLY the ones that pass the D10 indexability
  // guard (covered municipality + a real coverage note + ≥2 differentiating
  // signals + published + not noindex).
  let zonePages: MetadataRoute.Sitemap = [];
  try {
    const indexable = await localPageService.listIndexable();
    zonePages = indexable.map((z) => ({
      url: siteUrl(`/zonas/${z.slug}`),
      lastModified: z.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    }));
  } catch {
    // DB unavailable at build time — the static pages still ship.
  }

  // Published editorial content (issue #24) — updates automatically.
  let guides: MetadataRoute.Sitemap = [];
  try {
    const published = await contentService.publishedSlugs();
    guides = [
      { url: siteUrl("/guias"), lastModified: now, changeFrequency: "weekly", priority: 0.6 },
      ...published.map((g) => ({
        url: siteUrl(`/guias/${g.slug}`),
        lastModified: g.updatedAt,
        changeFrequency: "monthly" as const,
        priority: 0.7,
      })),
    ];
  } catch {
    // DB unavailable at build time — the static pages still ship.
  }

  return [...staticPages, ...servicePages, ...problemPages, ...zonePages, ...guides];
}
