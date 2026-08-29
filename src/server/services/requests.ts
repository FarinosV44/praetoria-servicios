import "server-only";
import { db } from "@/lib/db";
import { newRequestReference } from "@/lib/id";
import { log } from "@/lib/logging";
import { checkCoverage } from "@/config/coverage";
import { normalizeSpanishPhone } from "@/lib/phone";
import { LIMITS } from "@/config/limits";
import { err, ok, type Result } from "@/lib/result";
import {
  type ActorType,
  type RequestStatus,
  validateTransition,
} from "@/domain/requests/state-machine";
import type {
  ContactInput,
  CreateDraftInput,
  DescribeProblemInput,
} from "@/domain/requests/schema";
import type { Prisma, Request } from "@prisma/client";

/**
 * RequestService — the persistence layer for Solicitudes (issue #9).
 * Transitions go through the state machine; each applied transition writes an
 * immutable StatusEvent in the same transaction (author + moment + reason).
 */

export type TransitionInput = {
  requestId: string;
  to: RequestStatus;
  actor: ActorType;
  actorId?: string;
  reason?: string;
};

export type ServiceError =
  | { kind: "not_found" }
  | { kind: "invalid_transition"; from: RequestStatus; to: RequestStatus }
  | { kind: "forbidden_actor"; from: RequestStatus; to: RequestStatus; actor: ActorType }
  | { kind: "reason_required"; from: RequestStatus; to: RequestStatus };

const REFERENCE_RETRIES = 5;

async function createUniqueReference(): Promise<string> {
  for (let i = 0; i < REFERENCE_RETRIES; i++) {
    const reference = newRequestReference();
    const clash = await db.request.findUnique({ where: { reference }, select: { id: true } });
    if (!clash) return reference;
  }
  throw new Error("Could not allocate a unique request reference");
}

