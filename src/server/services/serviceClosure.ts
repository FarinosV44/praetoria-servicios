import "server-only";
import type { Prisma, ActorType, WarrantyKind } from "@prisma/client";
import { db } from "@/lib/db";
import { log } from "@/lib/logging";
import { newIncidenceReference } from "@/lib/id";
import { SERVICE_CLOSURE } from "@/config/service-closure";
import { findTrade } from "@/config/trades";
import { formatEuros, type Cents } from "@/lib/money";
import { err, ok, type Result } from "@/lib/result";
import {
  validateIncidenceTransition,
  firstResponseDueAt,
  isOverdue,
  type IncidenceStatus,
} from "@/domain/service-closure/incidence";

/**
 * Documented service closure + incidences (issue #23).
 *
 * - An incidence is never resolved/dismissed without a reason AND evidence
 *   (enforced by `validateIncidenceTransition`).
 * - Closure produces a downloadable expediente with the accepted quote version
 *   and any approved extras (economic traceability).
 */

export type ClosureError =
  | { kind: "not_found" }
  | { kind: "no_completion" }
  | { kind: "not_acepted" }
  | { kind: "invalid_transition" }
  | { kind: "reason_required" }
  | { kind: "evidence_required" };

interface CompletionInput {
  completedAt: Date;
  workDone: string;
  materialsNote?: string | null;
  finalPhotosNote?: string | null;
  executedByProfessionalId?: string | null;
  approvedExtrasNote?: string | null;
  warrantyKind?: WarrantyKind | null;
  warrantyText?: string | null;
  warrantyExclusions?: string | null;
  warrantyResponsible?: string | null;
}

async function logAction(adminId: string, action: string, requestId: string, detail?: object) {
  await db.adminActionLog.create({
    data: { adminId, action, requestId, detail: detail as Prisma.InputJsonValue | undefined },
  });
}

