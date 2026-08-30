import {
  EMPTY_EXTRACTION,
  type PageRef,
  type PolicyExtraction,
  type ReferencedItem,
} from "./schema";

/**
 * Tentative extraction of policy fields from OCR/text-layer output (issue #14).
 * Pure and deterministic. Every value keeps a page reference
 * ("La extracción conserva referencias de página"). This is intentionally
 * conservative — it under-claims rather than guessing, and whatever it misses
 * is surfaced to the client as "parece que falta".
 */

export type ExtractDoc = {
  /** the InsuranceDocument id (or a label in tests) */
  docId: string;
  pages: { page: number; text: string }[];
};

const KNOWN_INSURERS = [
  "MAPFRE",
  "AXA",
  "ALLIANZ",
  "GENERALI",
  "ZURICH",
  "MUTUA MADRILEÑA",
  "LÍNEA DIRECTA",
  "LINEA DIRECTA",
  "REALE",
  "PELAYO",
  "CASER",
  "SANTALUCÍA",
  "SANTALUCIA",
  "OCASO",
  "CATALANA OCCIDENTE",
  "HELVETIA",
  "PLUS ULTRA",
  "VERTI",
  "DIRECT SEGUROS",
];

function toIso(dmy: string): string | null {
  const m = dmy.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return null;
  const [, d, mo, y] = m;
  const iso = `${y}-${mo}-${d}`;
  return Number.isNaN(Date.parse(iso)) ? null : iso;
}

function splitItems(s: string): string[] {
  return s
    .split(/[,;.]\s+|\s+y\s+/i)
    .map((x) => x.trim().replace(/\.$/, ""))
    .filter((x) => x.length > 1 && x.length < 200);
}

export function extractPolicyFields(docs: ExtractDoc[]): PolicyExtraction {
  const out: PolicyExtraction = {
    ...EMPTY_EXTRACTION,
    coverages: [],
    limits: [],
    franchises: [],
    exclusions: [],
    notes: [],
  };

  const push = (arr: ReferencedItem[], text: string, ref: PageRef) => {
    if (!arr.some((i) => i.text.toLowerCase() === text.toLowerCase())) arr.push({ text, ref });
  };

  for (const doc of docs) {
    for (const { page, text } of doc.pages) {
      const ref: PageRef = { doc: doc.docId, page };
      const flat = text.replace(/\s+/g, " ");

      if (!out.insurerName) {
        const hit = KNOWN_INSURERS.find((n) => flat.toUpperCase().includes(n));
        if (hit) out.insurerName = hit.replace(/\b\w/g, (c) => c.toUpperCase());
        else {
          const m = flat.match(
            /(?:aseguradora|compañía|compania|entidad aseguradora)\s*[:\-]?\s*([A-ZÁÉÍÓÚÑ][\w .&-]{2,40})/i,
          );
          if (m) out.insurerName = m[1].trim();
        }
      }

      if (!out.policyNumber) {
        const m = flat.match(
          /(?:p[óo]liza|n[ºo.]\s*de\s*p[óo]liza|nº\s*p[óo]liza)\s*(?:n[ºo.]*)?\s*[:\s]*([A-Z]?\d[\w-]{3,})/i,
        );
        if (m) out.policyNumber = m[1].trim();
      }

      if (!out.validFrom || !out.validTo) {
        const m = flat.match(
          /vigencia\s*[:\-]?\s*(?:de\s*)?(\d{2}\/\d{2}\/\d{4})\s*(?:a|hasta|-|al)\s*(\d{2}\/\d{2}\/\d{4})/i,
        );
        if (m) {
          out.validFrom = toIso(m[1]);
          out.validTo = toIso(m[2]);
        }
      }

      const cov = flat.match(
        /(?:garant[íi]as contratadas|coberturas contratadas|garant[íi]as|coberturas)\s*[:\-]\s*([^.]+?)(?:\.|Franquicia|Exclusiones|$)/i,
      );
      if (cov) for (const it of splitItems(cov[1])) push(out.coverages, it, ref);

      const exc = flat.match(/exclusiones\s*[:\-]\s*([^.]+?)(?:\.\s+[A-ZÁÉÍÓÚ]|$)/i);
      if (exc) for (const it of splitItems(exc[1])) push(out.exclusions, it, ref);

      for (const fm of flat.matchAll(
        /franquicia[^:.]*[:\s]+([^.\n]*?\d[\d.,]*\s*(?:EUR|€|euros)[^.\n]*)/gi,
      )) {
        push(out.franchises, fm[1].trim(), ref);
      }

      for (const lm of flat.matchAll(
        /(?:l[íi]mite|capital asegurado|suma asegurada)[^:.]*[:\s]+([^.\n]*?\d[\d.,]*\s*(?:EUR|€|euros)[^.\n]*)/gi,
      )) {
        push(out.limits, lm[1].trim(), ref);
      }
    }
  }

  return out;
}
