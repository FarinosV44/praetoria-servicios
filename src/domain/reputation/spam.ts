/**
 * Duplicate / spam heuristics for review comments (issue #26). Advisory only —
 * a hit routes a review to the admin queue with a flag, it never auto-rejects
 * (legitimate criticism must never be silently dropped).
 */

function normalise(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Token-set similarity (Jaccard) — cheap, order-independent, typo-tolerant enough. */
function similarity(a: string, b: string): number {
  const sa = new Set(a.split(" ").filter(Boolean));
  const sb = new Set(b.split(" ").filter(Boolean));
  if (sa.size === 0 || sb.size === 0) return 0;
  let inter = 0;
  for (const t of sa) if (sb.has(t)) inter += 1;
  return inter / (sa.size + sb.size - inter);
}

export function isLikelyDuplicate(comment: string, priorComments: string[]): boolean {
  const c = normalise(comment);
  if (!c) return false;
  return priorComments.some((p) => {
    const n = normalise(p);
    if (!n) return false;
    if (n === c) return true;
    return similarity(c, n) >= 0.8;
  });
}

const SPAM_KEYWORDS =
  /\b(casino|apuestas?|bet|viagra|crypto|bitcoin|forex|gana dinero|dinero r[aá]pido|click aqu[ií]|comprar seguidores|prestamos?|préstamos?)\b/i;
const URL_RE = /\b(?:https?:\/\/|www\.)\S+|\b[a-z0-9-]+\.(?:com|net|org|es|io|shop|xyz|info)\b/i;
const REPEATED_CHAR = /(.)\1{6,}/;

export function isLikelySpam(comment: string): boolean {
  if (URL_RE.test(comment)) return true;
  if (SPAM_KEYWORDS.test(comment)) return true;
  if (REPEATED_CHAR.test(comment)) return true;
  return false;
}
