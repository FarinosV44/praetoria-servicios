/**
 * Internal-linking and coverage gaps (issue #27) — built from #25's data, no
 * import needed. Each gap is a recommendation with a concrete next step.
 */

export interface LinkingGap {
  kind: "recommendation";
  area: "problema" | "zona" | "guía" | "servicio";
  title: string;
  detail: string;
  action: string;
  href: string | null;
}

export interface GapInputs {
  /** curated problems: slug, title, trade */
  problems: { slug: string; title: string; trade: string }[];
  /** trade keys that have a /servicios/[slug] page */
  serviceTradeKeys: string[];
  /** admin-created local pages with their indexability verdict + reasons */
  localPages: { slug: string; municipality: string; indexable: boolean; reasons: string[]; status: string }[];
  /** published articles with an internal-link count */
  articles: { slug: string; title: string; internalLinkCount: number; status: string }[];
}

export function internalLinkingGaps(input: GapInputs): LinkingGap[] {
  const gaps: LinkingGap[] = [];

  // 1. A curated problem whose trade has no service page → the "quién lo resuelve"
  //    link on the problem page has nowhere strong to point.
  for (const p of input.problems) {
    if (!input.serviceTradeKeys.includes(p.trade)) {
      gaps.push({
        kind: "recommendation",
        area: "servicio",
        title: `Sin página de servicio para «${p.trade}»`,
        detail: `El problema «${p.title}» apunta al oficio ${p.trade}, que no tiene /servicios/${p.trade}.`,
        action: `Crear contenido de servicio para ${p.trade} en src/config/service-content.ts, o reasignar el problema.`,
        href: `/problemas/${p.slug}`,
      });
    }
  }

  // 2. A published zone page that does NOT pass the D10 indexability guard.
  for (const z of input.localPages) {
    if (z.status === "PUBLICADO" && !z.indexable) {
      gaps.push({
        kind: "recommendation",
        area: "zona",
        title: `Zona publicada pero no indexable: ${z.municipality}`,
        detail: z.reasons.join(" "),
        action: "Añadir el contenido específico que falta o despublicar la página hasta tenerlo.",
        href: `/zonas/${z.slug}`,
      });
    }
  }

  // 3. A published article with no internal links out.
  for (const a of input.articles) {
    if (a.status === "PUBLICADO" && a.internalLinkCount === 0) {
      gaps.push({
        kind: "recommendation",
        area: "guía",
        title: `Sin enlaces internos: ${a.title}`,
        detail: "La guía no enlaza a ningún servicio, problema o zona.",
        action: "Añadir 2–3 enlaces internos a páginas relacionadas.",
        href: `/guias/${a.slug}`,
      });
    }
  }

  return gaps;
}
