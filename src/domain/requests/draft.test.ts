import { describe, expect, it } from "vitest";
import { isDraftExpired, draftExpiryFrom } from "./draft";
import { LIMITS } from "@/config/limits";

const daysAgo = (n: number) => new Date(Date.now() - n * 24 * 3600_000);

describe("draft expiry", () => {
  it("expires a stale, never-submitted BORRADOR", () => {
    expect(
      isDraftExpired({
        status: "BORRADOR",
        submittedAt: null,
        updatedAt: daysAgo(LIMITS.draft.expiryDays + 1),
      }),
    ).toBe(true);
  });

  it("keeps a recent draft", () => {
    expect(isDraftExpired({ status: "BORRADOR", submittedAt: null, updatedAt: daysAgo(1) })).toBe(
      false,
    );
  });

  it("never expires a submitted request even if old", () => {
    expect(
      isDraftExpired({
        status: "PENDIENTE_ANALISIS",
        submittedAt: daysAgo(90),
        updatedAt: daysAgo(90),
      }),
    ).toBe(false);
  });

  it("never expires a non-BORRADOR", () => {
    expect(
      isDraftExpired({ status: "EN_REVISION", submittedAt: null, updatedAt: daysAgo(365) }),
    ).toBe(false);
  });

  it("computes an expiry date in the future from creation", () => {
    const created = new Date("2026-01-01T00:00:00Z");
    const exp = draftExpiryFrom(created);
    expect(exp.getTime()).toBeGreaterThan(created.getTime());
    expect(exp.getTime() - created.getTime()).toBe(LIMITS.draft.expiryDays * 24 * 3600_000);
  });
});
