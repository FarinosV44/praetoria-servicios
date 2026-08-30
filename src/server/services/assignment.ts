import "server-only";
import { db } from "@/lib/db";
import { log } from "@/lib/logging";
import { getAdapters } from "@/server/container";
import { err, ok, type Result } from "@/lib/result";
import {
  checkAssignment,
  type AssignableProfessional,
  type AssignmentBlock,
} from "@/domain/professionals/assignment";
import { buildClientProfessionalView } from "@/domain/professionals/client-view";

/**
 * Request ↔ professional assignment (issue #22). The single place that decides
 * whether a professional may take a request; the admin panel never bypasses it.
 * A substitution ends the previous assignment (row kept) and creates a new one.
 */

export type AssignmentError =
  | { kind: "not_found" }
  | { kind: "incompatible"; reasons: AssignmentBlock[] };

async function toAssignable(professionalId: string): Promise<AssignableProfessional | null> {
  const p = await db.professional.findUnique({
    where: { id: professionalId },
    select: {
      status: true,
      trades: true,
      municipalities: true,
      credentials: { select: { trade: true, expiresAt: true } },
    },
  });
  if (!p) return null;
  return {
    status: p.status,
    trades: p.trades,
    municipalities: p.municipalities,
    credentials: p.credentials.map((c) => ({ trade: c.trade, expiresAt: c.expiresAt })),
  };
}

export const assignmentService = {
  /** Preview the compatibility check without writing anything (for the admin UI). */
  async check(
    requestId: string,
    professionalId: string,
  ): Promise<Result<{ ok: true }, AssignmentError>> {
    const [request, pro] = await Promise.all([
      db.request.findUnique({
        where: { id: requestId },
        select: { trade: true, municipality: true, postalCode: true },
      }),
      toAssignable(professionalId),
    ]);
    if (!request || !pro) return err({ kind: "not_found" });
    const result = checkAssignment(pro, request);
    return result.ok ? ok({ ok: true }) : err({ kind: "incompatible", reasons: result.reasons });
  },

  async assign(input: {
    requestId: string;
    professionalId: string;
    adminId: string;
    reason?: string;
  }): Promise<Result<{ assignmentId: string }, AssignmentError>> {
    const [request, pro] = await Promise.all([
      db.request.findUnique({
        where: { id: input.requestId },
        select: { id: true, trade: true, municipality: true, postalCode: true },
      }),
      toAssignable(input.professionalId),
    ]);
    if (!request || !pro) return err({ kind: "not_found" });

    const result = checkAssignment(pro, request);
    if (!result.ok) return err({ kind: "incompatible", reasons: result.reasons });

    const now = new Date();
    const created = await db.$transaction(async (tx) => {
      // Substitution: end the current active assignment, keep the row.
      await tx.assignment.updateMany({
        where: { requestId: input.requestId, active: true },
        data: {
          active: false,
          endedAt: now,
          endedReason: input.reason ?? "sustitución de profesional",
        },
      });
      return tx.assignment.create({
        data: {
          requestId: input.requestId,
          professionalId: input.professionalId,
          assignedByAdminId: input.adminId,
        },
        select: { id: true },
      });
    });

    await db.adminActionLog.create({
      data: {
        adminId: input.adminId,
        requestId: input.requestId,
        professionalId: input.professionalId,
        action: "request_assigned",
        detail: { assignmentId: created.id, reason: input.reason },
      },
    });
    log.info("request assigned", { requestId: input.requestId, professionalId: input.professionalId });
    return ok({ assignmentId: created.id });
  },

  async activeAssignment(requestId: string) {
    return db.assignment.findFirst({
      where: { requestId, active: true },
      include: {
        professional: {
          select: {
            displayName: true,
            trades: true,
            photoConsent: true,
            photoStorageKey: true,
            verifications: { select: { kind: true, passed: true } },
          },
        },
      },
    });
  },

  /** The minimal, honest view the client sees before the visit (D6). */
  async clientProfessionalView(requestId: string) {
    const a = await this.activeAssignment(requestId);
    if (!a) return null;
    let photoUrl: string | null = null;
    if (a.professional.photoConsent && a.professional.photoStorageKey) {
      photoUrl = await getAdapters().storage.getSignedUrl(a.professional.photoStorageKey, 900);
    }
    return buildClientProfessionalView({
      displayName: a.professional.displayName,
      trades: a.professional.trades,
      verifications: a.professional.verifications,
      photoConsent: a.professional.photoConsent,
      photoUrl,
    });
  },
};
