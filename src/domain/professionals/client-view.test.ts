import { describe, expect, it } from "vitest";
import { buildClientProfessionalView } from "./client-view";

/** Issue #22 — the client-facing professional view; the "no verificado on contact-only" rule. */

describe("buildClientProfessionalView", () => {
  it("is NOT verified when only phone/email was checked", () => {
    const v = buildClientProfessionalView({
      displayName: "Juan",
      trades: ["fontaneria"],
      verifications: [{ kind: "CONTACT", passed: true }],
      photoConsent: false,
      photoUrl: "x",
    });
    expect(v.isVerified).toBe(false);
    expect(v.verifiedScope).toEqual([]);
  });

  it("lists the real verified scope and marks verified", () => {
    const v = buildClientProfessionalView({
      displayName: "Juan",
      trades: ["fontaneria"],
      verifications: [
        { kind: "CONTACT", passed: true },
        { kind: "IDENTITY", passed: true },
        { kind: "RC_INSURANCE", passed: true },
        { kind: "REFERENCES", passed: false },
      ],
      photoConsent: false,
      photoUrl: null,
    });
    expect(v.isVerified).toBe(true);
    expect(v.verifiedScope).toEqual(["Identidad", "Seguro de responsabilidad civil"]);
  });

  it("only exposes the photo with consent", () => {
    const base = {
      displayName: "Juan",
      trades: ["fontaneria"],
      verifications: [{ kind: "IDENTITY" as const, passed: true }],
      photoUrl: "https://blob/p.jpg",
    };
    expect(buildClientProfessionalView({ ...base, photoConsent: false }).photoUrl).toBeNull();
    expect(buildClientProfessionalView({ ...base, photoConsent: true }).photoUrl).toBe(
      "https://blob/p.jpg",
    );
  });

  it("de-duplicates repeated verification kinds", () => {
    const v = buildClientProfessionalView({
      displayName: "Juan",
      trades: [],
      verifications: [
        { kind: "IDENTITY", passed: true },
        { kind: "IDENTITY", passed: true },
      ],
      photoConsent: false,
      photoUrl: null,
    });
    expect(v.verifiedScope).toEqual(["Identidad"]);
  });
});
