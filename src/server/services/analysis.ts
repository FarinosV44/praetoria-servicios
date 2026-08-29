import "server-only";
import { db } from "@/lib/db";
import { log } from "@/lib/logging";
import { getAdapters } from "@/server/container";
import { LIMITS } from "@/config/limits";
import { err, ok, type Result } from "@/lib/result";
import type { AnalysisResult } from "@/domain/analysis/schema";

/**
 * AI analysis of a request (issue #7). Turns photos + description into a
 * structured, schema-validated brief. The adapter (mock in dev/test, Claude in
 * prod) already validates the shape; here we persist it as an immutable,
 * versioned `AnalysisVersion` and manage which one is active (issue #8: the
 * previous version is never lost).
 */

export type AnalysisError =
  { kind: "not_found" } | { kind: "too_many_reanalyses" } | { kind: "provider"; message: string };

export interface AnalysisView {
  version: number;
  outcome: "OK" | "NEEDS_MORE_INFO" | "PROVIDER_ERROR";
  result: AnalysisResult | null;
  confidence: number | null;
  requiresOnSiteInspection: boolean;
}

async function loadPhotoBytes(requestId: string) {
  const photos = await db.photo.findMany({
    where: { requestId, deletedAt: null },
    orderBy: { position: "asc" },
  });
  const storage = getAdapters().storage;
  const out: { data: Uint8Array; contentType: string; hint?: string }[] = [];
  for (const p of photos) {
    const data = await storage.get(p.storageKey);
    if (data) out.push({ data, contentType: p.contentType, hint: p.hint ?? undefined });
  }
  return out;
}

export const analysisService = {
  async analyze(requestId: string): Promise<Result<AnalysisView, AnalysisError>> {
    const request = await db.request.findUnique({
      where: { id: requestId },
      select: {
        id: true,
        problemText: true,
        trade: true,
        clientChoseUnsure: true,
        municipality: true,
        _count: { select: { analyses: true } },
      },
    });
    if (!request) return err({ kind: "not_found" });

    const reanalyses = await db.analysisVersion.count({ where: { requestId } });
    if (reanalyses >= LIMITS.reanalysis.maxPerRequest + 1) {
      return err({ kind: "too_many_reanalyses" });
    }

    const priorActive = await db.analysisVersion.findFirst({
      where: { requestId, isActive: true },
      orderBy: { version: "desc" },
    });
    const correction = await db.clientCorrection.findFirst({
      where: { requestId },
      orderBy: { createdAt: "desc" },
    });

    const ai = getAdapters().ai;
    const photos = await loadPhotoBytes(requestId);
    const res = await ai.analyzeProblem({
      problemText: request.problemText ?? "",
      clientChoseUnsure: request.clientChoseUnsure,
      declaredTrade: request.trade ?? undefined,
      photos,
      municipality: request.municipality ?? undefined,
      priorResult: (priorActive?.result as AnalysisResult) ?? undefined,
      clientClarification: correction?.clarification ?? undefined,
      wrongSections: correction?.wrongSections ?? undefined,
    });

    const nextVersion = (priorActive?.version ?? 0) + 1;

    if (!res.ok) {
      const row = await db.$transaction(async (tx) => {
        await tx.analysisVersion.updateMany({ where: { requestId }, data: { isActive: false } });
        return tx.analysisVersion.create({
          data: {
            requestId,
            version: nextVersion,
            isActive: true,
            outcome: "PROVIDER_ERROR",
            promptVersion: ai.promptVersion,
            result: { error: res.error.kind } as object,
          },
        });
      });
      log.warn("analysis provider error", { requestId, kind: res.error.kind });
      return ok({
        version: row.version,
        outcome: "PROVIDER_ERROR",
        result: null,
        confidence: null,
        requiresOnSiteInspection: false,
      });
    }

    const result = res.value;
    const outcome =
      result.missingInfo.length > 0 && result.confidence < 40 ? "NEEDS_MORE_INFO" : "OK";

    const row = await db.$transaction(async (tx) => {
      await tx.analysisVersion.updateMany({ where: { requestId }, data: { isActive: false } });
      return tx.analysisVersion.create({
        data: {
          requestId,
          version: nextVersion,
          isActive: true,
          outcome,
          promptVersion: ai.promptVersion,
          result: result as unknown as object,
          confidence: result.confidence,
          requiresOnSiteInspection: result.requiresOnSiteInspection,
        },
      });
    });

    log.info("analysis stored", { requestId, version: row.version, outcome });
    return ok({
      version: row.version,
      outcome,
      result,
      confidence: result.confidence,
      requiresOnSiteInspection: result.requiresOnSiteInspection,
    });
  },

  async getActive(requestId: string): Promise<AnalysisView | null> {
    const row = await db.analysisVersion.findFirst({
      where: { requestId, isActive: true },
      orderBy: { version: "desc" },
    });
    if (!row) return null;
    return {
      version: row.version,
      outcome: row.outcome,
      result: row.outcome === "PROVIDER_ERROR" ? null : (row.result as unknown as AnalysisResult),
      confidence: row.confidence,
      requiresOnSiteInspection: row.requiresOnSiteInspection,
    };
  },

  async history(requestId: string) {
    return db.analysisVersion.findMany({ where: { requestId }, orderBy: { version: "asc" } });
  },

  /** Client marks the active analysis wrong and supplies clarification (issue #8). */
  async recordCorrection(input: {
    requestId: string;
    wrongSections: string[];
    clarification?: string;
    addedPhotoIds?: string[];
  }): Promise<Result<null, AnalysisError>> {
    const request = await db.request.findUnique({
      where: { id: input.requestId },
      select: { id: true },
    });
    if (!request) return err({ kind: "not_found" });
    await db.clientCorrection.create({
      data: {
        requestId: input.requestId,
        wrongSections: input.wrongSections,
        clarification: input.clarification,
        addedPhotoIds: input.addedPhotoIds ?? [],
      },
    });
    return ok(null);
  },
};
