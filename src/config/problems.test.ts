import { describe, expect, it } from "vitest";
import { isKnownTrade } from "./trades";
import {
  PROBLEMS,
  PROBLEM_SLUGS,
  problemBySlug,
  problemsForTrade,
} from "./problems";

/**
 * Issue #25 — the curated problems catalogue must be well-formed: unique slugs,
 * every trade a real trade, every related-problem slug resolvable, and enough
 * real content per entry that the page is genuinely differentiating (D10).
 */

describe("problems config", () => {
  it("has at least a handful of curated problems", () => {
    expect(PROBLEMS.length).toBeGreaterThanOrEqual(10);
  });

  it("has unique slugs", () => {
    expect(new Set(PROBLEM_SLUGS).size).toBe(PROBLEM_SLUGS.length);
  });

  it("uses only kebab-case slugs", () => {
    for (const slug of PROBLEM_SLUGS) {
      expect(slug, slug).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    }
  });

  it("maps every problem to a known trade", () => {
    for (const p of PROBLEMS) {
      expect(isKnownTrade(p.trade), `${p.slug} -> ${p.trade}`).toBe(true);
    }
  });

  it("only references related problems that exist", () => {
    for (const p of PROBLEMS) {
      for (const rel of p.relatedProblems ?? []) {
        expect(problemBySlug(rel), `${p.slug} -> ${rel}`).toBeDefined();
      }
    }
  });

  it("never lists a problem as related to itself", () => {
    for (const p of PROBLEMS) {
      expect(p.relatedProblems ?? []).not.toContain(p.slug);
    }
  });

  it("carries real differentiating content on every entry (D10)", () => {
    for (const p of PROBLEMS) {
      expect(p.title.trim().length, p.slug).toBeGreaterThan(3);
      expect(p.intro.trim().length, p.slug).toBeGreaterThan(60);
      expect(p.symptoms.length, p.slug).toBeGreaterThanOrEqual(3);
      expect(p.causes.length, p.slug).toBeGreaterThanOrEqual(2);
      expect(p.safetySteps.length, p.slug).toBeGreaterThanOrEqual(1);
      expect(p.professionalNeeded.trim().length, p.slug).toBeGreaterThan(20);
      expect(["BAJA", "MEDIA", "ALTA"]).toContain(p.urgency);
    }
  });

  it("problemBySlug resolves known slugs and rejects unknown ones", () => {
    expect(problemBySlug("fuga-de-agua")?.trade).toBe("fontaneria");
    expect(problemBySlug("does-not-exist")).toBeUndefined();
  });

  it("problemsForTrade filters by trade", () => {
    const fontaneria = problemsForTrade("fontaneria");
    expect(fontaneria.length).toBeGreaterThan(0);
    expect(fontaneria.every((p) => p.trade === "fontaneria")).toBe(true);
    expect(problemsForTrade("no-such-trade")).toEqual([]);
  });
});
