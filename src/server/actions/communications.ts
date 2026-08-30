"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/server/auth";
import { db } from "@/lib/db";
import { adminService } from "@/server/services/admin";
import { communicationService } from "@/server/services/communications";
import { err, ok, type Result } from "@/lib/result";

/** Admin: flush the pending email queue for one request. */
export async function processQueueAction(
  reference: string,
): Promise<Result<{ sent: number; failed: number }, { kind: string }>> {
  const s = await requireSession();
  const request = await db.request.findUnique({ where: { reference }, select: { id: true } });
  if (!request) return err({ kind: "not_found" });
  // sendPending is queue-wide; scope the retry that precedes it to this request.
  await communicationService.retry(request.id);
  const res = await communicationService.sendPending();
  await adminService.logAction(s.adminId, "comms_queue_processed", request.id, res);
  revalidatePath(`/admin/solicitudes/${reference}`);
  return ok(res);
}

/** Admin: build the WhatsApp deep link for a LINK_PREPARED communication. */
export async function whatsappLinkAction(
  reference: string,
  communicationId: string,
): Promise<Result<{ url: string }, { kind: string }>> {
  const s = await requireSession();
  const request = await db.request.findUnique({ where: { reference }, select: { id: true } });
  if (!request) return err({ kind: "not_found" });
  const row = await db.communication.findFirst({
    where: { id: communicationId, requestId: request.id },
    select: { id: true },
  });
  if (!row) return err({ kind: "not_found" });

  const link = await communicationService.whatsappLink(communicationId);
  if (!link.ok) return err({ kind: link.error.kind });
  await adminService.logAction(s.adminId, "comms_whatsapp_link", request.id, { communicationId });
  return ok(link.value);
}
