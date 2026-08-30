"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/server/auth";
import { serviceClosureService } from "@/server/services/serviceClosure";
import { reviewService } from "@/server/services/reviews";
import { INCIDENCE_STATUSES } from "@/domain/service-closure/incidence";
import { WARRANTY_KINDS } from "@/domain/service-closure/incidence";
import { err, ok, type Result } from "@/lib/result";

type A<T = null> = Promise<Result<T, { kind: string }>>;

const completionSchema = z.object({
  completedAt: z.coerce.date(),
  workDone: z.string().trim().min(5).max(4000),
  materialsNote: z.string().trim().max(2000).optional(),
  finalPhotosNote: z.string().trim().max(1000).optional(),
  executedByProfessionalId: z.string().optional(),
  approvedExtrasNote: z.string().trim().max(2000).optional(),
  warrantyKind: z.enum(WARRANTY_KINDS).optional().nullable(),
  warrantyText: z.string().trim().max(2000).optional(),
  warrantyExclusions: z.string().trim().max(2000).optional(),
  warrantyResponsible: z.string().trim().max(200).optional(),
});

export async function recordCompletionAction(
  requestId: string,
  reference: string,
  input: unknown,
): A {
  const s = await requireSession();
  const parsed = completionSchema.safeParse(input);
  if (!parsed.success) return err({ kind: "validation" });
  const r = await serviceClosureService.recordCompletion(requestId, parsed.data, s.adminId);
  if (r.ok) revalidatePath(`/admin/solicitudes/${reference}`);
  return r.ok ? ok(null) : err({ kind: r.error.kind });
}

export async function classifyIncidenceAction(incidenceId: string, input: unknown): A {
  const s = await requireSession();
  const parsed = z
    .object({ kind: z.string().trim().min(2).max(80), assignedToAdminId: z.string().optional() })
    .safeParse(input);
  if (!parsed.success) return err({ kind: "validation" });
  const r = await serviceClosureService.classifyIncidence(incidenceId, parsed.data, s.adminId);
  if (r.ok) revalidatePath("/admin/incidencias");
  return r.ok ? ok(null) : err({ kind: r.error.kind });
}

export async function transitionIncidenceAction(incidenceId: string, input: unknown): A {
  const s = await requireSession();
  const parsed = z
    .object({
      to: z.enum(INCIDENCE_STATUSES),
      reason: z.string().trim().max(1000).optional(),
      evidenceNote: z.string().trim().max(1000).optional(),
      note: z.string().trim().max(1000).optional(),
    })
    .safeParse(input);
  if (!parsed.success) return err({ kind: "validation" });
  const r = await serviceClosureService.transitionIncidence(
    incidenceId,
    parsed.data.to,
    { reason: parsed.data.reason, evidenceNote: parsed.data.evidenceNote, note: parsed.data.note },
    s.adminId,
  );
  if (r.ok) revalidatePath("/admin/incidencias");
  return r.ok ? ok(null) : err({ kind: r.error.kind });
}

export async function authorizeReviewAction(reviewId: string, decision: "AUTORIZADA" | "RECHAZADA"): A {
  const s = await requireSession();
  const r = await reviewService.authorize(reviewId, decision, s.adminId);
  if (r.ok) revalidatePath("/admin/incidencias");
  return r.ok ? ok(null) : err({ kind: r.error.kind });
}
