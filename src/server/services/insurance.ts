import "server-only";
import { db } from "@/lib/db";
import { log } from "@/lib/logging";
import { newShortId } from "@/lib/id";
import { getAdapters } from "@/server/container";
import { err, ok, type Result } from "@/lib/result";
import { validateInsuranceDoc } from "@/domain/insurance/validation";
import {
  DOC_KIND_LABEL,
  EMPTY_EXTRACTION,
  extractionStatusFor,
  isDocKind,
  missingSummary,
  policyExtractionSchema,
  type DocKind,
  type PolicyExtraction,
} from "@/domain/insurance/schema";
import { extractPolicyFields, type ExtractDoc } from "@/domain/insurance/extract";
import type { Prisma } from "@prisma/client";

/**
 * Insurance policy handling (issue #14). Documents are especially sensitive:
 * private encrypted-at-rest blob, signed short-lived URLs, no content in logs,
 * verified deletion. A specific INSURANCE_DOC_ANALYSIS consent gates everything.
 * Coverage analysis + the legal draft are issue #15.
 */

const CONSENT_TYPE = "INSURANCE_DOC_ANALYSIS" as const;
const EXT: Record<string, string> = {
  "application/pdf": "pdf",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};
const SIGNED_URL_TTL = 60 * 10;

export type InsuranceError =
  | { kind: "request_not_found" }
  | { kind: "consent_required" }
  | { kind: "rejected"; code: string; message: string }
  | { kind: "not_found" }
  | { kind: "delete_unverified" };

