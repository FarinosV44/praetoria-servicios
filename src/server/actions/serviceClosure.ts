"use server";

import { z } from "zod";
import { clientLinkService } from "@/server/services/clientLink";
import { serviceClosureService } from "@/server/services/serviceClosure";
import { reviewService } from "@/server/services/reviews";
import { err, ok, type Result } from "@/lib/result";

/**
 * Public (token-gated) actions for the post-service flow (issue #23). The signed
 * link token is the credential — same model as `src/server/actions/clientLink.ts`.
 */

type A<T = null> = Promise<Result<T, { kind: string }>>;

async function requestFor(token: string): Promise<Result<string, { kind: string }>> {
  const r = await clientLinkService.resolve(token);
  return r.ok ? ok(r.value.requestId) : err({ kind: r.error.kind });
}

export async function confirmWorkAction(token: string, phoneLast4: string): A {
  const req = await requestFor(token);
  if (!req.ok) return err({ kind: req.error.kind });
  if (!(await clientLinkService.phoneMatches(req.value, phoneLast4))) {
    return err({ kind: "verification_failed" });
  }
  const r = await serviceClosureService.confirmByClient(req.value);
  return r.ok ? ok(null) : err({ kind: r.error.kind });
}

const incidenceSchema = z.string().trim().min(10, "Cuéntanos un poco más.").max(2000);

export async function openIncidenceAction(token: string, description: string): A<{ reference: string }> {
  const parsed = incidenceSchema.safeParse(description);
  if (!parsed.success) return err({ kind: "validation" });
  const req = await requestFor(token);
  if (!req.ok) return err({ kind: req.error.kind });
  const r = await serviceClosureService.openIncidence({
    requestId: req.value,
    description: parsed.data,
    openedBy: "CLIENT",
  });
  return r.ok ? ok({ reference: r.value.reference }) : err({ kind: r.error.kind });
}

const reviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().max(1500).optional(),
  publishConsent: z.boolean(),
  authorDisplayName: z.string().trim().max(80).optional(),
});

export async function submitReviewAction(token: string, input: unknown): A {
  const parsed = reviewSchema.safeParse(input);
  if (!parsed.success) return err({ kind: "validation" });
  const req = await requestFor(token);
  if (!req.ok) return err({ kind: req.error.kind });
  const r = await reviewService.submit(req.value, parsed.data);
  return r.ok ? ok(null) : err({ kind: r.error.kind });
}

export async function getExpedienteAction(token: string): A<{ json: string }> {
  const req = await requestFor(token);
  if (!req.ok) return err({ kind: req.error.kind });
  const r = await serviceClosureService.buildExpediente(req.value);
  return r.ok ? ok({ json: JSON.stringify(r.value, null, 2) }) : err({ kind: r.error.kind });
}
