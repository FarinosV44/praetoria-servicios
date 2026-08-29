import "server-only";
import { db } from "@/lib/db";
import { parseEuros } from "@/lib/money";
import { computeTotals, checkComplete } from "@/domain/quotes/compute";
import type { QuoteDraftInput } from "@/domain/quotes/schema";
import { requestService } from "./requests";
import { adminService } from "./admin";
import { err, ok, type Result } from "@/lib/result";
import type { Prisma } from "@prisma/client";

/**
 * Quotes (Presupuestos) — issue #12. Versioned; a sent quote is never modified
 * silently (a change creates a new version). All money is integer cents.
 */

export type QuoteError =
  | { kind: "request_not_found" }
  | { kind: "quote_not_found" }
  | { kind: "incomplete"; missing: string[] }
  | { kind: "accepted_locked" }
  | { kind: "transition"; detail: string };

function toCents(s: string | undefined): number | null {
  if (!s?.trim()) return null;
  try {
    return parseEuros(s);
  } catch {
    return null;
  }
}

function mapLines(input: QuoteDraftInput) {
  return input.lines.map((l, i) => ({
    kind: l.kind,
    concept: l.concept,
    amountCents: (() => {
      try {
        return parseEuros(l.amount || "0");
      } catch {
        return 0;
      }
    })(),
    included: l.included,
    position: i,
  }));
}

