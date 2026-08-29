"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/server/auth";
import { quoteService } from "@/server/services/quotes";
import { quoteDraftSchema } from "@/domain/quotes/schema";
import { err, ok, type Result } from "@/lib/result";

export async function saveQuoteAction(
  reference: string,
  input: unknown,
): Promise<Result<{ id: string; version: number }, { kind: string; missing?: string[] }>> {
  const s = await requireSession();
  const parsed = quoteDraftSchema.safeParse(input);
  if (!parsed.success) return err({ kind: "validation" });
  const r = await quoteService.saveDraft(s.adminId, reference, parsed.data);
  if (r.ok) revalidatePath(`/admin/solicitudes/${reference}/presupuesto`);
  return r.ok ? ok(r.value) : err({ kind: r.error.kind });
}

export async function sendQuoteAction(
  reference: string,
  quoteId: string,
): Promise<Result<null, { kind: string; missing?: string[] }>> {
  const s = await requireSession();
  const r = await quoteService.markSent(s.adminId, reference, quoteId);
  if (r.ok) {
    revalidatePath(`/admin/solicitudes/${reference}`);
    revalidatePath(`/admin/solicitudes/${reference}/presupuesto`);
    return ok(null);
  }
  if (r.error.kind === "incomplete") return err({ kind: "incomplete", missing: r.error.missing });
  return err({ kind: r.error.kind });
}