export const insuranceService = {
  /** Get or create the 1:1 InsuranceCase for a request (issue #14: linkpolicy). */
  async ensureCase(requestId: string): Promise<Result<{ id: string }, InsuranceError>> {
    const request = await db.request.findUnique({ where: { id: requestId }, select: { id: true } });
    if (!request) return err({ kind: "request_not_found" });
    const existing = await db.insuranceCase.findUnique({
      where: { requestId },
      select: { id: true },
    });
    if (existing) return ok(existing);
    const created = await db.insuranceCase.create({
      data: { requestId },
      select: { id: true },
    });
    return ok(created);
  },

  /** Record the specific consent to analyse the policy document (issue #14). */
  async recordConsent(
    requestId: string,
    granted: boolean,
    textVersion: string,
  ): Promise<Result<null, InsuranceError>> {
    const c = await this.ensureCase(requestId);
    if (!c.ok) return err(c.error);
    await db.$transaction([
      db.consent.upsert({
        where: { requestId_type: { requestId, type: CONSENT_TYPE } },
        create: { requestId, type: CONSENT_TYPE, granted, textVersion },
        update: { granted, textVersion },
      }),
      db.insuranceCase.update({ where: { requestId }, data: { consentGiven: granted } }),
    ]);
    log.info("insurance consent recorded", { requestId, granted });
    return ok(null);
  },

  async hasConsent(requestId: string): Promise<boolean> {
    const row = await db.consent.findUnique({
      where: { requestId_type: { requestId, type: CONSENT_TYPE } },
      select: { granted: true },
    });
    return !!row?.granted;
  },

  /** Upload one policy document. Requires the specific consent. */
  async addDocument(input: {
    requestId: string;
    bytes: Uint8Array;
    size: number;
    kind: string;
  }): Promise<Result<{ id: string }, InsuranceError>> {
    const c = await this.ensureCase(input.requestId);
    if (!c.ok) return err(c.error);
    if (!(await this.hasConsent(input.requestId))) return err({ kind: "consent_required" });

    const currentCount = await db.insuranceDocument.count({
      where: { caseId: c.value.id, deletedAt: null },
    });
    const check = validateInsuranceDoc({ bytes: input.bytes, size: input.size }, currentCount);
    if (!check.ok) {
      return err({ kind: "rejected", code: check.error.code, message: check.error.message });
    }

    const kind: DocKind = isDocKind(input.kind) ? input.kind : "otro";
    const docId = newShortId();
    const key = `insurance/${c.value.id}/${docId}.${EXT[check.type]}`;

    await getAdapters().storage.put({
      key,
      data: input.bytes,
      contentType: check.type,
      sensitive: true,
    });
    const row = await db.insuranceDocument.create({
      data: {
        caseId: c.value.id,
        storageKey: key,
        contentType: check.type,
        byteSize: input.size,
        kind,
      },
      select: { id: true },
    });
    // No file name, no content — just the fact and its size.
    log.info("insurance document added", { requestId: input.requestId, kind, bytes: input.size });
    return ok(row);
  },

  /** OCR + tentative extraction across every document of the case (issue #14). */
  async analyze(requestId: string): Promise<Result<{ status: string }, InsuranceError>> {
    const insCase = await db.insuranceCase.findUnique({
      where: { requestId },
      include: { documents: { where: { deletedAt: null } } },
    });
    if (!insCase) return err({ kind: "not_found" });
    if (!insCase.consentGiven) return err({ kind: "consent_required" });

    const ocr = getAdapters().ocr;
    const storage = getAdapters().storage;
    const extractDocs: ExtractDoc[] = [];
    let anyReadable = false;

    for (const doc of insCase.documents) {
      const data = await storage.get(doc.storageKey);
      const res = await ocr.extract({
        data: data ?? new Uint8Array(),
        contentType: doc.contentType,
        documentLabel: DOC_KIND_LABEL[(doc.kind as DocKind) ?? "otro"],
      });
      const usedOcr = res.pages.some((p) => p.ocr);
      await db.insuranceDocument.update({
        where: { id: doc.id },
        data: { ocrUsed: usedOcr, pageCount: res.pages.length },
      });
      if (!res.unreadable && res.pages.length > 0) {
        anyReadable = true;
        extractDocs.push({
          docId: doc.id,
          pages: res.pages.map((p) => ({ page: p.page, text: p.text })),
        });
      }
    }

    const extraction: PolicyExtraction =
      extractDocs.length > 0 ? extractPolicyFields(extractDocs) : { ...EMPTY_EXTRACTION };
    const status = extractionStatusFor(extraction, {
      anyDocuments: insCase.documents.length > 0,
      anyReadable,
    });
    const presentKinds = [
      ...new Set(insCase.documents.map((d) => (d.kind as DocKind) ?? "otro")),
    ] as DocKind[];
    const missing = missingSummary(presentKinds, extraction);

    await db.insuranceCase.update({
      where: { requestId },
      data: {
        insurerName: extraction.insurerName,
        policyNumber: extraction.policyNumber,
        validFrom: extraction.validFrom ? new Date(extraction.validFrom) : null,
        validTo: extraction.validTo ? new Date(extraction.validTo) : null,
        extraction: extraction as unknown as Prisma.InputJsonValue,
        extractionStatus: status,
        missingDocsNote: missing.length > 0 ? missing.join(" · ") : null,
      },
    });
    log.info("insurance analysis done", { requestId, status, docs: insCase.documents.length });
    return ok({ status });
  },

  /** Full case view. `withUrls` adds signed download URLs (admin only). */
  async getCase(requestId: string, opts: { withUrls?: boolean } = {}) {
    const insCase = await db.insuranceCase.findUnique({
      where: { requestId },
      include: {
        documents: { where: { deletedAt: null }, orderBy: { createdAt: "asc" } },
      },
    });
    if (!insCase) return null;

    const parsed = policyExtractionSchema.safeParse(insCase.extraction);
    const storage = getAdapters().storage;

    return {
      id: insCase.id,
      consentGiven: insCase.consentGiven,
      extractionStatus: insCase.extractionStatus,
      insurerName: insCase.insurerName,
      policyNumber: insCase.policyNumber,
      validFrom: insCase.validFrom,
      validTo: insCase.validTo,
      missingDocsNote: insCase.missingDocsNote,
      extraction: parsed.success ? parsed.data : null,
      documents: await Promise.all(
        insCase.documents.map(async (d) => ({
          id: d.id,
          kind: d.kind as DocKind,
          kindLabel: DOC_KIND_LABEL[(d.kind as DocKind) ?? "otro"],
          contentType: d.contentType,
          byteSize: d.byteSize,
          ocrUsed: d.ocrUsed,
          pageCount: d.pageCount,
          url: opts.withUrls ? await storage.getSignedUrl(d.storageKey, SIGNED_URL_TTL) : null,
        })),
      ),
    };
  },

  /** Delete one document, verifying the blob is actually gone (issue #14). */
  async deleteDocument(requestId: string, docId: string): Promise<Result<null, InsuranceError>> {
    const insCase = await db.insuranceCase.findUnique({
      where: { requestId },
      select: { id: true },
    });
    if (!insCase) return err({ kind: "not_found" });
    const doc = await db.insuranceDocument.findFirst({
      where: { id: docId, caseId: insCase.id, deletedAt: null },
    });
    if (!doc) return err({ kind: "not_found" });

    const storage = getAdapters().storage;
    await storage.delete(doc.storageKey);
    if (await storage.exists(doc.storageKey)) return err({ kind: "delete_unverified" });

    await db.insuranceDocument.update({ where: { id: docId }, data: { deletedAt: new Date() } });
    log.info("insurance document deleted", { requestId, docId });
    return ok(null);
  },

  /**
   * OCR pages across every document of the case, for the coverage analysis
   * (issue #15). Deterministic with the mock OCR. `document` is the readable
   * kind label so references in the draft are human-legible.
   */
  async getPolicyPages(
    requestId: string,
  ): Promise<{ document: string; page: number; text: string }[]> {
    const insCase = await db.insuranceCase.findUnique({
      where: { requestId },
      include: { documents: { where: { deletedAt: null } } },
    });
    if (!insCase) return [];
    const ocr = getAdapters().ocr;
    const storage = getAdapters().storage;
    const out: { document: string; page: number; text: string }[] = [];
    for (const doc of insCase.documents) {
      const data = await storage.get(doc.storageKey);
      const label = DOC_KIND_LABEL[(doc.kind as DocKind) ?? "otro"];
      const res = await ocr.extract({
        data: data ?? new Uint8Array(),
        contentType: doc.contentType,
        documentLabel: label,
      });
      for (const p of res.pages) out.push({ document: label, page: p.page, text: p.text });
    }
    return out;
  },

  /** Retention purge — every document blob + row + the case (issue #14, #17). */
  async purge(requestId: string): Promise<number> {
    const insCase = await db.insuranceCase.findUnique({
      where: { requestId },
      select: { id: true },
    });
    if (!insCase) return 0;
    const removed = await getAdapters().storage.deleteByPrefix(`insurance/${insCase.id}/`);
    await db.insuranceCase.delete({ where: { requestId } });
    log.info("insurance case purged", { requestId, blobs: removed });
    return 1;
  },
};

export type InsuranceService = typeof insuranceService;
