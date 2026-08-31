import "server-only";
import type { Prisma, ReviewStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { log } from "@/lib/logging";
import { err, ok, type Result } from "@/lib/result";
import { serviceClosureService } from "./serviceClosure";
import {
  computeAggregate,
  REVIEW_DIMENSIONS,
  type ReviewDimension,
} from "@/domain/reputation/aggregate";
import { detectPii, redactPii } from "@/domain/reputation/pii";
import { isLikelyDuplicate, isLikelySpam } from "@/domain/reputation/spam";
import {
  validateModerationTransition,
  type ReviewModerationStatus,
} from "@/domain/reputation/moderation";

/**
 * Verified reviews + local reputation (issues #23 seed, #26 full system).
 *
 * - a review can only be submitted for a CERRADA request (never a non-existent job);
 * - PII in the comment auto-holds the review (`RETENIDA_PII`) — it cannot be
 *   published until an admin redacts it;
 * - publication is a per-review admin decision; there is no rating filter that
 *   hides legitimate criticism, and `listPublished` never accepts one;
 * - averages come only from real published reviews (`aggregateFor`);
 * - a negative review can open an incidence;
 * - consent and withdrawal are traced (timestamps + `AdminActionLog`).
 */

export type ReviewError =
  | { kind: "not_found" }
  | { kind: "not_closed" }
  | { kind: "invalid_rating" }
  | { kind: "transition"; error: string };

interface SubmitInput {
  rating: number;
  comment?: string;
  publishConsent: boolean;
  authorDisplayName?: string;
  punctuality?: number | null;
  clarity?: number | null;
  cleanliness?: number | null;
  result?: number | null;
}

const dim = (n: number | null | undefined): number | null =>
  typeof n === "number" && Number.isInteger(n) && n >= 1 && n <= 5 ? n : null;

/**
 * Write an audit row. Client-initiated actions (withdrawal from `/s/[token]`)
 * carry no admin actor — the trace then lives on the Review row itself
 * (`withdrawnAt` / `withdrawalReason`) plus the structured log.
 */
async function auditLog(actorId: string, action: string, detail: Record<string, unknown>) {
  const isAdmin = await db.adminUser.findUnique({ where: { id: actorId }, select: { id: true } });
  if (isAdmin) {
    await db.adminActionLog.create({
      data: { adminId: actorId, action, detail: detail as Prisma.InputJsonValue },
    });
  } else {
    log.info(`${action} (client)`, detail);
  }
}

function publishedWhere(trade?: string, professionalId?: string): Prisma.ReviewWhereInput {
  return {
    status: "AUTORIZADA",
    publishConsent: true,
    withdrawnAt: null,
    request: trade ? { status: "CERRADA", trade } : { status: "CERRADA" },
    ...(professionalId ? { professionalId } : {}),
  };
}

export const reviewService = {
  async submit(
    requestId: string,
    input: SubmitInput,
  ): Promise<Result<{ id: string }, ReviewError>> {
    if (!Number.isInteger(input.rating) || input.rating < 1 || input.rating > 5) {
      return err({ kind: "invalid_rating" });
    }
    const request = await db.request.findUnique({
      where: { id: requestId },
      select: { status: true, completion: { select: { executedByProfessionalId: true } } },
    });
    if (!request) return err({ kind: "not_found" });
    if (request.status !== "CERRADA") return err({ kind: "not_closed" });

    const comment = input.comment?.trim().slice(0, 1500) || null;
    const pii = comment ? detectPii(comment) : { hasPii: false, kinds: [] as string[] };
    const spamFlagged = comment ? isLikelySpam(comment) : false;

    let duplicateFlagged = false;
    if (comment) {
      const others = await db.review.findMany({
        where: { NOT: { requestId } },
        select: { comment: true, originalComment: true },
      });
      duplicateFlagged = isLikelyDuplicate(
        comment,
        others.flatMap((o) => [o.originalComment, o.comment].filter((x): x is string => !!x)),
      );
    }

    const data = {
      rating: input.rating,
      punctuality: dim(input.punctuality),
      clarity: dim(input.clarity),
      cleanliness: dim(input.cleanliness),
      result: dim(input.result),
      comment,
      originalComment: comment,
      publishConsent: input.publishConsent,
      authorDisplayName: input.publishConsent
        ? input.authorDisplayName?.trim().slice(0, 80) || null
        : null,
      professionalId: request.completion?.executedByProfessionalId ?? null,
      piiFlagged: pii.hasPii,
      piiKinds: pii.kinds,
      spamFlagged,
      duplicateFlagged,
      status: (pii.hasPii ? "RETENIDA_PII" : "PENDIENTE") as ReviewStatus,
    };

    const row = await db.review.upsert({
      where: { requestId },
      create: { requestId, ...data },
      update: data,
      select: { id: true },
    });
    log.info("review submitted", {
      requestId,
      rating: input.rating,
      consent: input.publishConsent,
      pii: pii.hasPii,
      spam: spamFlagged,
      dup: duplicateFlagged,
    });
    return ok(row);
  },

  /** Redact the comment in place; clears the PII flag if nothing remains. */
  async applyRedaction(reviewId: string, adminId: string): Promise<Result<null, ReviewError>> {
    const review = await db.review.findUnique({ where: { id: reviewId } });
    if (!review) return err({ kind: "not_found" });
    const source = review.comment ?? review.originalComment ?? "";
    const redacted = redactPii(source);
    const stillPii = detectPii(redacted);
    await db.review.update({
      where: { id: reviewId },
      data: { comment: redacted, piiFlagged: stillPii.hasPii, piiKinds: stillPii.kinds },
    });
    await db.adminActionLog.create({
      data: {
        adminId,
        action: "review_redaction",
        detail: { reviewId, cleared: !stillPii.hasPii } as Prisma.InputJsonValue,
      },
    });
    log.info("review redacted", { reviewId, cleared: !stillPii.hasPii });
    return ok(null);
  },

  /** The single moderation entry point (issue #26). */
  async moderate(
    reviewId: string,
    to: ReviewModerationStatus,
    opts: { reason?: string; adminId: string },
  ): Promise<Result<null, ReviewError>> {
    const review = await db.review.findUnique({ where: { id: reviewId } });
    if (!review) return err({ kind: "not_found" });

    const check = validateModerationTransition({
      from: review.status as ReviewModerationStatus,
      to,
      piiFlagged: review.piiFlagged,
      reason: opts.reason ?? null,
    });
    if (!check.ok) return err({ kind: "transition", error: check.error });

    const now = new Date();
    const data: Prisma.ReviewUpdateInput = { status: to as ReviewStatus };
    if (to === "AUTORIZADA") {
      data.authorizedByAdminId = opts.adminId;
      data.authorizedAt = now;
      data.publishedAt = review.publishedAt ?? now;
    } else {
      data.moderationReason = opts.reason?.trim();
      data.moderatedByAdminId = opts.adminId;
      data.moderatedAt = now;
      if (to === "RETIRADA") {
        data.withdrawnAt = now;
        data.withdrawalReason = opts.reason?.trim();
      }
    }

    await db.review.update({ where: { id: reviewId }, data });
    await auditLog(opts.adminId, "review_moderation", {
      reviewId,
      from: review.status,
      to,
      reason: opts.reason ?? null,
    });
    log.info("review moderated", { reviewId, from: review.status, to });
    return ok(null);
  },

  /** Back-compat wrapper (issue #23 callers). */
  async authorize(
    reviewId: string,
    decision: "AUTORIZADA" | "RECHAZADA",
    adminId: string,
    reason?: string,
  ): Promise<Result<null, ReviewError>> {
    return this.moderate(reviewId, decision, {
      adminId,
      reason: decision === "RECHAZADA" ? reason ?? "Rechazada por un administrador." : undefined,
    });
  },

  /** Client- or admin-initiated withdrawal (issue #26 — right to retirada). */
  async withdraw(
    reviewId: string,
    reason: string,
    adminId = "cliente",
  ): Promise<Result<null, ReviewError>> {
    return this.moderate(reviewId, "RETIRADA", { adminId, reason });
  },

  async respond(
    reviewId: string,
    text: string,
    adminId: string,
  ): Promise<Result<null, ReviewError>> {
    const review = await db.review.findUnique({ where: { id: reviewId }, select: { id: true } });
    if (!review) return err({ kind: "not_found" });
    await db.review.update({
      where: { id: reviewId },
      data: {
        praetoriaResponse: text.trim().slice(0, 1500) || null,
        respondedByAdminId: adminId,
        respondedAt: new Date(),
      },
    });
    log.info("review response recorded", { reviewId });
    return ok(null);
  },

  /** A negative review can open an incidence (issue #26 AC). */
  async openIncidence(
    reviewId: string,
    adminId: string,
  ): Promise<Result<{ reference: string }, ReviewError>> {
    const review = await db.review.findUnique({
      where: { id: reviewId },
      select: { id: true, rating: true, requestId: true, incidenceId: true },
    });
    if (!review) return err({ kind: "not_found" });

    const opened = await serviceClosureService.openIncidence({
      requestId: review.requestId,
      description: `Incidencia abierta desde una reseña de ${review.rating}★. Revisar la ejecución del trabajo con el cliente.`,
      openedBy: "ADMIN",
    });
    if (!opened.ok) return err({ kind: "not_found" });

    await db.review.update({ where: { id: reviewId }, data: { incidenceId: opened.value.id } });
    await db.adminActionLog.create({
      data: {
        adminId,
        action: "review_incidence_opened",
        detail: { reviewId, incidenceReference: opened.value.reference } as Prisma.InputJsonValue,
      },
    });
    return ok({ reference: opened.value.reference });
  },

  async forRequest(requestId: string) {
    return db.review.findUnique({
      where: { requestId },
      select: { id: true, rating: true, status: true, publishConsent: true },
    });
  },

  async listForAdmin(status?: ReviewStatus) {
    return db.review.findMany({
      where: { status },
      orderBy: { createdAt: "desc" },
      include: { request: { select: { reference: true, trade: true, status: true } } },
    });
  },

  /**
   * Published reviews (issue #26). `opts.trade` narrows to one service; `opts.sort`
   * is a TRANSPARENT order. There is deliberately NO rating filter — criticism is
   * never hidden.
   */
  async listPublished(opts: {
    trade?: string;
    sort?: "recent" | "rating_desc" | "rating_asc";
    take?: number;
  } = {}) {
    const orderBy: Prisma.ReviewOrderByWithRelationInput =
      opts.sort === "rating_desc"
        ? { rating: "desc" }
        : opts.sort === "rating_asc"
          ? { rating: "asc" }
          : { publishedAt: "desc" };

    return db.review.findMany({
      where: publishedWhere(opts.trade),
      orderBy,
      take: opts.take ?? 20,
      select: {
        id: true,
        rating: true,
        punctuality: true,
        clarity: true,
        cleanliness: true,
        result: true,
        comment: true,
        authorDisplayName: true,
        publishedAt: true,
        praetoriaResponse: true,
        request: { select: { trade: true } },
      },
    });
  },

  /** Reproducible aggregate over the real published set (issue #26 AC-averages). */
  async aggregateFor(opts: { trade?: string; professionalId?: string } = {}) {
    const rows = await db.review.findMany({
      where: publishedWhere(opts.trade, opts.professionalId),
      select: {
        rating: true,
        punctuality: true,
        clarity: true,
        cleanliness: true,
        result: true,
      },
    });
    return computeAggregate(
      rows.map((r) => ({
        rating: r.rating,
        dimensions: Object.fromEntries(
          REVIEW_DIMENSIONS.map((d) => [d, r[d] ?? null]),
        ) as Record<ReviewDimension, number | null>,
      })),
    );
  },
};
