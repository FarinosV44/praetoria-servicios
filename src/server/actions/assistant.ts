"use server";

import { z } from "zod";
import { analysisService, type AnalysisView } from "@/server/services/analysis";
import { requestService } from "@/server/services/requests";
import { communicationService } from "@/server/services/communications";
import { contactSchema } from "@/domain/requests/schema";
import { TRIAGE_RISKS } from "@/domain/assistant/triage";
import { rateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { err, ok, type Result } from "@/lib/result";

/**
 * Assistant orchestration actions (issues #5, #7, #8, #10). The wizard is a
 * client component; these are the server steps it calls.
 */

export async function runAnalysisAction(
  requestId: string,
): Promise<Result<AnalysisView, { kind: string; message?: string }>> {
  const gate = rateLimit(`analysis:${requestId}`, RATE_LIMITS.analysis);
  if (!gate.ok) return err({ kind: "rate_limited" });
  const r = await analysisService.analyze(requestId);
  if (!r.ok)
    return err({ kind: r.error.kind, message: "message" in r.error ? r.error.message : undefined });
  return ok(r.value);
}

const correctionSchema = z.object({
  wrongSections: z.array(z.string()).max(12),
  clarification: z.string().trim().max(2000).optional(),
});

export async function recordCorrectionAction(
  requestId: string,
  input: unknown,
): Promise<Result<null, { kind: string }>> {
  const parsed = correctionSchema.safeParse(input);
  if (!parsed.success) return err({ kind: "validation" });
  const r = await analysisService.recordCorrection({ requestId, ...parsed.data });
  return r.ok ? ok(null) : err({ kind: r.error.kind });
}

export async function getActiveAnalysisAction(requestId: string) {
  return analysisService.getActive(requestId);
}

/**
 * Final assistant step (issue #10): attach contact + consent, submit the
 * request, and — if the client confirmed the analysis — record their validation.
 * Idempotent.
 */
export async function finishRequestAction(
  requestId: string,
  input: { contact: unknown; analysisConfirmed: boolean; triageRisks: string[] },
): Promise<
  Result<{ reference: string }, { kind: string; fieldErrors?: Record<string, string[]> }>
> {
  const gate = rateLimit(`submit:${requestId}`, RATE_LIMITS.submit);
  if (!gate.ok) return err({ kind: "rate_limited" });

  const parsed = contactSchema.safeParse(input.contact);
  if (!parsed.success) {
    return err({ kind: "validation", fieldErrors: z.flattenError(parsed.error).fieldErrors });
  }

  const known = new Set(TRIAGE_RISKS.map((r) => r.key));
  const risks = input.triageRisks.filter((k) => known.has(k));

  const attached = await requestService.attachContact(requestId, parsed.data);
  if (!attached.ok) return err({ kind: attached.error.kind });

  if (risks.length > 0) {
    await requestService.setUrgencyFromTriage(requestId, risks);
  }

  const submitted = await requestService.submit(requestId);
  if (!submitted.ok) return err({ kind: submitted.error.kind });

  if (input.analysisConfirmed && submitted.value.status === "PENDIENTE_ANALISIS") {
    await requestService.applyTransition({
      requestId,
      to: "VALIDADA_CLIENTE",
      actor: "CLIENT",
      reason: "El cliente confirmó el análisis en el asistente",
    });
  }

  // Send the request confirmation (issue #13). Best-effort — a comms failure
  // never affects the submitted request.
  await communicationService.notify({ requestId, kind: "CONFIRMATION" });

  return ok({ reference: submitted.value.reference });
}
