import "server-only";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { log } from "@/lib/logging";
import { getAdapters } from "@/server/container";
import { newProfessionalReference, newShortId } from "@/lib/id";
import { LIMITS } from "@/config/limits";
import { err, ok, type Result } from "@/lib/result";
import {
  validateProfessionalTransition,
  type ProfessionalStatus,
} from "@/domain/professionals/state-machine";
import type {
  ProfessionalCreateInput,
  ProfessionalUpdateInput,
  VerificationInput,
  CredentialInput,
} from "@/domain/professionals/schema";

/**
 * Professional network (issue #22). Every state-changing method records an
 * AdminActionLog row (with `professionalId`). Documents are private blobs.
 * Suspension never deletes anything.
 */

export type ProfessionalError =
  | { kind: "not_found" }
  | { kind: "invalid_transition"; from: ProfessionalStatus; to: ProfessionalStatus }
  | { kind: "reason_required" }
  | { kind: "rejected"; message: string };

const DOC_EXT: Record<string, string> = {
  "application/pdf": "pdf",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

async function logAction(
  adminId: string,
  action: string,
  professionalId: string,
  detail?: object,
) {
  await db.adminActionLog.create({
    data: {
      adminId,
      action,
      professionalId,
      detail: detail as Prisma.InputJsonValue | undefined,
    },
  });
}

export const professionalService = {
  async create(
    input: ProfessionalCreateInput,
    adminId: string,
  ): Promise<Result<{ id: string; reference: string }, ProfessionalError>> {
    const row = await db.professional.create({
      data: {
        reference: newProfessionalReference(),
        legalName: input.legalName,
        displayName: input.displayName,
        taxId: input.taxId || null,
        phone: input.phone || null,
        email: input.email || null,
        trades: input.trades,
        municipalities: input.municipalities,
      },
      select: { id: true, reference: true },
    });
    await logAction(adminId, "professional_created", row.id, { reference: row.reference });
    log.info("professional created", { reference: row.reference });
    return ok(row);
  },

  async list(filters: { status?: ProfessionalStatus; trade?: string; search?: string } = {}) {
    const where: Prisma.ProfessionalWhereInput = { status: filters.status };
    if (filters.trade) where.trades = { has: filters.trade };
    if (filters.search) {
      const s = filters.search.trim();
      where.OR = [
        { reference: { contains: s, mode: "insensitive" } },
        { legalName: { contains: s, mode: "insensitive" } },
        { displayName: { contains: s, mode: "insensitive" } },
      ];
    }
    return db.professional.findMany({
      where,
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      select: {
        id: true,
        reference: true,
        status: true,
        displayName: true,
        trades: true,
        municipalities: true,
        rcExpiresAt: true,
        _count: { select: { assignments: { where: { active: true } } } },
      },
    });
  },

  async getById(id: string) {
    return db.professional.findUnique({
      where: { id },
      include: {
        credentials: { orderBy: { createdAt: "desc" } },
        verifications: { orderBy: { checkedAt: "desc" } },
        documents: { where: { deletedAt: null }, orderBy: { createdAt: "desc" } },
        assignments: { orderBy: { assignedAt: "desc" }, take: 20 },
      },
    });
  },

  async update(
    id: string,
    patch: ProfessionalUpdateInput,
    adminId: string,
  ): Promise<Result<{ id: string }, ProfessionalError>> {
    const current = await db.professional.findUnique({ where: { id }, select: { id: true } });
    if (!current) return err({ kind: "not_found" });

    const data: Prisma.ProfessionalUpdateInput = {};
    if (patch.legalName !== undefined) data.legalName = patch.legalName;
    if (patch.displayName !== undefined) data.displayName = patch.displayName;
    if (patch.taxId !== undefined) data.taxId = patch.taxId || null;
    if (patch.phone !== undefined) data.phone = patch.phone || null;
    if (patch.email !== undefined) data.email = patch.email || null;
    if (patch.trades !== undefined) data.trades = patch.trades;
    if (patch.municipalities !== undefined) data.municipalities = patch.municipalities;
    if (patch.availabilityNote !== undefined) data.availabilityNote = patch.availabilityNote;
    if (patch.experienceNote !== undefined) data.experienceNote = patch.experienceNote;
    if (patch.referencesNote !== undefined) data.referencesNote = patch.referencesNote;
    if (patch.rcInsurer !== undefined) data.rcInsurer = patch.rcInsurer;
    if (patch.rcPolicyNumber !== undefined) data.rcPolicyNumber = patch.rcPolicyNumber;
    if (patch.rcExpiresAt !== undefined) data.rcExpiresAt = patch.rcExpiresAt;
    if (patch.bankIbanLast4 !== undefined) data.bankIbanLast4 = patch.bankIbanLast4 || null;
    if (patch.internalRating !== undefined) data.internalRating = patch.internalRating;

    await db.professional.update({ where: { id }, data });
    await logAction(adminId, "professional_updated", id, { fields: Object.keys(data) });
    return ok({ id });
  },

  async transition(
    id: string,
    to: ProfessionalStatus,
    opts: { adminId: string; reason?: string },
  ): Promise<Result<{ status: ProfessionalStatus }, ProfessionalError>> {
    const current = await db.professional.findUnique({
      where: { id },
      select: { id: true, status: true },
    });
    if (!current) return err({ kind: "not_found" });

    const check = validateProfessionalTransition({ from: current.status, to, reason: opts.reason });
    if (!check.ok) {
      if (check.error.kind === "reason_required") return err({ kind: "reason_required" });
      return err({ kind: "invalid_transition", from: current.status, to });
    }

    const data: Prisma.ProfessionalUpdateInput = { status: to };
    if (to === "APROBADO") data.approvedAt = new Date();
    if (to === "SUSPENDIDO") data.suspendedAt = new Date();

    await db.$transaction([
      db.professional.update({ where: { id }, data }),
      // Suspension is immediate: end every active assignment but KEEP the rows.
      ...(to === "SUSPENDIDO"
        ? [
            db.assignment.updateMany({
              where: { professionalId: id, active: true },
              data: { active: false, endedAt: new Date(), endedReason: "profesional suspendido" },
            }),
          ]
        : []),
    ]);
    await logAction(opts.adminId, "professional_transition", id, {
      from: current.status,
      to,
      reason: opts.reason,
    });
    log.info("professional transition", { professionalId: id, from: current.status, to });
    return ok({ status: to });
  },

  async recordVerification(
    id: string,
    input: VerificationInput,
    adminId: string,
  ): Promise<Result<{ id: string }, ProfessionalError>> {
    const current = await db.professional.findUnique({ where: { id }, select: { id: true } });
    if (!current) return err({ kind: "not_found" });
    const row = await db.professionalVerification.create({
      data: {
        professionalId: id,
        kind: input.kind,
        passed: input.passed,
        note: input.note,
        expiresAt: input.expiresAt ?? null,
        checkedByAdminId: adminId,
      },
      select: { id: true },
    });
    await logAction(adminId, "professional_verification", id, {
      kind: input.kind,
      passed: input.passed,
    });
    return ok(row);
  },

  async addCredential(
    id: string,
    input: CredentialInput,
    adminId: string,
  ): Promise<Result<{ id: string }, ProfessionalError>> {
    const current = await db.professional.findUnique({ where: { id }, select: { id: true } });
    if (!current) return err({ kind: "not_found" });
    const row = await db.professionalCredential.create({
      data: {
        professionalId: id,
        trade: input.trade,
        label: input.label,
        reference: input.reference || null,
        issuedAt: input.issuedAt ?? null,
        expiresAt: input.expiresAt ?? null,
      },
      select: { id: true },
    });
    await logAction(adminId, "professional_credential_added", id, { trade: input.trade });
    return ok(row);
  },

  async addDocument(
    id: string,
    input: { bytes: Uint8Array; size: number; contentType: string; kind: string; expiresAt?: Date | null },
    adminId: string,
  ): Promise<Result<{ id: string }, ProfessionalError>> {
    const current = await db.professional.findUnique({ where: { id }, select: { id: true } });
    if (!current) return err({ kind: "not_found" });

    if (!(LIMITS.professionals.acceptedDocTypes as readonly string[]).includes(input.contentType)) {
      return err({ kind: "rejected", message: "Tipo de archivo no admitido" });
    }
    if (input.size > LIMITS.professionals.maxDocBytes) {
      return err({ kind: "rejected", message: "El archivo supera el tamaño máximo" });
    }
    const count = await db.professionalDocument.count({
      where: { professionalId: id, deletedAt: null },
    });
    if (count >= LIMITS.professionals.maxDocs) {
      return err({ kind: "rejected", message: "Demasiados documentos" });
    }

    const docId = newShortId();
    const key = `professional/${id}/${docId}.${DOC_EXT[input.contentType] ?? "bin"}`;
    await getAdapters().storage.put({
      key,
      data: input.bytes,
      contentType: input.contentType,
      sensitive: true,
    });
    const row = await db.professionalDocument.create({
      data: {
        professionalId: id,
        kind: input.kind,
        storageKey: key,
        contentType: input.contentType,
        byteSize: input.size,
        expiresAt: input.expiresAt ?? null,
      },
      select: { id: true },
    });
    await logAction(adminId, "professional_document_added", id, {
      kind: input.kind,
      bytes: input.size,
    });
    return ok(row);
  },

  async deleteDocument(docId: string, adminId: string): Promise<Result<{ ok: true }, ProfessionalError>> {
    const doc = await db.professionalDocument.findUnique({ where: { id: docId } });
    if (!doc || doc.deletedAt) return err({ kind: "not_found" });
    await getAdapters().storage.delete(doc.storageKey);
    await db.professionalDocument.update({ where: { id: docId }, data: { deletedAt: new Date() } });
    await logAction(adminId, "professional_document_deleted", doc.professionalId, { docId });
    return ok({ ok: true });
  },

  async setPhotoConsent(
    id: string,
    consent: boolean,
    adminId: string,
  ): Promise<Result<{ ok: true }, ProfessionalError>> {
    const current = await db.professional.findUnique({ where: { id }, select: { id: true } });
    if (!current) return err({ kind: "not_found" });
    await db.professional.update({ where: { id }, data: { photoConsent: consent } });
    await logAction(adminId, "professional_photo_consent", id, { consent });
    return ok({ ok: true });
  },

  /**
   * Items nearing expiry (issue #22 alert): credentials, RC insurance policies,
   * time-boxed verifications and documents within `expiryAlertLeadDays`.
   */
  async expiringItems(now: Date = new Date()) {
    const horizon = new Date(
      now.getTime() + LIMITS.professionals.expiryAlertLeadDays * 24 * 3600_000,
    );
    const [credentials, verifications, documents, rc] = await Promise.all([
      db.professionalCredential.findMany({
        where: { expiresAt: { not: null, lte: horizon } },
        include: { professional: { select: { reference: true, displayName: true } } },
        orderBy: { expiresAt: "asc" },
      }),
      db.professionalVerification.findMany({
        where: { expiresAt: { not: null, lte: horizon } },
        include: { professional: { select: { reference: true, displayName: true } } },
        orderBy: { expiresAt: "asc" },
      }),
      db.professionalDocument.findMany({
        where: { deletedAt: null, expiresAt: { not: null, lte: horizon } },
        include: { professional: { select: { reference: true, displayName: true } } },
        orderBy: { expiresAt: "asc" },
      }),
      db.professional.findMany({
        where: { rcExpiresAt: { not: null, lte: horizon }, status: { not: "RECHAZADO" } },
        select: { id: true, reference: true, displayName: true, rcExpiresAt: true },
        orderBy: { rcExpiresAt: "asc" },
      }),
    ]);
    return { credentials, verifications, documents, rc, horizon };
  },

  /**
   * Retention (issue #22): purge documents of professionals rejected more than
   * `docRetentionDaysAfterReject` ago. The professional row + history stay.
   */
  async purgeRejectedDocuments(now: Date = new Date()): Promise<number> {
    const cutoff = new Date(
      now.getTime() - LIMITS.professionals.docRetentionDaysAfterReject * 24 * 3600_000,
    );
    const stale = await db.professional.findMany({
      where: { status: "RECHAZADO", updatedAt: { lt: cutoff } },
      select: { id: true, documents: { where: { deletedAt: null }, select: { id: true, storageKey: true } } },
    });
    let removed = 0;
    for (const p of stale) {
      for (const doc of p.documents) {
        await getAdapters().storage.delete(doc.storageKey);
        await db.professionalDocument.update({
          where: { id: doc.id },
          data: { deletedAt: now },
        });
        removed++;
      }
    }
    if (removed) log.info("professional documents purged", { professionals: stale.length, removed });
    return removed;
  },
};