export const requestService = {
  async createDraft(input: CreateDraftInput): Promise<Request> {
    const reference = await createUniqueReference();
    const expiresAt = new Date(Date.now() + LIMITS.draft.expiryDays * 24 * 3600_000);

    return db.request.create({
      data: {
        reference,
        status: "BORRADOR",
        trade: input.trade && input.trade !== "no-se" ? input.trade : null,
        clientChoseUnsure: input.clientChoseUnsure || input.trade === "no-se",
        expiresAt,
        statusHistory: {
          create: { to: "BORRADOR", actorType: "SYSTEM", reason: "draft created" },
        },
      },
    });
  },

  getById(id: string) {
    return db.request.findUnique({
      where: { id },
      include: {
        contact: true,
        location: true,
        photos: { where: { deletedAt: null }, orderBy: { position: "asc" } },
        analyses: { orderBy: { version: "asc" } },
        quotes: { orderBy: { version: "asc" } },
        consents: true,
        statusHistory: { orderBy: { createdAt: "asc" } },
        insurance: true,
      },
    });
  },

  getByReference(reference: string) {
    return db.request
      .findUnique({ where: { reference } })
      .then((r) => (r ? this.getById(r.id) : null));
  },

  async describeProblem(
    requestId: string,
    input: DescribeProblemInput,
  ): Promise<Result<Request, ServiceError>> {
    const current = await db.request.findUnique({ where: { id: requestId } });
    if (!current) return err({ kind: "not_found" });

    const coverage = checkCoverage({
      municipality: input.municipality,
      postalCode: input.postalCode,
    });

    const updated = await db.request.update({
      where: { id: requestId },
      data: {
        problemText: input.problemText,
        municipality: input.municipality,
        postalCode: input.postalCode,
        withinCoverage: coverage.covered,
        location: {
          upsert: {
            create: { municipality: input.municipality, postalCode: input.postalCode },
            update: { municipality: input.municipality, postalCode: input.postalCode },
          },
        },
      },
    });
    return ok(updated);
  },

  async attachContact(
    requestId: string,
    input: ContactInput,
  ): Promise<Result<Request, ServiceError>> {
    const current = await db.request.findUnique({ where: { id: requestId } });
    if (!current) return err({ kind: "not_found" });

    const phone = input.phone ? normalizeSpanishPhone(input.phone) : null;
    const normalizedPhone = phone && phone.ok ? phone.e164 : input.phone || null;
    const email = input.email || null;

    const consentRows: Prisma.ConsentCreateWithoutRequestInput[] = [
      { type: "REQUEST_HANDLING", granted: true, textVersion: input.consent.textVersion },
      {
        type: "OPERATIONAL_COMMS",
        granted: input.consent.operationalComms,
        textVersion: input.consent.textVersion,
      },
      {
        type: "MARKETING",
        granted: input.consent.marketing,
        textVersion: input.consent.textVersion,
      },
    ];

    const updated = await db.$transaction(async (tx) => {
      await tx.consent.deleteMany({ where: { requestId } });
      return tx.request.update({
        where: { id: requestId },
        data: {
          contact: {
            upsert: {
              create: {
                name: input.name,
                phone: normalizedPhone,
                email,
                preferredChannel: input.preferredChannel,
                availabilityNote: input.availabilityNote,
              },
              update: {
                name: input.name,
                phone: normalizedPhone,
                email,
                preferredChannel: input.preferredChannel,
                availabilityNote: input.availabilityNote,
              },
            },
          },
          consents: { create: consentRows },
        },
      });
    });
    return ok(updated);
  },

  async applyTransition(input: TransitionInput): Promise<Result<Request, ServiceError>> {
    const current = await db.request.findUnique({
      where: { id: input.requestId },
      select: { id: true, status: true },
    });
    if (!current) return err({ kind: "not_found" });

    const from = current.status as RequestStatus;
    const check = validateTransition({
      from,
      to: input.to,
      actor: input.actor,
      reason: input.reason,
    });
    if (!check.ok) return err(check.error as ServiceError);

    const updated = await db.$transaction(async (tx) => {
      const r = await tx.request.update({
        where: { id: input.requestId },
        data: {
          status: input.to,
          ...(input.to === "PENDIENTE_ANALISIS" && from === "BORRADOR"
            ? { submittedAt: new Date() }
            : {}),
          ...(input.to === "CERRADA" ? { closedAt: new Date() } : {}),
        },
      });
      await tx.statusEvent.create({
        data: {
          requestId: input.requestId,
          from,
          to: input.to,
          actorType: input.actor,
          actorId: input.actorId ?? null,
          reason: input.reason ?? null,
        },
      });
      return r;
    });

    log.info("request transition", {
      requestId: input.requestId,
      from,
      to: input.to,
      actor: input.actor,
    });
    return ok(updated);
  },

  /** Raise urgency from the assistant's safety triage (issue #5). */
  async setUrgencyFromTriage(requestId: string, riskKeys: string[]): Promise<void> {
    if (riskKeys.length === 0) return;
    const emergency = riskKeys.some((k) => ["gas", "fuego", "estructural"].includes(k));
    await db.request.update({
      where: { id: requestId },
      data: { urgency: emergency ? "EMERGENCIA" : "ALTA" },
    });
  },

  /** Client submits the assistant. Idempotent: a second call is a no-op. */
  async submit(requestId: string): Promise<Result<Request, ServiceError>> {
    const current = await db.request.findUnique({
      where: { id: requestId },
      select: { status: true },
    });
    if (!current) return err({ kind: "not_found" });
    if (current.status !== "BORRADOR") {
      const r = await db.request.findUnique({ where: { id: requestId } });
      return r ? ok(r) : err({ kind: "not_found" });
    }
    return this.applyTransition({
      requestId,
      to: "PENDIENTE_ANALISIS",
      actor: "CLIENT",
    });
  },

  /** Retention: delete stale, never-submitted drafts + their photo blobs (issue #9, #6, #17). */
  async deleteExpiredDrafts(now: Date = new Date()): Promise<number> {
    const cutoff = new Date(now.getTime() - LIMITS.draft.expiryDays * 24 * 3600_000);
    const stale = await db.request.findMany({
      where: { status: "BORRADOR", submittedAt: null, updatedAt: { lt: cutoff } },
      select: { id: true },
    });
    if (stale.length === 0) return 0;

    const { photoService } = await import("./photos");
    for (const { id } of stale) await photoService.deleteAllForRequest(id);

    const { count } = await db.request.deleteMany({
      where: { id: { in: stale.map((s) => s.id) } },
    });
    if (count > 0) log.info("expired drafts deleted", { count });
    return count;
  },
};

export type RequestService = typeof requestService;
