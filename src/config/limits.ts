/**
 * Configurable operational limits (issues #6, #8, #10, #16).
 * These are product configuration, not secrets — safe to keep in the repo.
 * Where an operator may want to tune them per environment, an env override is noted.
 */
export const LIMITS = {
  photos: {
    minRecommended: 2,
    max: 8,
    maxBytes: 12 * 1024 * 1024, // 12 MB per file, pre-compression
    acceptedTypes: ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"],
  },
  insuranceDocs: {
    max: 6,
    maxBytes: 25 * 1024 * 1024,
    acceptedTypes: ["application/pdf", "image/jpeg", "image/png", "image/webp"],
  },
  reanalysis: {
    // Max client-triggered re-analyses before the flow suggests "que lo revise una persona".
    maxPerRequest: 3,
  },
  problemText: {
    minChars: 10,
    maxChars: 3000,
  },
  signedLink: {
    defaultTtlHours: 24 * 14, // 14 days
    maxTtlHours: 24 * 60,
  },
  draft: {
    // BORRADOR requests with no activity are eligible for deletion after this.
    expiryDays: 30,
  },
  communications: {
    // Email send attempts before a Communication row stays FAILED (issue #13 queue/retry).
    maxAttempts: 4,
    // Rows processed per sendPending() call.
    batchSize: 25,
  },
} as const;