export const serviceClosureService = {
  /** Admin records that the work is done (issue #23 flow step 1–2). */
  async recordCompletion(
    requestId: string,
    input: CompletionInput,
    adminId: string,
  ): Promise<Result<{ id: string }, ClosureError>> {
    const request = await db.request.findUnique({
      where: { id: requestId },
      select: {
        id: true,
        quotes: { where: { status: "ACEPTADO" }, select: { version: true }, take: 1 },
        assignments: {
          where: { active: true },
          select: { professionalId: true },
          take: 1,
        },
      },
    });
    if (!request) return err({ kind: "not_found" });

    const acceptedQuoteVersion = request.quotes[0]?.version ?? null;
    const executedByProfessionalId =
      input.executedByProfessionalId ?? request.assignments[0]?.professionalId ?? null;

    const data = {
      completedAt: input.completedAt,
      workDone: input.workDone,
      materialsNote: input.materialsNote ?? null,
      finalPhotosNote: input.finalPhotosNote ?? null,
      executedByProfessionalId,
      acceptedQuoteVersion,
      approvedExtrasNote: input.approvedExtrasNote ?? null,
      warrantyKind: input.warrantyKind ?? null,
      warrantyText: input.warrantyText ?? null,
      warrantyExclusions: input.warrantyExclusions ?? null,
      warrantyResponsible: input.warrantyResponsible ?? null,
      recordedByAdminId: adminId,
    };
    const row = await db.serviceCompletion.upsert({
      where: { requestId },
      create: { requestId, ...data },
      update: data,
      select: { id: true },
    });
    await logAction(adminId, "service_completion_recorded", requestId, {
      completedAt: input.completedAt.toISOString(),
    });
    log.info("service completion recorded", { requestId });
    return ok(row);
  },

  /**
   * The client confirms the result (issue #23 flow step 3). Moves the request to
   * CERRADA. Requires a recorded completion.
   */
  async confirmByClient(requestId: string): Promise<Result<null, ClosureError>> {
    const request = await db.request.findUnique({
      where: { id: requestId },
      select: { id: true, status: true, completion: { select: { id: true } } },
    });
    if (!request) return err({ kind: "not_found" });
    if (!request.completion) return err({ kind: "no_completion" });
    if (request.status !== "ACEPTADA") return err({ kind: "not_acepted" });

    await db.$transaction([
      db.serviceCompletion.update({
        where: { requestId },
        data: { clientConfirmedAt: new Date() },
      }),
      db.request.update({ where: { id: requestId }, data: { status: "CERRADA", closedAt: new Date() } }),
      db.statusEvent.create({
        data: {
          requestId,
          from: "ACEPTADA",
          to: "CERRADA",
          actorType: "CLIENT",
          reason: "El cliente confirma que el trabajo está correcto.",
        },
      }),
    ]);
    log.info("service confirmed by client", { requestId });
    return ok(null);
  },

  /** Open an incidence — client (via the signed link) or admin (issue #23 step 5). */
  async openIncidence(input: {
    requestId: string;
    description: string;
    openedBy: ActorType;
  }): Promise<Result<{ id: string; reference: string }, ClosureError>> {
    const request = await db.request.findUnique({
      where: { id: input.requestId },
      select: { id: true },
    });
    if (!request) return err({ kind: "not_found" });

    const now = new Date();
    const row = await db.incidence.create({
      data: {
        reference: newIncidenceReference(),
        requestId: input.requestId,
        description: input.description.slice(0, 2000),
        openedBy: input.openedBy,
        status: "ABIERTA",
        firstResponseDueAt: firstResponseDueAt(now, SERVICE_CLOSURE.slaFirstResponseHours),
        events: {
          create: { actorType: input.openedBy, toStatus: "ABIERTA", note: "Incidencia abierta." },
        },
      },
      select: { id: true, reference: true },
    });
    log.info("incidence opened", { requestId: input.requestId, reference: row.reference });
    return ok(row);
  },

  /** Admin classifies + assigns (issue #23 step 5). Also records the first response. */
  async classifyIncidence(
    incidenceId: string,
    input: { kind: string; assignedToAdminId?: string },
    adminId: string,
  ): Promise<Result<null, ClosureError>> {
    const inc = await db.incidence.findUnique({
      where: { id: incidenceId },
      select: { id: true, status: true, firstRespondedAt: true, requestId: true },
    });
    if (!inc) return err({ kind: "not_found" });

    const to: IncidenceStatus = inc.status === "ABIERTA" ? "EN_CLASIFICACION" : "EN_CURSO";
    const check = validateIncidenceTransition({ from: inc.status, to });
    if (!check.ok) return err({ kind: "invalid_transition" });

    await db.$transaction([
      db.incidence.update({
        where: { id: incidenceId },
        data: {
          status: to,
          kind: input.kind,
          assignedToAdminId: input.assignedToAdminId ?? adminId,
          firstRespondedAt: inc.firstRespondedAt ?? new Date(),
        },
      }),
      db.incidenceEvent.create({
        data: {
          incidenceId,
          actorType: "ADMIN",
          actorId: adminId,
          fromStatus: inc.status,
          toStatus: to,
          note: `Clasificada como «${input.kind}».`,
        },
      }),
    ]);
    await logAction(adminId, "incidence_classified", inc.requestId, { incidenceId, kind: input.kind });
    return ok(null);
  },

  /**
   * Any incidence transition. A move to RESUELTA / DESESTIMADA requires a reason
   * AND evidence (issue #23 rule) — enforced by `validateIncidenceTransition`.
   */
  async transitionIncidence(
    incidenceId: string,
    to: IncidenceStatus,
    input: { reason?: string; evidenceNote?: string; note?: string },
    adminId: string,
  ): Promise<Result<null, ClosureError>> {
    const inc = await db.incidence.findUnique({
      where: { id: incidenceId },
      select: { id: true, status: true, requestId: true },
    });
    if (!inc) return err({ kind: "not_found" });

    const check = validateIncidenceTransition({
      from: inc.status,
      to,
      reason: input.reason,
      hasEvidence: !!input.evidenceNote?.trim(),
    });
    if (!check.ok) {
      if (check.error.kind === "reason_required") return err({ kind: "reason_required" });
      if (check.error.kind === "evidence_required") return err({ kind: "evidence_required" });
      return err({ kind: "invalid_transition" });
    }

    const closing = to === "RESUELTA" || to === "DESESTIMADA";
    await db.$transaction([
      db.incidence.update({
        where: { id: incidenceId },
        data: {
          status: to,
          ...(closing
            ? {
                closedReason: input.reason,
                evidenceNote: input.evidenceNote,
                resolutionNote: to === "RESUELTA" ? (input.note ?? input.reason) : input.note,
              }
            : {}),
        },
      }),
      db.incidenceEvent.create({
        data: {
          incidenceId,
          actorType: "ADMIN",
          actorId: adminId,
          fromStatus: inc.status,
          toStatus: to,
          note: input.note ?? input.reason,
        },
      }),
    ]);
    await logAction(adminId, "incidence_transition", inc.requestId, { incidenceId, to });
    log.info("incidence transition", { incidenceId, from: inc.status, to });
    return ok(null);
  },

  /** Open incidences with their due dates + an overdue flag (issue #23 AC). */
  async listOpenIncidences(now: Date = new Date()) {
    const rows = await db.incidence.findMany({
      where: { status: { notIn: ["RESUELTA", "DESESTIMADA"] } },
      orderBy: [{ firstResponseDueAt: "asc" }, { createdAt: "asc" }],
      include: { request: { select: { reference: true } } },
    });
    return rows.map((r) => ({
      ...r,
      overdue: r.firstResponseDueAt ? isOverdue(r.firstResponseDueAt, now) : false,
    }));
  },

  async getForRequest(requestId: string) {
    return {
      completion: await db.serviceCompletion.findUnique({ where: { requestId } }),
      incidences: await db.incidence.findMany({
        where: { requestId },
        orderBy: { createdAt: "desc" },
        include: { events: { orderBy: { createdAt: "asc" } } },
      }),
    };
  },

  /**
   * The downloadable expediente (issue #23 AC): a comprehensible record of the
   * job, the money and the incidences.
   */
  async buildExpediente(requestId: string): Promise<Result<object, ClosureError>> {
    const request = await db.request.findUnique({
      where: { id: requestId },
      include: {
        contact: { select: { name: true } },
        location: true,
        completion: true,
        quotes: { orderBy: { version: "asc" } },
        incidences: { orderBy: { createdAt: "asc" }, include: { events: true } },
        review: true,
      },
    });
    if (!request) return err({ kind: "not_found" });

    const accepted = request.quotes.find((q) => q.status === "ACEPTADO");
    const cents = (c: number | null | undefined) =>
      c == null ? null : formatEuros(c as Cents);

    return ok({
      generatedAt: new Date().toISOString(),
      solicitud: {
        referencia: request.reference,
        estado: request.status,
        oficio: findTrade(request.trade)?.label ?? request.trade,
        municipio: request.municipality,
        cliente: request.contact?.name ?? null,
      },
      presupuestoAceptado: accepted
        ? {
            version: accepted.version,
            total: cents(accepted.totalCents),
            iva: cents(accepted.taxCents),
            visita: cents(accepted.visitFeeCents),
            plazo: accepted.estimatedTimeframe,
            garantia: accepted.warrantyText,
            responsableGarantia: accepted.warrantyResponsible,
            exclusiones: accepted.exclusionsNote,
            aprobacionDeExtras: accepted.extrasApprovalNote,
          }
        : null,
      cambiosEconomicos: {
        versionesDePresupuesto: request.quotes.map((q) => ({
          version: q.version,
          estado: q.status,
          total: cents(q.totalCents),
        })),
        extrasAprobados: request.completion?.approvedExtrasNote ?? "Ninguno registrado.",
      },
      ejecucion: request.completion
        ? {
            fecha: request.completion.completedAt.toISOString(),
            trabajosRealizados: request.completion.workDone,
            materiales: request.completion.materialsNote,
            evidenciasFinales: request.completion.finalPhotosNote,
            profesional: request.completion.executedByProfessionalId,
            confirmadoPorCliente: request.completion.clientConfirmedAt?.toISOString() ?? null,
            garantia: {
              tipo: request.completion.warrantyKind,
              texto: request.completion.warrantyText,
              exclusiones: request.completion.warrantyExclusions,
              responsable: request.completion.warrantyResponsible,
            },
          }
        : null,
      incidencias: request.incidences.map((i) => ({
        referencia: i.reference,
        estado: i.status,
        abiertaPor: i.openedBy,
        clasificacion: i.kind,
        descripcion: i.description,
        motivoCierre: i.closedReason,
        evidencia: i.evidenceNote,
        resolucion: i.resolutionNote,
        cronologia: i.events.map((e) => ({
          fecha: e.createdAt.toISOString(),
          de: e.fromStatus,
          a: e.toStatus,
          nota: e.note,
        })),
      })),
      valoracion: request.review
        ? { estado: request.review.status, puntuacion: request.review.rating }
        : null,
    });
  },
};
