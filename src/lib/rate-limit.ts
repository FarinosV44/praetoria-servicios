/**
 * Minimal in-memory token-bucket rate limiter (issues #6, #10, #16, #17).
 * Adequate for a single-instance MVP; issue #17 can swap the store for Redis
 * behind the same interface. Keys are opaque strings (usually `action:ip`).
 */

interface Bucket {
  tokens: number;
  updatedAt: number;
}

export interface RateLimitRule {
  /** max requests in the window */
  limit: number;
  /** window length in ms */
  windowMs: number;
}

const store = new Map<string, Bucket>();

export const RATE_LIMITS = {
  upload: { limit: 30, windowMs: 60_000 },
  analysis: { limit: 8, windowMs: 60_000 },
  submit: { limit: 5, windowMs: 60_000 },
  linkLookup: { limit: 20, windowMs: 60_000 },
  linkIssue: { limit: 5, windowMs: 300_000 },
} as const satisfies Record<string, RateLimitRule>;

export function rateLimit(
  key: string,
  rule: RateLimitRule,
  now: number = Date.now(),
): { ok: boolean; retryAfterMs: number } {
  const bucket = store.get(key) ?? { tokens: rule.limit, updatedAt: now };
  // Refill proportionally to elapsed time.
  const elapsed = now - bucket.updatedAt;
  const refill = (elapsed / rule.windowMs) * rule.limit;
  bucket.tokens = Math.min(rule.limit, bucket.tokens + refill);
  bucket.updatedAt = now;

  if (bucket.tokens < 1) {
    store.set(key, bucket);
    const retryAfterMs = Math.ceil(((1 - bucket.tokens) / rule.limit) * rule.windowMs);
    return { ok: false, retryAfterMs };
  }
  bucket.tokens -= 1;
  store.set(key, bucket);
  return { ok: true, retryAfterMs: 0 };
}

/** Test helper. */
export function __resetRateLimits() {
  store.clear();
}
