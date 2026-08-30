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
