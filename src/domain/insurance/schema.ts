import { z } from "zod";

/**
 * Insurance policy domain (issue #14) — pure types shared by the service and
 * tests. Coverage analysis and the legal draft are issue #15.
 */

export const DOC_KINDS = ["condiciones_particulares", "condiciones_generales", "otro"] as const;
export type DocKind = (typeof DOC_KINDS)[number];

export const DOC_KIND_LABEL: Record<DocKind, string> = {
  condiciones_particulares: "Condiciones particulares",
  condiciones_generales: "Condiciones generales",
  otro: "Otro documento",
};

export function isDocKind(v: string): v is DocKind {
  return (DOC_KINDS as readonly string[]).includes(v);
}

/** A reference back to the source: which document, which page. */
export const pageRefSchema = z.object({
  doc: z.string(), // the InsuranceDocument id or label
  page: z.number().int().positive(),
});
export type PageRef = z.infer<typeof pageRefSchema>;

const referencedItem = z.object({
  text: z.string().min(1),
  ref: pageRefSchema.nullable(),
});
export type ReferencedItem = z.infer<typeof referencedItem>;

/**
 * The tentative extraction (issue #14). Every field is optional — a real policy
 * PDF may not yield all of them, and a partial result is presented as partial.
 */
export const policyExtractionSchema = z.object({
  insurerName: z.string().nullable(),
  policyNumber: z.string().nullable(),
  validFrom: z.string().nullable(), // ISO date or null
  validTo: z.string().nullable(),
  coverages: z.array(referencedItem),
  limits: z.array(referencedItem),
  franchises: z.array(referencedItem),
  exclusions: z.array(referencedItem),
  /** free-text notes the parser could not classify */
  notes: z.array(referencedItem),
});
export type PolicyExtraction = z.infer<typeof policyExtractionSchema>;

export const EMPTY_EXTRACTION: PolicyExtraction = {
  insurerName: null,
  policyNumber: null,
  validFrom: null,
  validTo: null,
  coverages: [],
  limits: [],
  franchises: [],
  exclusions: [],
  notes: [],
};

export type ExtractionStatus = "PENDING" | "PARTIAL" | "DONE" | "UNREADABLE";

/**
 * Decide the case status from the extraction and whether OCR could read anything.
 * - UNREADABLE: nothing could be read from any document
 * - DONE: the core identity (insurer + policy number + validity) plus at least
 *   one coverage were extracted
 * - PARTIAL: something was read but the core is incomplete
 * - PENDING: no documents analysed yet
 */
export function extractionStatusFor(
  extraction: PolicyExtraction,
  opts: { anyDocuments: boolean; anyReadable: boolean },
): ExtractionStatus {
  if (!opts.anyDocuments) return "PENDING";
  if (!opts.anyReadable) return "UNREADABLE";
  const coreComplete =
    !!extraction.insurerName &&
    !!extraction.policyNumber &&
    !!extraction.validFrom &&
    !!extraction.validTo;
  if (coreComplete && extraction.coverages.length > 0) return "DONE";
  return "PARTIAL";
}

/** Which of the helpful document kinds seem to be missing. */
export function missingDocKinds(present: DocKind[]): DocKind[] {
  const set = new Set(present);
  return (["condiciones_particulares", "condiciones_generales"] as DocKind[]).filter(
    (k) => !set.has(k),
  );
}

/** Human list of what is still needed, for the "parece que falta" message. */
export function missingSummary(present: DocKind[], extraction: PolicyExtraction): string[] {
  const out: string[] = [];
  for (const k of missingDocKinds(present)) out.push(`Falta el documento: ${DOC_KIND_LABEL[k]}`);
  if (!extraction.insurerName) out.push("No hemos identificado la aseguradora");
  if (!extraction.policyNumber) out.push("No hemos identificado el número de póliza");
  if (!extraction.validFrom || !extraction.validTo) out.push("No hemos identificado la vigencia");
  if (extraction.coverages.length === 0) out.push("No hemos identificado las garantías contratadas");
  return out;
}
