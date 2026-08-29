import { addCents, cents, subtractCents, taxAmount, type Cents } from "@/lib/money";

/**
 * Quote money math (issue #12) — all integer cents, no floating point.
 * Benchmark D4: the total is built from explicit line items.
 */

export interface QuoteLineInput {
  concept: string;
  amountCents: number;
  included: boolean; // false = shown but NOT charged / not included
  kind?: string;
}

export interface QuoteTotals {
  subtotalCents: Cents;
  taxCents: Cents;
  totalCents: Cents;
}

/** Sum the CHARGED lines, apply IVA in basis points, return the three amounts. */
export function computeTotals(lines: QuoteLineInput[], taxRateBps: number): QuoteTotals {
  const charged = lines.filter((l) => l.included).map((l) => cents(l.amountCents));
  const subtotal = charged.length ? addCents(...charged) : cents(0);
  const tax = taxAmount(subtotal, taxRateBps);
  const total = addCents(subtotal, tax);
  return { subtotalCents: subtotal, taxCents: tax, totalCents: total };
}

export interface QuoteCompleteness {
  complete: boolean;
  missing: string[];
}

/**
 * A quote cannot be SENT while required D4 information is missing
 * (issue #12: "No se puede enviar un presupuesto incompleto").
 */
export function checkComplete(input: {
  workDescription?: string | null;
  lines: QuoteLineInput[];
  warrantyText?: string | null;
  warrantyResponsible?: string | null;
  scheduledFor?: Date | null;
  estimatedTimeframe?: string | null;
  professionalRef?: string | null;
  validUntil?: Date | null;
  isEstimate: boolean;
  maxTotalCents?: number | null;
}): QuoteCompleteness {
  const missing: string[] = [];
  if (!input.workDescription?.trim()) missing.push("Descripción de los trabajos");
  if (input.lines.filter((l) => l.included).length === 0)
    missing.push("Al menos una línea con importe");
  if (!input.warrantyText?.trim()) missing.push("Garantía aplicable");
  if (!input.warrantyResponsible?.trim()) missing.push("Responsable de la garantía");
  if (!input.scheduledFor && !input.estimatedTimeframe?.trim())
    missing.push("Fecha/franja o plazo estimado");
  if (!input.professionalRef?.trim()) missing.push("Profesional asignado o referencia");
  if (!input.validUntil) missing.push("Validez de la oferta");
  if (input.isEstimate && (input.maxTotalCents ?? 0) <= 0)
    missing.push("Total máximo (al ser una estimación)");
  return { complete: missing.length === 0, missing };
}

/** Never send "precio cerrado" wording when variables are open (D4). */
export function priceLabel(isEstimate: boolean): string {
  return isEstimate ? "Estimación (no es precio cerrado)" : "Precio cerrado";
}

export function nonIncludedLines(lines: QuoteLineInput[]): QuoteLineInput[] {
  return lines.filter((l) => !l.included);
}

export { subtractCents };
