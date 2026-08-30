"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { clientLinkService } from "@/server/services/clientLink";
import { clientIp } from "@/lib/http";
import { rateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { err, ok, type Result } from "@/lib/result";

/**
 * Public actions for the signed client link (issue #16). No admin session — the
 * token IS the credential, and sensitive actions add a phone last-4 check.
 */

async function ip() {
  const h = await headers();
  return clientIp(new Request("http://x", { headers: h }));
}

async function resolveOr(token: string): Promise<Result<{ requestId: string }, { kind: string }>> {
  const gate = rateLimit(`linkLookup:${await ip()}`, RATE_LIMITS.linkLookup);
  if (!gate.ok) return err({ kind: "rate_limited" });
  const r = await clientLinkService.resolve(token);
  return r.ok ? ok(r.value) : err({ kind: r.error.kind });
}

const messageSchema = z.string().trim().min(3, "Escribe un poco más.").max(2000);

export async function addInfoAction(
  token: string,
  message: string,
): Promise<Result<null, { kind: string }>> {
  const parsed = messageSchema.safeParse(message);
  if (!parsed.success) return err({ kind: "validation" });
  const link = await resolveOr(token);
  if (!link.ok) return err({ kind: link.error.kind });
  const r = await clientLinkService.addClientInfo(link.value.requestId, parsed.data, "info");
  return r.ok ? ok(null) : err({ kind: r.error.kind });
}

export async function askClarificationAction(
  token: string,
  message: string,
): Promise<Result<null, { kind: string }>> {
  const parsed = messageSchema.safeParse(message);
  if (!parsed.success) return err({ kind: "validation" });
  const link = await resolveOr(token);
  if (!link.ok) return err({ kind: link.error.kind });
  const r = await clientLinkService.addClientInfo(link.value.requestId, parsed.data, "clarification");
  return r.ok ? ok(null) : err({ kind: r.error.kind });
}

export async function decideQuoteAction(
  token: string,
  quoteId: string,
  decision: "ACEPTADO" | "RECHAZADO",
  phoneLast4: string,
): Promise<Result<null, { kind: string }>> {
  if (decision !== "ACEPTADO" && decision !== "RECHAZADO") return err({ kind: "validation" });
  if (!/^\d{4}$/.test(phoneLast4)) return err({ kind: "verification_failed" });
  const link = await resolveOr(token);
  if (!link.ok) return err({ kind: link.error.kind });

  const h = await headers();
  const r = await clientLinkService.decideQuote(
    link.value.requestId,
    quoteId,
    decision,
    phoneLast4,
    { ip: await ip(), userAgent: h.get("user-agent") ?? undefined },
  );
  return r.ok ? ok(null) : err({ kind: r.error.kind });
}

const refSchema = z.string().trim().regex(/^PS-[0-9A-Z]{4}-[0-9A-Z]{4}$/i, "Referencia no válida");

export async function regenerateAccessAction(
  reference: string,
  phoneLast4: string,
): Promise<Result<{ url: string }, { kind: string }>> {
  const gate = rateLimit(`linkIssue:${await ip()}`, RATE_LIMITS.linkIssue);
  if (!gate.ok) return err({ kind: "rate_limited" });
  const ref = refSchema.safeParse(reference);
  if (!ref.success) return err({ kind: "validation" });
  if (!/^\d{4}$/.test(phoneLast4)) return err({ kind: "verification_failed" });
  const r = await clientLinkService.regenerate(ref.data.toUpperCase(), phoneLast4);
  return r.ok ? ok(r.value) : err({ kind: r.error.kind });
}
