"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireSession } from "@/server/auth";
import { coverageService } from "@/server/services/coverage";
import { adminService } from "@/server/services/admin";
import { err, ok, type Result } from "@/lib/result";

async function requestId(reference: string) {
  const r = await db.request.findUnique({ where: { reference }, select: { id: true } });
  return r?.id ?? null;
}

export async function adminAnalyzeCoverageAction(
  reference: string,
): Promise<Result<{ verdict: string }, { kind: string }>> {
  const s = await requireSession();
  const id = await requestId(reference);
  if (!id) return err({ kind: "not_found" });
  const r = await coverageService.analyze(id);
  if (r.ok) {
    await adminService.logAction(s.adminId, "coverage_analyzed", id, r.value);
    revalidatePath(`/admin/solicitudes/${reference}`);
    return ok(r.value);
  }
  return err({ kind: r.error.kind });
}

export async function adminMarkCoverageReviewedAction(
  reference: string,
  note?: string,
): Promise<Result<null, { kind: string }>> {
  const s = await requireSession();
  const id = await requestId(reference);
  if (!id) return err({ kind: "not_found" });
  const r = await coverageService.markReviewed(s.adminId, id, note);
  if (r.ok) {
    await adminService.logAction(s.adminId, "coverage_reviewed", id);
    revalidatePath(`/admin/solicitudes/${reference}`);
    return ok(null);
  }
  return err({ kind: r.error.kind });
}

const reviseSchema = z.object({
  text: z.string().trim().min(20).max(20000),
  note: z.string().trim().max(1000).default(""),
});

export async function adminReviseCoverageDraftAction(
  reference: string,
  input: unknown,
): Promise<Result<null, { kind: string }>> {
  const s = await requireSession();
  const parsed = reviseSchema.safeParse(input);
  if (!parsed.success) return err({ kind: "validation" });
  const id = await requestId(reference);
  if (!id) return err({ kind: "not_found" });
  const r = await coverageService.reviseDraft(s.adminId, id, parsed.data.text, parsed.data.note);
  if (r.ok) {
    await adminService.logAction(s.adminId, "coverage_draft_revised", id);
    revalidatePath(`/admin/solicitudes/${reference}`);
    return ok(null);
  }
  return err({ kind: r.error.kind });
}
