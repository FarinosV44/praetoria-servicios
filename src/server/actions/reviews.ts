"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/server/auth";
import { reviewService } from "@/server/services/reviews";
import { err, ok, type Result } from "@/lib/result";

type A<T = null> = Promise<Result<T, { kind: string; message?: string }>>;

function revalidate(id: string) {
  revalidatePath("/admin/opiniones");
  revalidatePath("/admin/incidencias");
  revalidatePath(`/admin/opiniones/${id}`);
}

export async function moderateReviewAction(reviewId: string, input: unknown): A {
  const s = await requireSession();
  const parsed = z
    .object({
      to: z.enum(["AUTORIZADA", "RETENIDA_PII", "RECHAZADA", "RETIRADA"]),
      reason: z.string().trim().max(1000).optional(),
    })
    .safeParse(input);
  if (!parsed.success) return err({ kind: "validation" });
  const r = await reviewService.moderate(reviewId, parsed.data.to, {
    adminId: s.adminId,
    reason: parsed.data.reason,
  });
  if (r.ok) revalidate(reviewId);
  return r.ok
    ? ok(null)
    : err({ kind: r.error.kind, message: r.error.kind === "transition" ? r.error.error : undefined });
}

export async function redactReviewAction(reviewId: string): A {
  const s = await requireSession();
  const r = await reviewService.applyRedaction(reviewId, s.adminId);
  if (r.ok) revalidate(reviewId);
  return r.ok ? ok(null) : err({ kind: r.error.kind });
}

export async function respondReviewAction(reviewId: string, text: string): A {
  const s = await requireSession();
  const parsed = z.string().trim().min(1).max(1500).safeParse(text);
  if (!parsed.success) return err({ kind: "validation" });
  const r = await reviewService.respond(reviewId, parsed.data, s.adminId);
  if (r.ok) revalidate(reviewId);
  return r.ok ? ok(null) : err({ kind: r.error.kind });
}

export async function openIncidenceFromReviewAction(reviewId: string): A<{ reference: string }> {
  const s = await requireSession();
  const r = await reviewService.openIncidence(reviewId, s.adminId);
  if (r.ok) {
    revalidate(reviewId);
    revalidatePath("/admin/incidencias");
  }
  return r.ok ? ok(r.value) : err({ kind: r.error.kind });
}
