"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireSession } from "@/server/auth";
import { insuranceService } from "@/server/services/insurance";
import { clientLinkService } from "@/server/services/clientLink";
import { adminService } from "@/server/services/admin";
import { rateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { clientIp } from "@/lib/http";
import { headers } from "next/headers";
import { err, ok, type Result } from "@/lib/result";

async function requestIdFromToken(
  token: string,
): Promise<Result<string, { kind: string }>> {
  const h = await headers();
  const gate = rateLimit(
    `linkLookup:${clientIp(new Request("http://x", { headers: h }))}`,
    RATE_LIMITS.linkLookup,
  );
  if (!gate.ok) return err({ kind: "rate_limited" });
  const link = await clientLinkService.resolve(token);
  return link.ok ? ok(link.value.requestId) : err({ kind: link.error.kind });
}

const CONSENT_TEXT_VERSION = "insurance-v1";

/** Client (from /s/[token]) grants or withdraws the insurance-analysis consent. */
export async function setInsuranceConsentAction(
  token: string,
  granted: boolean,
): Promise<Result<null, { kind: string }>> {
  const r = await requestIdFromToken(token);
  if (!r.ok) return err({ kind: r.error.kind });
  const res = await insuranceService.recordConsent(r.value, granted, CONSENT_TEXT_VERSION);
  return res.ok ? ok(null) : err({ kind: res.error.kind });
}

/** Client re-runs the tentative extraction (also runs automatically after upload). */
export async function analyzeInsuranceAction(
  token: string,
): Promise<Result<{ status: string }, { kind: string }>> {
  const r = await requestIdFromToken(token);
  if (!r.ok) return err({ kind: r.error.kind });
  const res = await insuranceService.analyze(r.value);
  return res.ok ? ok(res.value) : err({ kind: res.error.kind });
}

/** Admin deletes one policy document (verified deletion). */
export async function adminDeleteInsuranceDocAction(
  reference: string,
  docId: string,
): Promise<Result<null, { kind: string }>> {
  const s = await requireSession();
  const request = await db.request.findUnique({ where: { reference }, select: { id: true } });
  if (!request) return err({ kind: "not_found" });
  const res = await insuranceService.deleteDocument(request.id, docId);
  if (res.ok) {
    await adminService.logAction(s.adminId, "insurance_doc_deleted", request.id, { docId });
    revalidatePath(`/admin/solicitudes/${reference}`);
    return ok(null);
  }
  return err({ kind: res.error.kind });
}

/** Admin re-runs the extraction. */
export async function adminAnalyzeInsuranceAction(
  reference: string,
): Promise<Result<{ status: string }, { kind: string }>> {
  const s = await requireSession();
  const request = await db.request.findUnique({ where: { reference }, select: { id: true } });
  if (!request) return err({ kind: "not_found" });
  const res = await insuranceService.analyze(request.id);
  if (res.ok) {
    await adminService.logAction(s.adminId, "insurance_reanalyzed", request.id, res.value);
    revalidatePath(`/admin/solicitudes/${reference}`);
    return ok(res.value);
  }
  return err({ kind: res.error.kind });
}

/** Admin purges the whole insurance case (retention). */
export async function adminPurgeInsuranceAction(
  reference: string,
): Promise<Result<null, { kind: string }>> {
  const s = await requireSession();
  const request = await db.request.findUnique({ where: { reference }, select: { id: true } });
  if (!request) return err({ kind: "not_found" });
  await insuranceService.purge(request.id);
  await adminService.logAction(s.adminId, "insurance_purged", request.id);
  revalidatePath(`/admin/solicitudes/${reference}`);
  return ok(null);
}
