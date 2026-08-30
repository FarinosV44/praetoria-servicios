"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/server/auth";
import { professionalService } from "@/server/services/professionals";
import { assignmentService } from "@/server/services/assignment";
import {
  professionalCreateSchema,
  professionalUpdateSchema,
  transitionSchema,
  verificationSchema,
  credentialSchema,
} from "@/domain/professionals/schema";
import { err, ok, type Result } from "@/lib/result";
import type { ProfessionalStatus } from "@/domain/professionals/state-machine";

type A<T = null> = Promise<Result<T, { kind: string; message?: string }>>;

export async function createProfessionalAction(input: unknown): A<{ id: string }> {
  const s = await requireSession();
  const parsed = professionalCreateSchema.safeParse(input);
  if (!parsed.success) return err({ kind: "validation" });
  const r = await professionalService.create(parsed.data, s.adminId);
  if (r.ok) revalidatePath("/admin/profesionales");
  return r.ok ? ok({ id: r.value.id }) : err({ kind: "error" });
}

export async function updateProfessionalAction(id: string, input: unknown): A {
  const s = await requireSession();
  const parsed = professionalUpdateSchema.safeParse(input);
  if (!parsed.success) return err({ kind: "validation" });
  const r = await professionalService.update(id, parsed.data, s.adminId);
  if (r.ok) revalidatePath(`/admin/profesionales/${id}`);
  return r.ok ? ok(null) : err({ kind: r.error.kind });
}

export async function transitionProfessionalAction(id: string, input: unknown): A {
  const s = await requireSession();
  const parsed = transitionSchema.safeParse(input);
  if (!parsed.success) return err({ kind: "validation" });
  const r = await professionalService.transition(id, parsed.data.to as ProfessionalStatus, {
    adminId: s.adminId,
    reason: parsed.data.reason,
  });
  if (r.ok) revalidatePath(`/admin/profesionales/${id}`);
  return r.ok ? ok(null) : err({ kind: r.error.kind });
}

export async function recordVerificationAction(id: string, input: unknown): A {
  const s = await requireSession();
  const parsed = verificationSchema.safeParse(input);
  if (!parsed.success) return err({ kind: "validation" });
  const r = await professionalService.recordVerification(id, parsed.data, s.adminId);
  if (r.ok) revalidatePath(`/admin/profesionales/${id}`);
  return r.ok ? ok(null) : err({ kind: r.error.kind });
}

export async function addCredentialAction(id: string, input: unknown): A {
  const s = await requireSession();
  const parsed = credentialSchema.safeParse(input);
  if (!parsed.success) return err({ kind: "validation" });
  const r = await professionalService.addCredential(id, parsed.data, s.adminId);
  if (r.ok) revalidatePath(`/admin/profesionales/${id}`);
  return r.ok ? ok(null) : err({ kind: r.error.kind });
}

export async function addDocumentAction(id: string, formData: FormData): A {
  const s = await requireSession();
  const file = formData.get("file");
  const kind = String(formData.get("kind") ?? "otro");
  const expiresRaw = String(formData.get("expiresAt") ?? "");
  if (!(file instanceof File) || file.size === 0) return err({ kind: "validation" });
  const bytes = new Uint8Array(await file.arrayBuffer());
  const r = await professionalService.addDocument(
    id,
    {
      bytes,
      size: file.size,
      contentType: file.type,
      kind,
      expiresAt: expiresRaw ? new Date(expiresRaw) : null,
    },
    s.adminId,
  );
  if (r.ok) revalidatePath(`/admin/profesionales/${id}`);
  return r.ok ? ok(null) : err({ kind: r.error.kind, message: "message" in r.error ? r.error.message : undefined });
}

export async function deleteDocumentAction(id: string, docId: string): A {
  const s = await requireSession();
  const r = await professionalService.deleteDocument(docId, s.adminId);
  if (r.ok) revalidatePath(`/admin/profesionales/${id}`);
  return r.ok ? ok(null) : err({ kind: r.error.kind });
}

export async function setPhotoConsentAction(id: string, consent: boolean): A {
  const s = await requireSession();
  const r = await professionalService.setPhotoConsent(id, consent, s.adminId);
  if (r.ok) revalidatePath(`/admin/profesionales/${id}`);
  return r.ok ? ok(null) : err({ kind: r.error.kind });
}

const assignSchema = z.object({
  requestId: z.string().min(1),
  professionalId: z.string().min(1),
  reason: z.string().trim().max(300).optional(),
  reference: z.string().min(1),
});

export async function assignProfessionalAction(
  input: unknown,
): A<{ assignmentId: string }> {
  const s = await requireSession();
  const parsed = assignSchema.safeParse(input);
  if (!parsed.success) return err({ kind: "validation" });
  const r = await assignmentService.assign({
    requestId: parsed.data.requestId,
    professionalId: parsed.data.professionalId,
    adminId: s.adminId,
    reason: parsed.data.reason,
  });
  if (r.ok) {
    revalidatePath(`/admin/solicitudes/${parsed.data.reference}`);
    return ok({ assignmentId: r.value.assignmentId });
  }
  if (r.error.kind === "incompatible") {
    return err({
      kind: "incompatible",
      message: r.error.reasons.map((x) => x.detail).join(" · "),
    });
  }
  return err({ kind: r.error.kind });
}
