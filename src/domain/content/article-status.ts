/**
 * Editorial article lifecycle (issue #24).
 *
 * Rules from the issue:
 *  - nothing is PUBLICADO or PROGRAMADO without a human review;
 *  - PROGRAMADO requires a future publish date.
 */

export const ARTICLE_STATUSES = [
  "BORRADOR",
  "REVISION",
  "PROGRAMADO",
  "PUBLICADO",
  "ARCHIVADO",
] as const;
export type ArticleStatus = (typeof ARTICLE_STATUSES)[number];

const TRANSITIONS: Record<ArticleStatus, ArticleStatus[]> = {
  BORRADOR: ["REVISION", "ARCHIVADO"],
  REVISION: ["BORRADOR", "PROGRAMADO", "PUBLICADO", "ARCHIVADO"],
  PROGRAMADO: ["PUBLICADO", "REVISION", "BORRADOR", "ARCHIVADO"],
  PUBLICADO: ["ARCHIVADO", "REVISION"],
  ARCHIVADO: ["BORRADOR"],
};

const NEEDS_REVIEW: readonly ArticleStatus[] = ["PROGRAMADO", "PUBLICADO"];

export type ArticleTransitionError =
  | "invalid_transition"
  | "human_review_required"
  | "publish_date_required"
  | "publish_date_not_future";

export function allowedNextArticleStatuses(from: ArticleStatus): ArticleStatus[] {
  return [...TRANSITIONS[from]];
}

export function validateArticleTransition(input: {
  from: ArticleStatus;
  to: ArticleStatus;
  reviewedByHuman: boolean;
  publishAt?: Date | null;
  now?: Date;
}): { ok: true } | { ok: false; error: ArticleTransitionError } {
  const { from, to, reviewedByHuman, publishAt } = input;
  const now = input.now ?? new Date();

  if (!TRANSITIONS[from]?.includes(to)) return { ok: false, error: "invalid_transition" };
  if (NEEDS_REVIEW.includes(to) && !reviewedByHuman) {
    return { ok: false, error: "human_review_required" };
  }
  if (to === "PROGRAMADO") {
    if (!publishAt) return { ok: false, error: "publish_date_required" };
    if (publishAt.getTime() <= now.getTime()) {
      return { ok: false, error: "publish_date_not_future" };
    }
  }
  return { ok: true };
}
