import { beforeEach, describe, expect, it } from "vitest";
import { __resetRateLimits, rateLimit } from "./rate-limit";

beforeEach(__resetRateLimits);

describe("rateLimit", () => {
  it("allows up to the limit then blocks", () => {
    const rule = { limit: 3, windowMs: 1000 };
    const t = 1_000_000;
    expect(rateLimit("k", rule, t).ok).toBe(true);
    expect(rateLimit("k", rule, t).ok).toBe(true);
    expect(rateLimit("k", rule, t).ok).toBe(true);
    const blocked = rateLimit("k", rule, t);
    expect(blocked.ok).toBe(false);
    expect(blocked.retryAfterMs).toBeGreaterThan(0);
  });

  it("refills over time", () => {
    const rule = { limit: 2, windowMs: 1000 };
    const t = 2_000_000;
    rateLimit("k", rule, t);
    rateLimit("k", rule, t);
    expect(rateLimit("k", rule, t).ok).toBe(false);
    // After a full window, tokens are back.
    expect(rateLimit("k", rule, t + 1000).ok).toBe(true);
  });

  it("keys are independent", () => {
    const rule = { limit: 1, windowMs: 1000 };
    const t = 3_000_000;
    expect(rateLimit("a", rule, t).ok).toBe(true);
    expect(rateLimit("b", rule, t).ok).toBe(true);
    expect(rateLimit("a", rule, t).ok).toBe(false);
  });
});
