"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { clientIp } from "@/lib/http";
import { rateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { applicationService } from "@/server/services/applications";
import { err, ok, type Result } from "@/lib/result";

/**
 * Public professional application (issue #20). No admin session — this is a
 * first-contact form. Antispam: honeypot (`website`), IP rate-limit, and
 * fingerprint dedup in the service. A spam/dup hit still returns success.
 */

const schema = z.object({
  name: z.string().trim().min(2).max(160),
  isCompany: z.boolean().default(false),
  trades: z.array(z.string().trim()).min(1).max(20),
  municipalities: z.array(z.string().trim().max(80)).max(80).default([]),
  phone: z.string().trim().min(6).max(40),
  email: z.string().trim().email().max(160),
  availabilityNote: z.string().trim().max(500).default(""),
  experienceNote: z.string().trim().max(1500).default(""),
  observations: z.string().trim().max(1500).default(""),
  consent: z.literal(true),
  website: z.string().max(200).default(""), // honeypot — must be empty
});

async function ip() {
  const h = await headers();
  return clientIp(new Request("http://x", { headers: h }));
}

export async function submitProfessionalApplicationAction(
  input: unknown,
): Promise<Result<{ received: true }, { kind: string }>> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) return err({ kind: "validation" });

  const gate = rateLimit(`application:${await ip()}`, RATE_LIMITS.application);
  if (!gate.ok) return err({ kind: "rate_limited" });

  const r = await applicationService.submit({
    name: parsed.data.name,
    isCompany: parsed.data.isCompany,
    trades: parsed.data.trades,
    municipalities: parsed.data.municipalities,
    phone: parsed.data.phone,
    email: parsed.data.email,
    availabilityNote: parsed.data.availabilityNote,
    experienceNote: parsed.data.experienceNote,
    observations: parsed.data.observations,
    website: parsed.data.website,
  });
  return r.ok ? ok(r.value) : err({ kind: r.error.kind });
}
