/**
 * PII detection + redaction for review comments (issue #26). A hit auto-holds a
 * review (`RETENIDA_PII`); redaction must leave nothing `detectPii` would still
 * flag before the review can be published. Deliberately conservative — a false
 * positive costs a manual review, a false negative publishes someone's phone.
 */

export type PiiKind = "phone" | "email" | "address";

const EMAIL = /\b[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}\b/gi;

// Spanish phone: 9 digits starting 6/7/8/9, optional +34, optional spaces/dashes
// in groups. Requires at least one separator OR a leading +/00 34 so bare
// 4-digit prices and years don't match.
const PHONE =
  /(?:(?:\+|00)\s?34[\s.-]?)?(?:[67]\d{2}|[89]\d{2})(?:[\s.-]?\d{2}){3}\b|\b(?:\+|00)\s?34[\s.-]?\d{9}\b/g;

// Street address: a via type + name + number.
const ADDRESS =
  /\b(?:calle|c\/|av(?:da|gda|inguda|enida)?\.?|plaza|pl\.|plaça|carrer|paseo|passeig|camino|camí|ronda|traves[ií]a|travessera)\s+[a-zà-ÿ'.\-\s]{2,40}?\s*,?\s*n?º?\s*\d{1,4}(?:\s?[ºª]?\s?[a-dA-D])?\b/gi;

const MATCHERS: { kind: PiiKind; re: RegExp }[] = [
  { kind: "email", re: EMAIL },
  { kind: "phone", re: PHONE },
  { kind: "address", re: ADDRESS },
];

export interface PiiResult {
  hasPii: boolean;
  kinds: PiiKind[];
}

export function detectPii(text: string): PiiResult {
  const found = new Set<PiiKind>();
  for (const { kind, re } of MATCHERS) {
    re.lastIndex = 0;
    if (re.test(text)) found.add(kind);
  }
  return { hasPii: found.size > 0, kinds: [...found] };
}

const MARKER = "[dato eliminado]";

export function redactPii(text: string): string {
  let out = text;
  for (const { re } of MATCHERS) {
    out = out.replace(new RegExp(re.source, re.flags), MARKER);
  }
  // collapse "[dato eliminado] [dato eliminado]" runs and stray spacing
  return out.replace(new RegExp(`(?:${MARKER.replace(/[[\]]/g, "\\$&")}\\s*){2,}`, "g"), `${MARKER} `).trim();
}
