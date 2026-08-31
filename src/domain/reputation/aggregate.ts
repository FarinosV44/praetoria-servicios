/**
 * Reproducible review averages (issue #26). Pure — no I/O, order-independent,
 * half-up rounding to one decimal. Computed ONLY from the reviews handed in;
 * callers pass the real published set, and an empty set yields an empty
 * aggregate (never a fabricated rating).
 */

export type ReviewDimension = "punctuality" | "clarity" | "cleanliness" | "result";

export const REVIEW_DIMENSIONS: readonly ReviewDimension[] = [
  "punctuality",
  "clarity",
  "cleanliness",
  "result",
];

export interface AggregateInput {
  rating: number;
  dimensions: Record<ReviewDimension, number | null>;
}

export interface ReviewAggregate {
  count: number;
  average: number | null;
  distribution: Record<1 | 2 | 3 | 4 | 5, number>;
  dimensionAverages: Record<ReviewDimension, number | null>;
}

const inRange = (n: unknown): n is number =>
  typeof n === "number" && Number.isFinite(n) && n >= 1 && n <= 5;

/** Half-up to one decimal: 4.333→4.3, 4.25→4.3, 4.5→4.5. */
function roundHalfUp1(value: number): number {
  return Math.round((value + Number.EPSILON) * 10) / 10;
}

function mean(values: number[]): number | null {
  if (values.length === 0) return null;
  return roundHalfUp1(values.reduce((a, b) => a + b, 0) / values.length);
}

export function computeAggregate(reviews: AggregateInput[]): ReviewAggregate {
  const ratings = reviews.map((r) => r.rating).filter(inRange);
  const distribution: Record<1 | 2 | 3 | 4 | 5, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const r of ratings) distribution[Math.round(r) as 1 | 2 | 3 | 4 | 5] += 1;

  const dimensionAverages = Object.fromEntries(
    REVIEW_DIMENSIONS.map((d) => {
      const vals = reviews
        .map((r) => r.dimensions?.[d])
        .filter((v): v is number => inRange(v));
      return [d, mean(vals)];
    }),
  ) as Record<ReviewDimension, number | null>;

  return {
    count: ratings.length,
    average: mean(ratings),
    distribution,
    dimensionAverages,
  };
}
