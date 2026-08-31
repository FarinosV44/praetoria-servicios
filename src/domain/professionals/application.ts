/**
 * Public professional application (issue #20) — pure logic.
 *
 * This is the FIRST-CONTACT intake, deliberately separate from the verified
 * `Professional` network (issue #22): a raw submission with a small status of
 * its own. Approving one later creates a `Professional` in `CANDIDATO`.
 */

import { isKnownTrade } from "@/config/trades";

export interface RawApplication {
  name: string;
  isCompany: boolean;
  trades: string[];
  municipalities: string[];
  phone: string;
  email: string;
  availabilityNote: string;
  experienceNote: string;
  observations: string;
  /** honeypot — must be empty */
  website: string;
}

export interface NormalisedApplication {
  name: string;
  isCompany: boolean;
  trades: string[];
  municipalities: string[];
  phone: string;
  email: string;
  availabilityNote: string;
  experienceNote: string;
  observations: string;
}

const collapse = (s: string) => s.trim().replace(/\s+/g, " ");
const digits = (s: string) => s.replace(/[^\d]/g, "").replace(/^0034/, "").replace(/^34(?=\d{9}$)/, "");

export function normaliseApplication(raw: RawApplication): NormalisedApplication {
  const trades = Array.from(
    new Set(raw.trades.map((t) => t.trim().toLowerCase()).filter((t) => isKnownTrade(t))),
  );
  const seen = new Set<string>();
  const municipalities: string[] = [];
  for (const m of raw.municipalities) {
    const c = collapse(m);
    const key = c.toLowerCase();
    if (c && !seen.has(key)) {
      seen.add(key);
      municipalities.push(c);
    }
  }
  return {
    name: collapse(raw.name),
    isCompany: raw.isCompany,
    trades,
    municipalities,
    phone: digits(raw.phone),
    email: raw.email.trim().toLowerCase(),
    availabilityNote: collapse(raw.availabilityNote),
    experienceNote: collapse(raw.experienceNote),
    observations: collapse(raw.observations),
  };
}

/**
 * Stable identity of an application for idempotency + dedup: email + phone +
 * the sorted trade set. Formatting differences do not change it.
 */
export function applicationFingerprint(app: NormalisedApplication): string {
  const parts = [app.email, app.phone, [...app.trades].sort().join(",")];
  return parts.join("|");
}

const URL_RE = /\b(?:https?:\/\/|www\.)\S+|\b[a-z0-9-]+\.(?:com|net|ru|xyz|top|info|biz)\b/i;
const VOWEL_RE = /[aeiouáéíóúü]/i;

export function isSpamApplication(raw: RawApplication): boolean {
  if (raw.website.trim() !== "") return true; // honeypot
  if (URL_RE.test(raw.observations) || URL_RE.test(raw.experienceNote)) return true;
  const name = collapse(raw.name);
  if (name.length < 3) return true;
  // an implausible "name": a single long token with no vowel, or keyboard mash
  const tokens = name.split(" ");
  if (tokens.length === 1 && (name.length > 7 && !VOWEL_RE.test(name))) return true;
  if (/(.)\1{4,}/.test(name) || /(?:asdf|qwer|zxcv|hjkl)/i.test(name)) return true;
  return false;
}

// ── Status machine ──────────────────────────────────────────────────────────

export const APPLICATION_STATUSES = [
  "NUEVA",
  "CONTACTADA",
  "EN_VALIDACION",
  "APROBADA",
  "RECHAZADA",
] as const;

export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

const TRANSITIONS: Record<ApplicationStatus, ApplicationStatus[]> = {
  NUEVA: ["CONTACTADA", "EN_VALIDACION", "RECHAZADA"],
  CONTACTADA: ["EN_VALIDACION", "RECHAZADA"],
  EN_VALIDACION: ["APROBADA", "CONTACTADA", "RECHAZADA"],
  APROBADA: ["RECHAZADA"],
  RECHAZADA: [],
};

export function allowedNextApplicationStatuses(from: ApplicationStatus): ApplicationStatus[] {
  return [...TRANSITIONS[from]];
}

export type ApplicationTransitionCheck = { ok: true } | { ok: false; error: string };

export function validateApplicationTransition(input: {
  from: ApplicationStatus;
  to: ApplicationStatus;
  reason: string | null;
}): ApplicationTransitionCheck {
  if (!TRANSITIONS[input.from]?.includes(input.to)) {
    return { ok: false, error: `Transición no permitida: ${input.from} → ${input.to}.` };
  }
  if (input.to === "RECHAZADA" && !input.reason?.trim()) {
    return { ok: false, error: "Hace falta un motivo para rechazar una candidatura." };
  }
  return { ok: true };
}