export const quoteService = {
  async listForRequest(reference: string) {
    const request = await db.request.findUnique({ where: { reference }, select: { id: true } });
    if (!request) return [];
    return db.quote.findMany({
      where: { requestId: request.id },
      include: { lines: { orderBy: { position: "asc" } } },
      orderBy: { version: "asc" },
    });
  },

  async getById(id: string) {
    return db.quote.findUnique({
      where: { id },
      include: { lines: { orderBy: { position: "asc" } } },
    });
  },

  /** Create a new draft version, or overwrite the current unsent draft. */
  async saveDraft(
    adminId: string,
    reference: string,
    input: QuoteDraftInput,
  ): Promise<Result<{ id: string; version: number }, QuoteError>> {
    const request = await db.request.findUnique({ where: { reference }, select: { id: true } });
    if (!request) return err({ kind: "request_not_found" });

    const lines = mapLines(input);
    const totals = computeTotals(
      lines.map((l) => ({ concept: l.concept, amountCents: l.amountCents, included: l.included })),
      input.taxRateBps,
    );

    const data: Prisma.QuoteUncheckedCreateInput = {
      requestId: request.id,
      version: 0, // set below
      status: "BORRADOR",
      workDescription: input.workDescription ?? "",
      subtotalCents: totals.subtotalCents,
      taxRateBps: input.taxRateBps,
      taxCents: totals.taxCents,
      totalCents: totals.totalCents,
      isEstimate: input.isEstimate,
      maxTotalCents: toCents(input.maxTotal),
      visitFeeCents: toCents(input.visitFee),
      visitFeeDiscounted: input.visitFeeDiscounted,
      exclusionsNote: input.exclusionsNote,
      assumptions: input.assumptions,
      extrasApprovalNote: input.extrasApprovalNote,
      preparatoryNote: input.preparatoryNote,
      professionalRef: input.professionalRef,
      verificationScope: input.verificationScope,
      scheduledFor: input.scheduledFor ? new Date(input.scheduledFor) : null,
      durationEstimate: input.durationEstimate,
      warrantyText: input.warrantyText,
      warrantyResponsible: input.warrantyResponsible,
      estimatedTimeframe: input.estimatedTimeframe,
      validUntil: input.validUntil ? new Date(input.validUntil) : null,
      observations: input.observations,
    };

    const existingDraft = await db.quote.findFirst({
      where: { requestId: request.id, status: "BORRADOR" },
      orderBy: { version: "desc" },
    });

    const quote = await db.$transaction(async (tx) => {
      if (existingDraft) {
        await tx.quoteLine.deleteMany({ where: { quoteId: existingDraft.id } });
        return tx.quote.update({
          where: { id: existingDraft.id },
          data: { ...data, version: existingDraft.version, lines: { create: lines } },
        });
      }
      const max = await tx.quote.aggregate({
        where: { requestId: request.id },
        _max: { version: true },
      });
      return tx.quote.create({
        data: { ...data, version: (max._max.version ?? 0) + 1, lines: { create: lines } },
      });
    });

    await adminService.logAction(adminId, "quote_saved", request.id, {
      quoteId: quote.id,
      v: quote.version,
    });
    return ok({ id: quote.id, version: quote.version });
  },

  async markSent(
    adminId: string,
    reference: string,
    quoteId: string,
  ): Promise<Result<null, QuoteError>> {
    const request = await db.request.findUnique({ where: { reference }, select: { id: true } });
    if (!request) return err({ kind: "request_not_found" });
    const quote = await db.quote.findFirst({
      where: { id: quoteId, requestId: request.id },
      include: { lines: true },
    });
    if (!quote) return err({ kind: "quote_not_found" });

    const completeness = checkComplete({
      workDescription: quote.workDescription,
      lines: quote.lines.map((l) => ({
        concept: l.concept,
        amountCents: l.amountCents,
        included: l.included,
      })),
      warrantyText: quote.warrantyText,
      warrantyResponsible: quote.warrantyResponsible,
      scheduledFor: quote.scheduledFor,
      estimatedTimeframe: quote.estimatedTimeframe,
      professionalRef: quote.professionalRef,
      validUntil: quote.validUntil,
      isEstimate: quote.isEstimate,
      maxTotalCents: quote.maxTotalCents,
    });
    if (!completeness.complete) return err({ kind: "incomplete", missing: completeness.missing });

    await db.$transaction([
      db.quote.update({
        where: { id: quote.id },
        data: { status: "ENVIADO", sentAt: new Date() },
      }),
      // supersede any other unsent drafts
      db.quote.updateMany({
        where: { requestId: request.id, status: "BORRADOR", NOT: { id: quote.id } },
        data: { status: "CADUCADO" },
      }),
    ]);

    // Move the request forward if it is in review.
    const req = await db.request.findUnique({
      where: { id: request.id },
      select: { status: true },
    });
    if (req?.status === "EN_REVISION") {
      await requestService.applyTransition({
        requestId: request.id,
        to: "PRESUPUESTO_PREPARADO",
        actor: "ADMIN",
        actorId: adminId,
      });
    }
    if (req?.status === "PRESUPUESTO_PREPARADO" || req?.status === "EN_REVISION") {
      await requestService.applyTransition({
        requestId: request.id,
        to: "PRESUPUESTO_ENVIADO",
        actor: "ADMIN",
        actorId: adminId,
        reason: `Presupuesto v${quote.version} enviado`,
      });
    }
    await adminService.logAction(adminId, "quote_sent", request.id, { quoteId: quote.id });
    return ok(null);
  },

  /** Client decision via the signed link (#16) — evidence recorded. */
  async recordDecision(
    quoteId: string,
    decision: "ACEPTADO" | "RECHAZADO",
    evidence: object,
  ): Promise<Result<null, QuoteError>> {
    const quote = await db.quote.findUnique({ where: { id: quoteId } });
    if (!quote) return err({ kind: "quote_not_found" });
    if (quote.status === "ACEPTADO") return err({ kind: "accepted_locked" });

    await db.quote.update({
      where: { id: quoteId },
      data: {
        status: decision,
        acceptedAt: decision === "ACEPTADO" ? new Date() : null,
        rejectedAt: decision === "RECHAZADO" ? new Date() : null,
        decisionEvidence: evidence as Prisma.InputJsonValue,
      },
    });
    const to = decision === "ACEPTADO" ? "ACEPTADA" : "RECHAZADA";
    const r = await requestService.applyTransition({
      requestId: quote.requestId,
      to,
      actor: "CLIENT",
      reason: `Presupuesto v${quote.version} ${decision.toLowerCase()}`,
    });
    if (!r.ok) return err({ kind: "transition", detail: r.error.kind });
    return ok(null);
  },

  async expireStale(now: Date = new Date()): Promise<number> {
    const { count } = await db.quote.updateMany({
      where: { status: "ENVIADO", validUntil: { lt: now } },
      data: { status: "CADUCADO" },
    });
    return count;
  },
};
