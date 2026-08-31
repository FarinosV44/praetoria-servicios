import "server-only";
import type { Prisma, ProfessionalApplicationStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { log } from "@/lib/logging";
import { err, ok, type Result } from "@/lib/result";
import {
  applicationFingerprint,
  isSpamApplication,
  normaliseApplication,
  validateApplicationTransition,
  type ApplicationStatus,
  type RawApplication,
} from "@/domain/professionals/application";
import { professionalService } from "./professionals";

/**
 * Public professional applications (issue #20). First-contact intake, separate
 * from the verified `Professional` network. No professional ever gets system
 * access here — an admin reads the inbox and, if suitable, converts an APROBADA
 * application into a `Professional` in `CANDIDATO`.
 */

export type ApplicationError =
  | { kind: "not_found" }
  | { kind: "invalid" }
  | { kind: "transition"; error: string }
  | { kind: "already_converted" }
  | { kind: "not_approved" };

const DEDUP_WINDOW_DAYS = 30;

export const applicationService = {
  /**
   * Accept a public submission. A honeypot/spam hit or a duplicate within the
   * dedup window is a SILENT no-op that still returns success — no enumeration,
   * no signal to a bot.
   */
  async submit(raw: RawApplication): Promise<Result<{ received: true }, ApplicationError>> {
    const n = normaliseApplication(raw);
    if (!n.name || !n.email || n.trades.length === 0) return err({ kind: "invalid" });

    if (isSpamApplication(raw)) {
      log.info("professional application rejected (spam)", { email: "[redacted]" });
      return ok({ received: true });
    }

    const fingerprint = applicationFingerprint(n);
    const since = new Date(Date.now() - DEDUP_WINDOW_DAYS * 86_400_000);
    const dup = await db.professionalApplication.findFirst({
      where: { fingerprint, createdAt: { gte: since } },
      select: { id: true },
    });
    if (dup) {
      log.info("professional application deduped", { fingerprint });
      return ok({ received: true });
    }

    await db.professionalApplication.create({
      data: {
        name: n.name,
        isCompany: n.isCompany,
        trades: n.trades,
        municipalities: n.municipalities,
        phone: n.phone,
        email: n.email,
        availabilityNote: n.availabilityNote || null,
        experienceNote: n.experienceNote || null,
        observations: n.observations || null,
        consentAt: new Date(),
        fingerprint,
      },
    });
    log.info("professional application received", { trades: n.trades });
    return ok({ received: true });
  },

  async listForAdmin(status?: ProfessionalApplicationStatus) {
    return db.professionalApplication.findMany({
      where: { status },
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    });
  },

  async get(id: string) {
    return db.professionalApplication.findUnique({ where: { id } });
  },

  async setStatus(
    id: string,
    to: ApplicationStatus,
    opts: { reason?: string; adminId: string },
  ): Promise<Result<null, ApplicationError>> {
    const app = await db.professionalApplication.findUnique({ where: { id } });
    if (!app) return err({ kind: "not_found" });

    const check = validateApplicationTransition({
      from: app.status as ApplicationStatus,
      to,
      reason: opts.reason ?? null,
    });
    if (!check.ok) return err({ kind: "transition", error: check.error });

    await db.professionalApplication.update({
      where: { id },
      data: { status: to as ProfessionalApplicationStatus, reviewReason: opts.reason?.trim() ?? app.reviewReason },
    });
    await db.adminActionLog.create({
      data: {
        adminId: opts.adminId,
        action: "application_status",
        detail: { applicationId: id, from: app.status, to } as Prisma.InputJsonValue,
      },
    });
    log.info("application status", { id, from: app.status, to });
    return ok(null);
  },

  async addNote(id: string, note: string, adminId: string): Promise<Result<null, ApplicationError>> {
    const app = await db.professionalApplication.findUnique({ where: { id }, select: { internalNotes: true } });
    if (!app) return err({ kind: "not_found" });
    const stamp = new Date().toISOString().slice(0, 16).replace("T", " ");
    const line = `[${stamp}] ${note.trim()}`;
    await db.professionalApplication.update({
      where: { id },
      data: { internalNotes: app.internalNotes ? `${app.internalNotes}\n${line}` : line },
    });
    log.info("application note added", { id, adminId });
    return ok(null);
  },

  /** Convert an APROBADA application into a network member (issue #20 / #22 bridge). */
  async convertToProfessional(
    id: string,
    adminId: string,
  ): Promise<Result<{ professionalId: string; reference: string }, ApplicationError>> {
    const app = await db.professionalApplication.findUnique({ where: { id } });
    if (!app) return err({ kind: "not_found" });
    if (app.professionalId) return err({ kind: "already_converted" });
    if (app.status !== "APROBADA") return err({ kind: "not_approved" });

    const created = await professionalService.create(
      {
        legalName: app.name,
        displayName: app.name,
        phone: app.phone,
        email: app.email,
        trades: app.trades,
        municipalities: app.municipalities,
      },
      adminId,
    );
    if (!created.ok) return err({ kind: "invalid" });

    await db.professionalApplication.update({
      where: { id },
      data: { professionalId: created.value.id },
    });
    await db.adminActionLog.create({
      data: {
        adminId,
        action: "application_converted",
        detail: { applicationId: id, professionalReference: created.value.reference } as Prisma.InputJsonValue,
      },
    });
    return ok({ professionalId: created.value.id, reference: created.value.reference });
  },
};
