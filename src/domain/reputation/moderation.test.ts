import { describe, expect, it } from "vitest";
import { validateModerationTransition, isPublishable } from "./moderation";

/**
 * Issue #26 — moderation state machine. Publication is a per-review decision;
 * criticism is never auto-hidden; PII must be cleared first. Pure logic, test-first.
 */

describe("validateModerationTransition", () => {
  it("allows PENDIENTE → AUTORIZADA when there is no unresolved PII flag", () => {
    const r = validateModerationTransition({
      from: "PENDIENTE",
      to: "AUTORIZADA",
      piiFlagged: false,
      reason: null,
    });
    expect(r.ok).toBe(true);
  });

  it("refuses AUTORIZADA while a PII flag is unresolved", () => {
    const r = validateModerationTransition({
      from: "RETENIDA_PII",
      to: "AUTORIZADA",
      piiFlagged: true,
      reason: null,
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/dato|PII/i);
  });

  it("allows RETENIDA_PII → AUTORIZADA once the PII flag is cleared", () => {
    expect(
      validateModerationTransition({
        from: "RETENIDA_PII",
        to: "AUTORIZADA",
        piiFlagged: false,
        reason: null,
      }).ok,
    ).toBe(true);
  });

  it("requires a reason for every non-publish outcome", () => {
    for (const to of ["RETENIDA_PII", "RECHAZADA"] as const) {
      expect(
        validateModerationTransition({ from: "PENDIENTE", to, piiFlagged: false, reason: null }).ok,
      ).toBe(false);
      expect(
        validateModerationTransition({ from: "PENDIENTE", to, piiFlagged: false, reason: "spam evidente" }).ok,
      ).toBe(true);
    }
  });

  it("does not require a reason to publish", () => {
    expect(
      validateModerationTransition({ from: "PENDIENTE", to: "AUTORIZADA", piiFlagged: false, reason: null }).ok,
    ).toBe(true);
  });

  it("lets an authorised review be withdrawn but not re-published silently", () => {
    expect(
      validateModerationTransition({ from: "AUTORIZADA", to: "RETIRADA", piiFlagged: false, reason: "el cliente lo pidió" }).ok,
    ).toBe(true);
    expect(
      validateModerationTransition({ from: "RETIRADA", to: "AUTORIZADA", piiFlagged: false, reason: null }).ok,
    ).toBe(false);
  });
});

describe("isPublishable", () => {
  it("is rating-blind — a 1-star review is as publishable as a 5-star one", () => {
    expect(isPublishable({ rating: 1, status: "PENDIENTE", publishConsent: true, piiFlagged: false })).toBe(true);
    expect(isPublishable({ rating: 5, status: "PENDIENTE", publishConsent: true, piiFlagged: false })).toBe(true);
  });

  it("needs consent and no PII flag", () => {
    expect(isPublishable({ rating: 4, status: "PENDIENTE", publishConsent: false, piiFlagged: false })).toBe(false);
    expect(isPublishable({ rating: 4, status: "PENDIENTE", publishConsent: true, piiFlagged: true })).toBe(false);
  });
});
