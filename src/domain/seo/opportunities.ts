/**
 * SEO opportunity detection (issue #27) — pure functions over imported metric
 * rows and the local `Article` set. Every result is tagged `kind`:
 *   real           — a stored measurement
 *   estimate       — a value we derived (e.g. expected CTR at a position)
 *   recommendation — an action the panel proposes
 * The panel NEVER claims a change caused a ranking move (AC-27-nocausality).
 */

/** The subset of a metric row the opportunity detectors read. */
export interface MetricRow {
  query: string;
  page: string | null;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export type SignalKind = "real" | "estimate" | "recommendation";

export interface Opportunity {
  kind: SignalKind;
  query: string;
  page: string | null;
  metric: string;
  detail: string;
  action: string;
}

/** Rough expected CTR by rounded position — an ESTIMATE, stated as such. */
export function expectedCtrAt(position: number): number {
  const table = [0, 0.28, 0.15, 0.1, 0.07, 0.05, 0.04, 0.03, 0.025, 0.02, 0.018];
  const p = Math.max(1, Math.round(position));
  return p <= 10 ? table[p] : 0.01;
}

/** Impressions above the floor, CTR well below what the position would predict. */
export function lowCtrQueries(rows: MetricRow[], opts: { minImpressions?: number } = {}): Opportunity[] {
  const floor = opts.minImpressions ?? 100;
  return rows
    .filter((r) => r.impressions >= floor && r.position > 0 && r.position <= 10)
    .filter((r) => r.ctr < expectedCtrAt(r.position) * 0.6)
    .sort((a, b) => b.impressions - a.impressions)
    .map((r) => ({
      kind: "recommendation" as const,
      query: r.query,
      page: r.page,
      metric: "CTR bajo para la posición",
      detail: `CTR ${(r.ctr * 100).toFixed(1)}% con posición ${r.position.toFixed(1)} y ${r.impressions} impresiones (esperado ≈ ${(expectedCtrAt(r.position) * 100).toFixed(1)}%).`,
      action: "Revisar el title y la meta description de la página de destino para esta intención.",
    }));
}

/** Position 4–20 with real impressions — a nudge could move them onto page 1. */
export function strikingDistanceQueries(rows: MetricRow[], opts: { minImpressions?: number } = {}): Opportunity[] {
  const floor = opts.minImpressions ?? 20;
  return rows
    .filter((r) => r.position >= 4 && r.position <= 20 && r.impressions >= floor)
    .sort((a, b) => a.position - b.position)
    .map((r) => ({
      kind: "recommendation" as const,
      query: r.query,
      page: r.page,
      metric: "A distancia de la primera página",
      detail: `Posición ${r.position.toFixed(1)}, ${r.impressions} impresiones, ${r.clicks} clics.`,
      action: "Ampliar o precisar el contenido para esta consulta; añadir enlaces internos relevantes.",
    }));
}

export interface ArticleForSeo {
  slug: string;
  title: string;
  targetKeywords: string[];
  status: string;
  updatedAt: Date;
  internalLinkCount: number;
}

/** PUBLICADO articles not touched in `months` months. */
export function staleContent(
  articles: ArticleForSeo[],
  now: Date,
  opts: { months?: number } = {},
): Opportunity[] {
  const months = opts.months ?? 9;
  const cutoff = new Date(now.getTime() - months * 30 * 86_400_000);
  return articles
    .filter((a) => a.status === "PUBLICADO" && a.updatedAt < cutoff)
    .sort((a, b) => a.updatedAt.getTime() - b.updatedAt.getTime())
    .map((a) => ({
      kind: "recommendation" as const,
      query: a.title,
      page: `/guias/${a.slug}`,
      metric: "Contenido sin actualizar",
      detail: `Última actualización ${a.updatedAt.toISOString().slice(0, 10)}.`,
      action: "Revisar datos, ejemplos y precios; actualizar la fecha si sigue vigente.",
    }));
}

const tokenSet = (s: string) =>
  new Set(
    s
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .split(/[^a-z0-9]+/)
      .filter((t) => t.length > 3),
  );

function overlap(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let i = 0;
  for (const t of a) if (b.has(t)) i++;
  return i / Math.min(a.size, b.size);
}

/** Article pairs likely competing for the same intent. */
export function intentCannibalization(articles: ArticleForSeo[]): Opportunity[] {
  const pubs = articles.filter((a) => a.status === "PUBLICADO");
  const out: Opportunity[] = [];
  for (let i = 0; i < pubs.length; i++) {
    for (let j = i + 1; j < pubs.length; j++) {
      const a = pubs[i];
      const b = pubs[j];
      const sim =
        overlap(tokenSet(`${a.title} ${a.targetKeywords.join(" ")}`), tokenSet(`${b.title} ${b.targetKeywords.join(" ")}`));
      if (sim >= 0.6) {
        out.push({
          kind: "recommendation",
          query: `${a.title} ⇄ ${b.title}`,
          page: `/guias/${a.slug}`,
          metric: "Posible canibalización",
          detail: `Solapamiento de intención ≈ ${(sim * 100).toFixed(0)}% con /guias/${b.slug}.`,
          action: "Diferenciar el enfoque de cada página o fusionarlas con una redirección 301.",
        });
      }
    }
  }
  return out;
}
