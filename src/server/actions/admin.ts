"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { signIn, signOut, requireSession } from "@/server/auth";
import { adminService } from "@/server/services/admin";
import { clientIp } from "@/lib/http";
import { headers } from "next/headers";
import { err, ok, type Result } from "@/lib/result";

async function ip() {
  const h = await headers();
  return clientIp(new Request("http://x", { headers: h }));
}

export async function loginAction(_prev: unknown, formData: FormData): Promise<{ error?: string }> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/admin");
  const r = await signIn(email, password, await ip());
  if (!r.ok) {
    if (r.error.kind === "rate_limited")
      return { error: "Demasiados intentos. Espera unos minutos." };
    if (r.error.kind === "disabled") return { error: "Esta cuenta está deshabilitada." };
    return { error: "Correo o contraseña incorrectos." };
  }
  redirect(next.startsWith("/admin") ? next : "/admin");
}

export async function logoutAction() {
  await signOut();
  redirect("/admin/login");
}

const classificationSchema = z.object({
  trade: z.string().max(40).optional(),
  urgency: z.enum(["BAJA", "MEDIA", "ALTA", "EMERGENCIA"]).optional(),
  internalNote: z.string().max(4000).optional(),
});

export async function updateClassificationAction(
  reference: string,
  input: unknown,
): Promise<Result<null, { kind: string }>> {
  const s = await requireSession();
  const parsed = classificationSchema.safeParse(input);
  if (!parsed.success) return err({ kind: "validation" });
  const r = await adminService.updateClassification(s.adminId, reference, {
    trade: parsed.data.trade || null,
    urgency: parsed.data.urgency ?? null,
    internalNote: parsed.data.internalNote,
  });
  if (r.ok) revalidatePath(`/admin/solicitudes/${reference}`);
  return r.ok ? ok(null) : err({ kind: r.error.kind });
}

export async function changeStatusAction(
  reference: string,
  to: string,
  reason?: string,
): Promise<Result<null, { kind: string }>> {
  const s = await requireSession();
  const r = await adminService.changeStatus(s.adminId, reference, to as never, reason);
  if (r.ok) revalidatePath(`/admin/solicitudes/${reference}`);
  return r;
}

export async function requestMoreInfoAction(
  reference: string,
  message: string,
): Promise<Result<null, { kind: string }>> {
  const s = await requireSession();
  const r = await adminService.requestMoreInfo(s.adminId, reference, message);
  if (r.ok) revalidatePath(`/admin/solicitudes/${reference}`);
  return r;
}
