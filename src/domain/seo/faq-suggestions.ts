/**
 * FAQ candidates from real requests (issue #27) — the client's own words, run
 * through PII redaction FIRST, then grouped by trade. Raw material for an editor
 * to turn into a FAQ; never published automatically.
 */

import { redactPii } from "@/domain/reputation/pii";

export interface RequestText {
  trade: string | null;
  problemText: string | null;
}

export interface FaqCandidateGroup {
  kind: "recommendation";
  trade: string;
  count: number;
  /** distinct, redacted, short snippets — deduped */
  snippets: string[];
  action: string;
}

const clean = (s: string) =>
  redactPii(s)
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 160);

export function faqCandidatesFromRequests(
  requests: RequestText[],
  opts: { minPerTrade?: number } = {},
): FaqCandidateGroup[] {
  const min = opts.minPerTrade ?? 3;
  const byTrade = new Map<string, { count: number; snippets: Set<string> }>();

  for (const r of requests) {
    if (!r.trade || !r.problemText) continue;
    const text = r.problemText.trim();
    if (text.length < 12) continue;
    const g = byTrade.get(r.trade) ?? { count: 0, snippets: new Set<string>() };
    g.count += 1;
    const snippet = clean(text);
    if (snippet && !snippet.includes("[dato eliminado]")) g.snippets.add(snippet);
    byTrade.set(r.trade, g);
  }

  return [...byTrade.entries()]
    .filter(([, g]) => g.count >= min)
    .sort((a, b) => b[1].count - a[1].count)
    .map(([trade, g]) => ({
      kind: "recommendation" as const,
      trade,
      count: g.count,
      snippets: [...g.snippets].slice(0, 8),
      action: `Redactar 2–3 preguntas frecuentes para /servicios/${trade} a partir de estas dudas reales.`,
    }));
}
