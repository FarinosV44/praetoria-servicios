import { describe, expect, it } from "vitest";
import {
  expectedCtrAt,
  intentCannibalization,
  lowCtrQueries,
  staleContent,
  strikingDistanceQueries,
  type ArticleForSeo,
} from "./opportunities";
import type { SeoCsvRow } from "./metrics-csv";

const row = (o: Partial<SeoCsvRow>): SeoCsvRow => ({
  query: "q",
  page: "/p",
  clicks: 0,
  impressions: 0,
  ctr: 0,
  position: 0,
  device: null,
  municipality: null,
  ...o,
});

describe("expectedCtrAt", () => {
  it("falls off with position and is an estimate, not a promise", () => {
    expect(expectedCtrAt(1)).toBeGreaterThan(expectedCtrAt(3));
    expect(expectedCtrAt(50)).toBeLessThan(expectedCtrAt(10));
  });
});

describe("lowCtrQueries", () => {
  it("flags high-impression queries whose CTR is far below the position estimate", () => {
    const rows = [
      row({ query: "fontanero valencia", position: 3, impressions: 2000, ctr: 0.01 }),
      row({ query: "grifo gotea", position: 3, impressions: 2000, ctr: 0.12 }), // healthy
      row({ query: "rare", position: 3, impressions: 10, ctr: 0.0 }), // below floor
    ];
    const r = lowCtrQueries(rows);
    expect(r.map((x) => x.query)).toEqual(["fontanero valencia"]);
    expect(r[0].kind).toBe("recommendation");
    expect(r[0].action).toMatch(/title|meta/i);
  });
});

describe("strikingDistanceQueries", () => {
  it("returns positions 4–20 with impressions, best position first", () => {
    const rows = [
      row({ query: "a", position: 12, impressions: 100 }),
      row({ query: "b", position: 5, impressions: 100 }),
      row({ query: "c", position: 2, impressions: 100 }), // already page 1
      row({ query: "d", position: 8, impressions: 3 }), // too few impressions
    ];
    expect(strikingDistanceQueries(rows).map((x) => x.query)).toEqual(["b", "a"]);
  });
});

describe("staleContent", () => {
  const now = new Date("2026-08-31T00:00:00Z");
  const art = (o: Partial<ArticleForSeo>): ArticleForSeo => ({
    slug: "s",
    title: "t",
    targetKeywords: [],
    status: "PUBLICADO",
    updatedAt: now,
    internalLinkCount: 2,
    ...o,
  });

  it("flags only PUBLICADO articles older than the window", () => {
    const r = staleContent(
      [
        art({ slug: "old", updatedAt: new Date("2025-06-01T00:00:00Z") }),
        art({ slug: "fresh", updatedAt: new Date("2026-08-01T00:00:00Z") }),
        art({ slug: "draft-old", status: "BORRADOR", updatedAt: new Date("2024-01-01T00:00:00Z") }),
      ],
      now,
    );
    expect(r.map((x) => x.page)).toEqual(["/guias/old"]);
  });
});

describe("intentCannibalization", () => {
  it("pairs two published articles with very similar title/keywords", () => {
    const base = { status: "PUBLICADO", updatedAt: new Date(), internalLinkCount: 1 };
    const r = intentCannibalization([
      { ...base, slug: "a", title: "Reparar fuga de agua en casa", targetKeywords: ["fuga agua", "fontanero"] },
      { ...base, slug: "b", title: "Reparar una fuga de agua en el hogar", targetKeywords: ["fuga agua"] },
      { ...base, slug: "c", title: "Montaje de muebles a medida", targetKeywords: ["montador"] },
    ]);
    expect(r).toHaveLength(1);
    expect(r[0].detail).toMatch(/guias\/b/);
  });
});
