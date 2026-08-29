import { LIMITS } from "@/config/limits";

/**
 * Draft lifecycle (issue #9: "Borradores incompletos pueden caducar y eliminarse").
 * Pure helpers — the service uses these to decide what to expire.
 */

export interface DraftLike {
  status: string;
  submittedAt: Date | null;
  updatedAt: Date;
}

/** When a freshly-created draft should expire, given its creation time. */
export function draftExpiryFrom(createdAt: Date): Date {
  return new Date(createdAt.getTime() + LIMITS.draft.expiryDays * 24 * 3600_000);
}

/**
 * A request is an expirable stale draft when it is still BORRADOR, was never
 * submitted, and has had no activity for the configured window.
 */
export function isDraftExpired(draft: DraftLike, now: Date = new Date()): boolean {
  if (draft.status !== "BORRADOR") return false;
  if (draft.submittedAt) return false;
  const cutoff = draft.updatedAt.getTime() + LIMITS.draft.expiryDays * 24 * 3600_000;
  return now.getTime() >= cutoff;
}
