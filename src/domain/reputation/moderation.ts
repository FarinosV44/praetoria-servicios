/**
 * Review moderation state machine (issue #26).
 *
 * Non-negotiable rules:
 *  - publication is a per-review decision — there is no path that publishes a
 *    batch filtered by rating, and `isPublishable` is rating-blind;
 *  - every non-publish outcome (`RETENIDA_PII`, `RECHAZADA`, `RETIRADA`) needs a
 *    recorded reason;
 *  - a review cannot reach `AUTORIZADA` while a PII flag is unresolved;
 *  - a withdrawn review does not silently go back to `AUTORIZADA`.
 */

export type ReviewModerationStatus =
  | "PENDIENTE"
  | "RETENIDA_PII"
  | "AUTORIZADA"
  | "RECHAZADA"
  | "RETIRADA";

const ALLOWED: Record<ReviewModerationStatus, ReviewModerationStatus[]> = {
  PENDIENTE: ["AUTORIZADA", "RETENIDA_PII", "RECHAZADA"],
  RETENIDA_PII: ["AUTORIZADA", "RECHAZADA"],
  AUTORIZADA: ["RETIRADA", "RECHAZADA"],
  RECHAZADA: ["PENDIENTE"],
  RETIRADA: [], // terminal — a new review must be submitted
};

const NEEDS_REASON: ReviewModerationStatus[] = ["RETENIDA_PII", "RECHAZADA", "RETIRADA"];

export type TransitionCheck = { ok: true } | { ok: false; error: string };

export function validateModerationTransition(input: {
  from: ReviewModerationStatus;
  to: ReviewModerationStatus;
  piiFlagged: boolean;
  reason: string | null;
}): TransitionCheck {
  const { from, to, piiFlagged, reason } = input;

  if (!ALLOWED[from]?.includes(to)) {
    return { ok: false, error: `Transición no permitida: ${from} → ${to}.` };
  }
  if (to === "AUTORIZADA" && piiFlagged) {
    return { ok: false, error: "No se puede publicar mientras haya un dato personal sin depurar." };
  }
  if (NEEDS_REASON.includes(to) && !reason?.trim()) {
    return { ok: false, error: "Hace falta un motivo de moderación." };
  }
  return { ok: true };
}

/** Rating-blind: a 1-star review is exactly as publishable as a 5-star one. */
export function isPublishable(review: {
  rating: number;
  status: ReviewModerationStatus;
  publishConsent: boolean;
  piiFlagged: boolean;
}): boolean {
  if (!review.publishConsent) return false;
  if (review.piiFlagged) return false;
  return review.status === "PENDIENTE" || review.status === "RETENIDA_PII";
}
