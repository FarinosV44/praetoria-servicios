/**
 * Local (municipio) page indexability rule — issue #25 / D10.
 *
 * A `/zonas/[municipio]` page is indexable ONLY when it carries real,
 * differentiating information: it is published, not flagged noindex, the
 * municipality is actually served, it has a genuine coverage note, AND it
 * carries at least two more concrete signals (typical services, a verifiable
 * response-time note, local FAQs, a completed-jobs note, or an authorised photo
 * note). Anything thinner stays noindex — no "trade + every municipality" pages.
 */

export type LocalPageStatus = "BORRADOR" | "PUBLICADO" | "ARCHIVADO";

export interface LocalPageForEligibility {
  status: LocalPageStatus;
  noindex: boolean;
  coverageNote: string;
  typicalServices: string[];
  responseTimeNote: string | null;
  localFaq: { q: string; a: string }[];
  completedJobsNote: string | null;
  casePhotoNote: string | null;
}

const MIN_SIGNALS = 2;

export function isLocalPageIndexable(
  page: LocalPageForEligibility,
  ctx: { coveredMunicipality: boolean },
): { indexable: boolean; reasons: string[] } {
  const reasons: string[] = [];

  if (page.status !== "PUBLICADO") reasons.push("La página no está publicada.");
  if (page.noindex) reasons.push("La página está marcada como noindex.");
  if (!ctx.coveredMunicipality) reasons.push("El municipio no está dentro de la cobertura.");
  if (!page.coverageNote.trim()) reasons.push("Falta una nota de cobertura real.");

  const signals =
    (page.typicalServices.length > 0 ? 1 : 0) +
    (page.responseTimeNote?.trim() ? 1 : 0) +
    (page.localFaq.length > 0 ? 1 : 0) +
    (page.completedJobsNote?.trim() ? 1 : 0) +
    (page.casePhotoNote?.trim() ? 1 : 0);

  if (signals < MIN_SIGNALS) {
    reasons.push(
      `Falta contenido específico: se necesitan al menos ${MIN_SIGNALS} señales diferenciadoras ` +
        `(servicios demandados, tiempos verificables, preguntas locales, trabajos realizados o fotos autorizadas).`,
    );
  }

  return { indexable: reasons.length === 0, reasons };
}
