import "server-only";
import { db } from "@/lib/db";
import { getAdapters } from "@/server/container";
import { requestService } from "./requests";
import { analysisService } from "./analysis";
import { photoService } from "./photos";
import { communicationService } from "./communications";
import { insuranceService } from "./insurance";
import { coverageService } from "./coverage";
import { env } from "@/lib/env";
import type { Prisma, RequestStatus, Urgency } from "@prisma/client";
import { err, ok, type Result } from "@/lib/result";
import type { RequestStatus as SmStatus } from "@/domain/requests/state-machine";

/**
 * Admin operations (issue #11). Every state-changing method records an
 * AdminActionLog row with the acting admin.
 */

export interface RequestFilters {
  status?: RequestStatus;
  trade?: string;
  urgency?: Urgency;
  municipality?: string;
  search?: string;
  page?: number;
  perPage?: number;
}

const RESPONSE_DEADLINE_MS = env.RESPONSE_DEADLINE_HOURS * 3600_000;

export const adminService = {
  async logAction(adminId: string, action: string, requestId?: string, detail?: object) {
    await db.adminActionLog.create({
      data: { adminId, action, requestId, detail: detail as Prisma.InputJsonValue | undefined },
    });
  },

  async listRequests(filters: RequestFilters) {
    const page = Math.max(1, filters.page ?? 1);
    const perPage = Math.min(50, filters.perPage ?? 20);

    const where: Prisma.RequestWhereInput = {
      status: filters.status,
      trade: filters.trade,
      urgency: filters.urgency,
      municipality: filters.municipality
        ? { equals: filters.municipality, mode: "insensitive" }
        : undefined,
      NOT: { status: "BORRADOR" },
    };
    if (filters.search) {
      const s = filters.search.trim();
      where.OR = [
        { reference: { contains: s, mode: "insensitive" } },
        { contact: { name: { contains: s, mode: "insensitive" } } },
        { contact: { phone: { contains: s } } },
        { contact: { email: { contains: s, mode: "insensitive" } } },
      ];
    }

    const [total, rows] = await db.$transaction([
      db.request.count({ where }),
      db.request.findMany({
        where,
        include: { contact: { select: { name: true, phone: true, email: true } } },
        orderBy: [{ submittedAt: "desc" }, { createdAt: "desc" }],
        skip: (page - 1) * perPage,
        take: perPage,
      }),
    ]);

    const now = Date.now();
    return {
      total,
      page,
      perPage,
      rows: rows.map((r) => ({
        reference: r.reference,
        status: r.status,
        trade: r.trade,
        urgency: r.urgency,
        municipality: r.municipality,
        name: r.contact?.name ?? "—",
        submittedAt: r.submittedAt,
        nearDeadline:
          !!r.submittedAt &&
          !["ACEPTADA", "RECHAZADA", "CANCELADA", "CERRADA", "PRESUPUESTO_ENVIADO"].includes(
            r.status,
          ) &&
          now - r.submittedAt.getTime() > RESPONSE_DEADLINE_MS * 0.75,
      })),
    };
  },

  async getDetail(reference: string) {
    const request = await db.request.findUnique({ where: { reference } });
    if (!request) return null;
    const full = await requestService.getById(request.id);
    if (!full) return null;
    const photos = await photoService.list(request.id);
    const analysisHistory = await analysisService.history(request.id);
    const corrections = await db.clientCorrection.findMany({
      where: { requestId: request.id },
      orderBy: { createdAt: "asc" },
    });
    const communications = await communicationService.listForRequest(request.id);
    const insurance = await insuranceService.getCase(request.id, { withUrls: true });
    const coverage = insurance ? await coverageService.getForRequest(request.id) : null;
    return {
      request: full,
      photos,
      analysisHistory,
      corrections,
      communications,
      insurance,
      coverage,
    };
  },

  async updateClassification(
    adminId: string,
    reference: string,
    input: { trade?: string | null; urgency?: Urgency | null; internalNote?: string },
  ): Promise<Result<null, { kind: "not_found" }>> {
    const request = await db.request.findUnique({ where: { reference }, select: { id: true } });
    if (!request) return err({ kind: "not_found" });
    await db.request.update({
      where: { id: request.id },
      data: { trade: input.trade ?? undefined, urgency: input.urgency ?? undefined },
    });
    await this.logAction(adminId, "update_classification", request.id, {
      trade: input.trade,
      urgency: input.urgency,
      note: input.internalNote ? "[present]" : undefined,
    });
    return ok(null);
  },

  async changeStatus(
    adminId: string,
    reference: string,
    to: SmStatus,
    reason?: string,
  ): Promise<Result<null, { kind: string }>> {
    const request = await db.request.findUnique({ where: { reference }, select: { id: true } });
    if (!request) return err({ kind: "not_found" });
    const r = await requestService.applyTransition({
      requestId: request.id,
      to,
      actor: "ADMIN",
      actorId: adminId,
      reason,
    });
    if (!r.ok) return err({ kind: r.error.kind });
    await this.logAction(adminId, "change_status", request.id, {
      to,
      reason: reason ? "[present]" : undefined,
    });
    return ok(null);
  },

  async requestMoreInfo(
    adminId: string,
    reference: string,
    message: string,
  ): Promise<Result<null, { kind: string }>> {
    const request = await db.request.findUnique({
      where: { reference },
      select: { id: true, status: true },
    });
    if (!request) return err({ kind: "not_found" });
    const r = await requestService.applyTransition({
      requestId: request.id,
      to: "REQUIERE_INFORMACION",
      actor: "ADMIN",
      actorId: adminId,
      reason: "Solicitud de información adicional al cliente",
    });
    if (!r.ok) return err({ kind: r.error.kind });
    // `message` is admin-authored text (not client PII).
    await this.logAction(adminId, "request_more_info", request.id, {
      message: message.slice(0, 2000),
    });
    // Deliver it to the client on their chosen channel (issue #13).
    await communicationService.notify({
      requestId: request.id,
      kind: "INFO_REQUEST",
      message: message.slice(0, 2000),
    });
    return ok(null);
  },

  async kpis() {
    const [nuevas, pendientes, cerradas, todasActivas] = await db.$transaction([
      db.request.count({ where: { status: "PENDIENTE_ANALISIS" } }),
      db.request.count({
        where: {
          status: {
            in: ["PENDIENTE_ANALISIS", "REQUIERE_INFORMACION", "VALIDADA_CLIENTE", "EN_REVISION"],
          },
        },
      }),
      db.request.count({ where: { status: { in: ["CERRADA", "ACEPTADA"] } } }),
      db.request.findMany({
        where: {
          submittedAt: { not: null },
          status: {
            in: ["PENDIENTE_ANALISIS", "REQUIERE_INFORMACION", "VALIDADA_CLIENTE", "EN_REVISION"],
          },
        },
        select: { submittedAt: true },
      }),
    ]);
    const now = Date.now();
    const proximasIncumplir = todasActivas.filter(
      (r) => r.submittedAt && now - r.submittedAt.getTime() > RESPONSE_DEADLINE_MS * 0.75,
    ).length;
    return { nuevas, pendientes, proximasIncumplir, cerradas };
  },

  async signedPhotoUrl(storageKey: string) {
    return getAdapters().storage.getSignedUrl(storageKey, 60 * 10);
  },
};
