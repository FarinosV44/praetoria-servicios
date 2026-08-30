import "server-only";
import { db } from "@/lib/db";
import { log } from "@/lib/logging";
import { getAdapters } from "@/server/container";
import { err, ok, type Result } from "@/lib/result";
import { coverageResultSchema, type CoverageResult } from "@/domain/analysis/schema";
import {
  buildCoverageBreakdown,
  buildDraft,
  DRAFT_PENDING_LABEL,
  DRAFT_REVIEWED_LABEL,
  needsPolicyDocument,
} from "@/domain/insurance/coverage";
import { insuranceService } from "./insurance";
import type { Prisma } from "@prisma/client";

/**
 * Coverage analysis + reviewable legal draft (issue #15, benchmark D5). Crosses
 * the validated problem analysis with the real policy text and produces a
 * prudent orientation plus a draft communication to the insurer. The draft is
 * "borrador pendiente de revisión" until an admin explicitly marks it reviewed;
 * every revision is kept.
 */

export type CoverageError =
  | { kind: "request_not_found" }
  | { kind: "no_analysis" }
  | { kind: "no_policy" }
  | { kind: "provider"; message: string }
  | { kind: "not_found" };

export const coverageService = {
  /** Run (or re-run) the coverage analysis for a request. */
  async analyze(requestId: string): Promise<Result<{ verdict: string }, CoverageError>> {
    const request = await db.request.findUnique({
      where: { id: requestId },
      include: {
        contact: { select: { name: true } },
        analyses: { where: { isActive: true }, orderBy: { version: "desc" }, take: 1 },
        insurance: true,
      },
    });
    if (!request) return err({ kind: "request_not_found" });

    const analysis = request.analyses[0];
    if (!analysis || analysis.outcome === "PROVIDER_ERROR") return err({ kind: "no_analysis" });
    if (!request.insurance) return err({ kind: "no_policy" });

    const policyPages = await insuranceService.getPolicyPages(requestId);

    const ai = getAdapters().ai;
    const res = await ai.analyzeCoverage({
      analysis: analysis.result as never,
      problemText: request.problemText ?? "",
      policyPages,
    });
    if (!res.ok) {
      return err({ kind: "provider", message: "message" in res.error ? res.error.message : res.error.kind });
    }

    const parsed = coverageResultSchema.safeParse(res.value);
    if (!parsed.success) return err({ kind: "provider", message: "invalid coverage output" });
    const result: CoverageResult = parsed.data;

    const draft = buildDraft(result, {
      clientName: request.contact?.name ?? "[cliente]",
      reference: request.reference,
      insurerName: request.insurance.insurerName,
      policyNumber: request.insurance.policyNumber,
      problemSummary:
        (analysis.result as Record<string, unknown>).plainSummary?.toString() ??
        request.problemText ??
        "",
    });

    await db.coverageAnalysis.upsert({
      where: { caseId: request.insurance.id },
      create: {
        caseId: request.insurance.id,
        verdict: result.verdict,
        result: result as unknown as Prisma.InputJsonValue,
        confidence: result.confidence,
        draftText: draft,
        draftStatus: "BORRADOR_PENDIENTE_REVISION",
      },
      update: {
        verdict: result.verdict,
        result: result as unknown as Prisma.InputJsonValue,
        confidence: result.confidence,
        draftText: draft,
        // A re-run resets the review state — the text changed.
        draftStatus: "BORRADOR_PENDIENTE_REVISION",
        reviewedByAdminId: null,
        reviewedAt: null,
      },
    });
    log.info("coverage analysis stored", { requestId, verdict: result.verdict });
    return ok({ verdict: result.verdict });
  },

  /** The coverage view for a request — breakdown, draft, review state, history. */
  async getForRequest(requestId: string) {
    const request = await db.request.findUnique({
      where: { id: requestId },
      select: { insurance: { select: { id: true } } },
    });
    if (!request?.insurance) return null;
    const cov = await db.coverageAnalysis.findUnique({
      where: { caseId: request.insurance.id },
      include: { revisions: { orderBy: { createdAt: "desc" } } },
    });
    if (!cov) return null;

    const parsed = coverageResultSchema.safeParse(cov.result);
    const breakdown = parsed.success ? buildCoverageBreakdown(parsed.data) : null;
    const reviewed = cov.draftStatus === "REVISADO_PRAETORIA";

    return {
      id: cov.id,
      verdict: cov.verdict,
      confidence: cov.confidence,
      draftText: cov.draftText,
      draftStatus: cov.draftStatus,
      draftStatusLabel: reviewed ? DRAFT_REVIEWED_LABEL : DRAFT_PENDING_LABEL,
      reviewed,
      reviewedAt: cov.reviewedAt,
      needsPolicyDocument: parsed.success ? needsPolicyDocument(parsed.data) : true,
      breakdown,
      revisions: cov.revisions.map((r) => ({
        id: r.id,
        note: r.note,
        createdAt: r.createdAt,
        adminId: r.adminId,
      })),
    };
  },

  /** Admin edits the draft — a new revision, review state unchanged. */
  async reviseDraft(
    adminId: string,
    requestId: string,
    newText: string,
    note: string,
  ): Promise<Result<null, CoverageError>> {
    const cov = await this.load(requestId);
    if (!cov) return err({ kind: "not_found" });
    await db.$transaction([
      db.coverageDraftRevision.create({
        data: { coverageId: cov.id, adminId, note: note.slice(0, 1000), draftText: cov.draftText ?? "" },
      }),
      db.coverageAnalysis.update({ where: { id: cov.id }, data: { draftText: newText } }),
    ]);
    log.info("coverage draft revised", { requestId });
    return ok(null);
  },

  /**
   * Admin explicitly marks the draft reviewed — only after this can it be shown
   * as "Revisado por Praetoria" (issue #15). Recorded with the admin + moment.
   */
  async markReviewed(
    adminId: string,
    requestId: string,
    note?: string,
  ): Promise<Result<null, CoverageError>> {
    const cov = await this.load(requestId);
    if (!cov) return err({ kind: "not_found" });
    await db.$transaction([
      db.coverageDraftRevision.create({
        data: {
          coverageId: cov.id,
          adminId,
          note: (note ?? "Revisión y validación por Praetoria").slice(0, 1000),
          draftText: cov.draftText ?? "",
        },
      }),
      db.coverageAnalysis.update({
        where: { id: cov.id },
        data: {
          draftStatus: "REVISADO_PRAETORIA",
          reviewedByAdminId: adminId,
          reviewedAt: new Date(),
        },
      }),
    ]);
    log.info("coverage draft marked reviewed", { requestId, adminId });
    return ok(null);
  },

  async load(requestId: string) {
    const request = await db.request.findUnique({
      where: { id: requestId },
      select: { insurance: { select: { id: true } } },
    });
    if (!request?.insurance) return null;
    return db.coverageAnalysis.findUnique({ where: { caseId: request.insurance.id } });
  },
};

export type CoverageService = typeof coverageService;
