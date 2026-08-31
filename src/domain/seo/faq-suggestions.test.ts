import { describe, expect, it } from "vitest";
import { faqCandidatesFromRequests } from "./faq-suggestions";

describe("faqCandidatesFromRequests", () => {
  it("groups by trade, keeps only trades over the threshold, ordered by count", () => {
    const reqs = [
      { trade: "fontaneria", problemText: "El grifo de la cocina gotea sin parar" },
      { trade: "fontaneria", problemText: "Tengo una fuga bajo el fregadero" },
      { trade: "fontaneria", problemText: "El inodoro no deja de correr agua" },
      { trade: "electricidad", problemText: "Salta el diferencial por la noche" },
      { trade: "electricidad", problemText: "Un enchufe hace chispas" },
    ];
    const r = faqCandidatesFromRequests(reqs);
    expect(r).toHaveLength(1);
    expect(r[0].trade).toBe("fontaneria");
    expect(r[0].count).toBe(3);
    expect(r[0].kind).toBe("recommendation");
  });

  it("redacts PII out of the snippets and drops one that is all PII (AC-27-nopii)", () => {
    const reqs = [
      { trade: "fontaneria", problemText: "Fuga en el baño, llámame al 612 345 678" },
      { trade: "fontaneria", problemText: "Grifo roto en la cocina" },
      { trade: "fontaneria", problemText: "612345678" },
    ];
    const r = faqCandidatesFromRequests(reqs, { minPerTrade: 1 });
    const joined = r[0].snippets.join(" | ");
    expect(joined).not.toMatch(/612\s?345\s?678/);
    expect(joined).toMatch(/Grifo roto/);
  });

  it("ignores requests with no trade or no text", () => {
    const r = faqCandidatesFromRequests(
      [
        { trade: null, problemText: "algo largo que no cuenta" },
        { trade: "pintura", problemText: null },
        { trade: "pintura", problemText: "corto" },
      ],
      { minPerTrade: 1 },
    );
    expect(r).toEqual([]);
  });
});
