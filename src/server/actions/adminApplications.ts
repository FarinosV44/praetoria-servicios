"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/server/auth";
import { applicationService } from "@/server/services/applications";
import { APPLICATION_STATUSES } from "@/domain/professionals/application";
import { err, ok, type Result } from "@/lib/result";

type A<T = null> = Promise<Result<T, { kind: string; message?: string }>>;

export async function setApplicationStatusAction(id: string, input: unknown): A {
  const s = await requireSession();
  const parsed = z
    .object({ to: z.enum(APPLICATION_STATUSES), reason: z.string().trim().max(1000).optional() })
    .safeParse(input);
  if (!parsed.success) return err({ kind: "validation" });
  const r = await applicationService.setStatus(id, parsed.data.to, {
    adminId: s.adminId,
    reason: parsed.data.reason,
  });
  if (r.ok) revalidatePath("/admin/candidaturas");
  return r.ok
    ? ok(null)
    : err({ kind: r.error.kind, message: r.error.kind === "transition" ? r.error.error : undefined });
}

export async function addApplicationNoteAction(id: string, note: string): A {
  const s = await requireSession();
  const parsed = z.string().trim().min(1).max(2000).safeParse(note);
  if (!parsed.success) return err({ kind: "validation" });
  const r = await applicationService.addNote(id, parsed.data, s.adminId);
  if (r.ok) revalidatePath("/admin/candidaturas");
  return r.ok ? ok(null) : err({ kind: r.error.kind });
}

export async function convertApplicationAction(id: string): A<{ reference: string }> {
  const s = await requireSession();
  const r = await applicationService.convertToProfessional(id, s.adminId);
  if (r.ok) {
    revalidatePath("/admin/candidaturas");
    revalidatePath("/admin/profesionales");
  }
  return r.ok ? ok({ reference: r.value.reference }) : err({ kind: r.error.kind });
}
