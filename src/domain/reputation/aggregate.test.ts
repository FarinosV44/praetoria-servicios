import { describe, expect, it } from "vitest";
import { computeAggregate, type AggregateInput } from "./aggregate";

/**
 * Issue #26 — averages must be reproducible and computed ONLY from real
 * published reviews. Pure logic, test-first.
 */

const r = (rating: number, dims?: Partial<AggregateInput["dimensions"]>): AggregateInput => ({
  rating,
  dimensions: {
    punctuality: dims?.punctuality ?? null,
    clarity: dims?.clarity ?? null,
    cleanliness: dims?.cleanliness ?? null,
    result: dims?.result ?? null,
  },
});

describe("computeAggregate", () => {
  it("returns an empty aggregate for no reviews — never a fake rating", () => {
    const a = computeAggregate([]);
    expect(a.count).toBe(0);
    expect(a.average).toBeNull();
    expect(a.distribution).toEqual({ 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 });
    expect(a.dimensionAverages).toEqual({
      punctuality: null,
      clarity: null,
      cleanliness: null,
      result: null,
    });
  });

  it("computes a reproducible half-up average to one decimal", () => {
    // (5+4+4+3) / 4 = 4.0
    expect(computeAggregate([r(5), r(4), r(4), r(3)]).average).toBe(4);
    // (5+4) / 2 = 4.5
    expect(computeAggregate([r(5), r(4)]).average).toBe(4.5);
    // (5+4+4) / 3 = 4.333 -> 4.3
    expect(computeAggregate([r(5), r(4), r(4)]).average).toBe(4.3);
    // (4+3) / 2 = 3.5 -> half-up -> 3.5 (already 1dp); (5+2+2)/3 = 3.0
    expect(computeAggregate([r(5), r(2), r(2)]).average).toBe(3);
  });

  it("is order-independent", () => {
    const set = [r(2), r(5), r(3), r(1), r(4)];
    const shuffled = [r(4), r(1), r(2), r(3), r(5)];
    expect(computeAggregate(set)).toEqual(computeAggregate(shuffled));
  });

  it("builds the 1..5 distribution", () => {
    const a = computeAggregate([r(5), r(5), r(4), r(1)]);
    expect(a.count).toBe(4);
    expect(a.distribution).toEqual({ 1: 1, 2: 0, 3: 0, 4: 1, 5: 2 });
  });

  it("averages each optional dimension only over the reviews that gave it", () => {
    const a = computeAggregate([
      r(5, { punctuality: 5, result: 4 }),
      r(4, { punctuality: 4 }),
      r(3, {}),
    ]);
    expect(a.dimensionAverages.punctuality).toBe(4.5); // (5+4)/2
    expect(a.dimensionAverages.result).toBe(4); // only one
    expect(a.dimensionAverages.clarity).toBeNull(); // nobody rated it
  });

  it("ignores out-of-range ratings defensively", () => {
    const a = computeAggregate([r(5), r(0), r(6), r(3)]);
    expect(a.count).toBe(2);
    expect(a.average).toBe(4);
  });
});
