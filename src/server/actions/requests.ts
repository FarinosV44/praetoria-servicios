"use server";

import { z } from "zod";
import { requestService } from "@/server/services/requests";
import { contactSchema, createDraftSchema, describeProblemSchema } from "@/domain/requests/schema";
import type { Result } from "@/lib/result";
import { err, ok } from "@/lib/result";

/**
 * Server actions for the assistant flow (issues #5, #9, #10). Thin: validate
 * input with the shared Zod schemas, delegate to the service, return a
 * serialisable Result. No business rules here.
 */

export type ActionError =
  | { kind: "validation"; fieldErrors: Record<string, string[]> }
  | { kind: "not_found" }
  | { kind: "conflict"; message: string };

export async function createDraftAction(
  input: unknown,
): Promise<Result<{ id: string; reference: string }, ActionError>> {
  const parsed = createDraftSchema.safeParse(input);
  if (!parsed.success) {
    return err({ kind: "validation", fieldErrors: z.flattenError(parsed.error).fieldErrors });
  }
  const draft = await requestService.createDraft(parsed.data);
  return ok({ id: draft.id, reference: draft.reference });
}

export async function describeProblemAction(
  requestId: string,
  input: unknown,
): Promise<Result<{ withinCoverage: boolean }, ActionError>> {
  const parsed = describeProblemSchema.safeParse(input);
  if (!parsed.success) {
    return err({ kind: "validation", fieldErrors: z.flattenError(parsed.error).fieldErrors });
  }
  const r = await requestService.describeProblem(requestId, parsed.data);
  if (!r.ok) return err({ kind: "not_found" });
  return ok({ withinCoverage: r.value.withinCoverage ?? false });
}

export async function attachContactAction(
  requestId: string,
  input: unknown,
): Promise<Result<{ ok: true }, ActionError>> {
  const parsed = contactSchema.safeParse(input);
  if (!parsed.success) {
    return err({ kind: "validation", fieldErrors: z.flattenError(parsed.error).fieldErrors });
  }
  const r = await requestService.attachContact(requestId, parsed.data);
  if (!r.ok) return err({ kind: "not_found" });
  return ok({ ok: true });
}

/** Idempotent submission (issue #10: one request even on a double click). */
export async function submitRequestAction(
  requestId: string,
): Promise<Result<{ reference: string; status: string }, ActionError>> {
  const r = await requestService.submit(requestId);
  if (!r.ok) return err({ kind: "not_found" });
  return ok({ reference: r.value.reference, status: r.value.status });
}
