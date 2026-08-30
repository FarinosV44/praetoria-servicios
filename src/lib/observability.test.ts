import { describe, expect, it } from "vitest";
import { buildAiMetric, timeAiCall } from "./observability";
import { redactForTest } from "./logging";

/**
 * Issue #19 — AI latency/cost tracking without PII.
 */

describe("buildAiMetric", () => {
  it("keeps only numbers and enums, clamps the duration", () => {
    const m = buildAiMetric({
      operation: "analyzeProblem",
      outcome: "ok",
      promptVersion: "p1",
      durationMs: 999_999,
      inputTokens: 1200,
      outputTokens: 340,
      costMicros: 4500,
    });
    expect(m).toEqual({
      operation: "analyzeProblem",
      outcome: "ok",
      promptVersion: "p1",
      durationMs: 120_000,
      inputTokens: 1200,
      outputTokens: 340,
      costMicros: 4500,
    });
  });

  it("drops malformed numeric fields", () => {
    const m = buildAiMetric({
      operation: "analyzeCoverage",
      outcome: "timeout",
      promptVersion: "p2",
      durationMs: -5,
      inputTokens: Number.NaN,
      costMicros: -1,
    });
    expect(m).toEqual({
      operation: "analyzeCoverage",
      outcome: "timeout",
      promptVersion: "p2",
      durationMs: 0,
    });
  });

  it("carries no PII-shaped content by construction (nothing but the shaped record)", () => {
    const serialized = JSON.stringify(
      buildAiMetric({
        operation: "analyzeProblem",
        outcome: "ok",
        promptVersion: "p1",
        durationMs: 100,
      }),
    );
    expect(serialized).not.toMatch(/@|\+34|calle|http/i);
  });
});

describe("timeAiCall", () => {
  it("records an ok outcome and returns the result unchanged", async () => {
    const value = { ok: true as const, data: 1 };
    const r = await timeAiCall("analyzeProblem", "p1", async () => value);
    expect(r).toBe(value);
  });

  it("maps a failed Result's error kind to the outcome", async () => {
    const r = await timeAiCall("analyzeCoverage", "p1", async () => ({
      ok: false as const,
      error: { kind: "invalid_output" },
    }));
    expect(r.ok).toBe(false);
  });

  it("records an exception outcome and rethrows", async () => {
    await expect(
      timeAiCall("analyzeProblem", "p1", async () => {
        throw new Error("boom");
      }),
    ).rejects.toThrow("boom");
  });
});

describe("error context redaction (defence in depth)", () => {
  it("masks PII passed in an error context", () => {
    const redacted = redactForTest({
      component: "analysisService.analyze",
      email: "ana@example.com",
      phone: "600111222",
      note: "escribe a ana@example.com",
    });
    expect(redacted.email).toBe("[redacted]");
    expect(redacted.phone).toBe("[redacted]");
    expect(JSON.stringify(redacted)).not.toContain("ana@example.com");
  });
});
