import "server-only";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { log } from "@/lib/logging";
import { err, ok, type Result } from "@/lib/result";

/**
 * Post-service review (issue #23 — the linkage part; the full reputation system
 * is #26).
 *
 * Rules enforced here:
 *  - a review can only be submitted for a CERRADA request (never a non-existent job);
 *  - one review per request;
 *  - publication is an explicit admin authorisation AND requires the client's
 *    consent to show it — the landing renders only reviews that pass both.
 */

export type ReviewError =
  | { kind: "not_found" }
  | { kind: "not_closed" }
  | { kind: "invalid_rating" };

export const reviewService = {
  async submit(
    requestId: string,
    input: { rating: number; comment?: string; publishConsent: boolean; authorDisplayName?: string },
  ): Promise<Result<{ id: string }, ReviewError>> {
    if (!Number.isInteger(input.rating) || input.rating < 1 || input.rating > 5) {
      return err({ kind: "invalid_rating" });
    }
    const request = await db.request.findUnique({
      where: { id: requestId },
      select: { status: true },
    });
    if (!request) return err({ kind: "not_found" });
    if (request.status !== "CERRADA") return err({ kind: "not_closed" });

    const data = {
      rating: input.rating,
      comment: input.comment?.slice(0, 1500) ?? null,
      publishConsent: input.publishConsent,
      authorDisplayName: input.publishConsent ? (input.authorDisplayName?.slice(0, 80) ?? null) : null,
      status: "PENDIENTE" as const,
    };
    const row = await db.review.upsert({
      where: { requestId },
      create: { requestId, ...data },
      update: data,
      select: { id: true },
    });
    log.info("review submitted", { requestId, rating: input.rating, consent: input.publishConsent });
    return ok(row);
  },

  async authorize(
    reviewId: string,
    decision: "AUTORIZADA" | "RECHAZADA",
    adminId: string,
  ): Promise<Result<null, ReviewError>> {
    const review = await db.review.findUnique({ where: { id: reviewId }, select: { id: true } });
    if (!review) return err({ kind: "not_found" });
    await db.review.update({
      where: { id: reviewId },
      data: {
        status: decision,
        authorizedByAdminId: adminId,
        authorizedAt: new Date(),
      },
    });
    await db.adminActionLog.create({
      data: {
        adminId,
        action: "review_authorization",
        detail: { reviewId, decision } as Prisma.InputJsonValue,
      },
    });
    return ok(null);
  },

  async forRequest(requestId: string) {
    return db.review.findUnique({
      where: { requestId },
      select: { id: true, rating: true, status: true, publishConsent: true },
    });
  },

  async listForAdmin(status?: "PENDIENTE" | "AUTORIZADA" | "RECHAZADA") {
    return db.review.findMany({
      where: { status },
      orderBy: { createdAt: "desc" },
      include: { request: { select: { reference: true, trade: true } } },
    });
  },

  /** Only real, authorised, consented reviews — for the landing (issue #23 AC). */
  async listPublished() {
    return db.review.findMany({
      where: {
        status: "AUTORIZADA",
        publishConsent: true,
        request: { status: "CERRADA" },
      },
      orderBy: { authorizedAt: "desc" },
      take: 12,
      select: {
        id: true,
        rating: true,
        comment: true,
        authorDisplayName: true,
        request: { select: { trade: true } },
      },
    });
  },
};
