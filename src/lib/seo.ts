import { env } from "./env";
import { COPY } from "@/config/copy";
import { COVERED_MUNICIPALITIES } from "@/config/coverage";
import type { Trade } from "@/config/trades";
import { serviceContentFor } from "@/config/service-content";

/**
 * SEO helpers (issue #18). Absolute URLs and JSON-LD builders, used by the
 * metadata route files (`sitemap.ts`, `robots.ts`, `manifest.ts`) and by the
 * server pages that embed structured data.
 *
 * D10 (functional spec): structured data describes only real, specific content —
 * no invented ratings, no fabricated review counts, no "trade + every
 * municipality" pages.
 */

const BASE = env.APP_URL.replace(/\/+$/, "");
const ORG_ID = `${BASE}/#organization`;
const WEBSITE_ID = `${BASE}/#website`;

/** Absolute URL for a site-relative path (`/servicios/fontaneria` → `https://…/servicios/fontaneria`). */
export function siteUrl(path = "/"): string {
  return path === "/" ? `${BASE}/` : `${BASE}${path.startsWith("/") ? path : `/${path}`}`;
}

export function organizationLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": ORG_ID,
    name: COPY.brand.name,
    url: `${BASE}/`,
    description:
      "Servicio gestionado que interpreta incidencias del hogar con fotos y lenguaje natural, " +
      "selecciona al profesional adecuado y prepara un presupuesto claro.",
    areaServed: COVERED_MUNICIPALITIES.map((name) => ({
      "@type": "City",
      name,
    })),
  };
}

export function websiteLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": WEBSITE_ID,
    url: `${BASE}/`,
    name: COPY.brand.name,
    inLanguage: "es-ES",
    publisher: { "@id": ORG_ID },
  };
}

/** `Service` node for one trade's page — built from real per-trade content. */
export function serviceLd(trade: Trade) {
  const content = serviceContentFor(trade.key);
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: `${trade.label} en Valencia y área metropolitana norte`,
    serviceType: trade.label,
    provider: { "@id": ORG_ID },
    areaServed: COVERED_MUNICIPALITIES.map((name) => ({ "@type": "City", name })),
    description: content.intro,
    url: siteUrl(`/servicios/${trade.key}`),
  };
}

/**
 * Merge real review data into a `Service` (or other) JSON-LD node (issue #26).
 * Call ONLY when `count > 0` — schema.org markup must match visible content and
 * we never emit an invented rating. `reviews` should already be the published,
 * consented set (redacted comments).
 */
export function withReviewData<T extends Record<string, unknown>>(
  node: T,
  data: {
    count: number;
    average: number | null;
    reviews: {
      rating: number;
      comment: string | null;
      author: string | null;
      datePublished: string | null;
    }[];
  },
): T {
  if (data.count < 1 || data.average === null) return node;
  return {
    ...node,
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: data.average,
      reviewCount: data.count,
      bestRating: 5,
      worstRating: 1,
    },
    review: data.reviews.slice(0, 10).map((r) => ({
      "@type": "Review",
      reviewRating: { "@type": "Rating", ratingValue: r.rating, bestRating: 5, worstRating: 1 },
      author: { "@type": "Person", name: r.author ?? "Cliente de Praetoria" },
      ...(r.comment ? { reviewBody: r.comment } : {}),
      ...(r.datePublished ? { datePublished: r.datePublished } : {}),
    })),
  };
}

export function breadcrumbLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: siteUrl(it.path),
    })),
  };
}

/**
 * `Article` node for an editorial page (issue #24). Only visible, real
 * information — no invented author schema, no fake ratings.
 */
export function articleLd(input: {
  title: string;
  description: string;
  slug: string;
  author: string | null;
  datePublished: string | null;
  dateModified: string | null;
  image: string | null;
}) {
  const node: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: input.title,
    description: input.description,
    url: siteUrl(`/guias/${input.slug}`),
    publisher: { "@id": ORG_ID },
    inLanguage: "es-ES",
  };
  if (input.author) node.author = { "@type": "Organization", name: input.author };
  if (input.datePublished) node.datePublished = input.datePublished;
  if (input.dateModified) node.dateModified = input.dateModified;
  if (input.image) node.image = input.image;
  return node;
}

/**
 * `Service` node for an indexable `/zonas/[municipio]` page (issue #25). Only
 * ever emitted when the page passes the D10 guard, so `areaServed` and
 * `description` describe a real, served municipality — never a synthetic combo.
 */
export function localAreaServiceLd(input: {
  municipality: string;
  slug: string;
  serviceLabel: string | null;
  description: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: input.serviceLabel
      ? `${input.serviceLabel} en ${input.municipality}`
      : `Servicios para el hogar en ${input.municipality}`,
    serviceType: input.serviceLabel ?? "Servicios para el hogar",
    provider: { "@id": ORG_ID },
    areaServed: { "@type": "City", name: input.municipality },
    description: input.description,
    url: siteUrl(`/zonas/${input.slug}`),
  };
}

export function faqPageLd(items: { q: string; a: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((it) => ({
      "@type": "Question",
      name: it.q,
      acceptedAnswer: { "@type": "Answer", text: it.a },
    })),
  };
}
