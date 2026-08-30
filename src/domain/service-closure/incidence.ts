/**
 * Post-service incidence lifecycle + SLA + warranty differentiation (issue #23).
 *
 * Rules from the issue, enforced here:
 *  - an incidence is never closed (RESUELTA / DESESTIMADA) without a reason AND evidence;
 *  - an internal first-response SLA exists, with no 24/7 promise;
 *  - the warranty is one of three kinds — legal, comercial, cortesía — never a
 *    uniform term.
 */

export const INCIDENCE_STATUSES = [
  "ABIERTA",
  "EN_CLASIFICACION",
  "EN_CURSO",
  "RESUELTA",
  "DESESTIMADA",
] as const;
export type IncidenceStatus = (typeof INCIDENCE_STATUSES)[number];

const TRANSITIONS: Record<IncidenceStatus, IncidenceStatus[]> = {
  ABIERTA: ["EN_CLASIFICACION", "DESESTIMADA"],
  EN_CLASIFICACION: ["EN_CURSO", "DESESTIMADA"],
  EN_CURSO: ["RESUELTA", "EN_CLASIFICACION", "DESESTIMADA"],
  RESUELTA: ["EN_CURSO"],
  DESESTIMADA: ["EN_CLASIFICACION"],
};

/** Reaching these requires a reason AND recorded evidence (issue #23 rule). */
const CLOSING: readonly IncidenceStatus[] = ["RESUELTA", "DESESTIMADA"];

export type IncidenceTransitionError =
  | { kind: "invalid_transition"; from: IncidenceStatus; to: IncidenceStatus }
  | { kind: "reason_required" }
  | { kind: "evidence_required" };

export function allowedNextIncidenceStatuses(from: IncidenceStatus): IncidenceStatus[] {
  return [...TRANSITIONS[from]];
}

export function validateIncidenceTransition(input: {
  from: IncidenceStatus;
  to: IncidenceStatus;
  reason?: string;
  hasEvidence?: boolean;
}): { ok: true } | { ok: false; error: IncidenceTransitionError } {
  const { from, to, reason, hasEvidence } = input;
  if (!TRANSITIONS[from]?.includes(to)) {
    return { ok: false, error: { kind: "invalid_transition", from, to } };
  }
  if (CLOSING.includes(to)) {
    if (!reason?.trim()) return { ok: false, error: { kind: "reason_required" } };
    if (!hasEvidence) return { ok: false, error: { kind: "evidence_required" } };
  }
  return { ok: true };
}

// ── SLA ─────────────────────────────────────────────────────────────────────

/**
 * Internal first-response target for an incidence. Deliberately in hours, not a
 * "24/7" promise. Configurable via `src/config/service-closure.ts`; the default
 * here keeps the domain testable without importing config.
 */
export const SLA_FIRST_RESPONSE_HOURS = 24;

export function firstResponseDueAt(openedAt: Date, hours = SLA_FIRST_RESPONSE_HOURS): Date {
  return new Date(openedAt.getTime() + hours * 3600_000);
}

export function isOverdue(dueAt: Date, now: Date = new Date()): boolean {
  return now.getTime() > dueAt.getTime();
}

// ── Warranty ────────────────────────────────────────────────────────────────

export const WARRANTY_KINDS = ["LEGAL", "COMERCIAL", "CORTESIA"] as const;
export type WarrantyKind = (typeof WARRANTY_KINDS)[number];

const WARRANTY_LABELS: Record<WarrantyKind, string> = {
  LEGAL: "Garantía legal",
  COMERCIAL: "Garantía comercial de Praetoria",
  CORTESIA: "Cobertura de cortesía",
};

export function warrantyKindLabel(kind: WarrantyKind): string {
  return WARRANTY_LABELS[kind];
}
