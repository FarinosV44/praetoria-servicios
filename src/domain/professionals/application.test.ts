import { describe, expect, it } from "vitest";
import {
  applicationFingerprint,
  isSpamApplication,
  normaliseApplication,
  validateApplicationTransition,
  type RawApplication,
} from "./application";

/**
 * Issue #20 — public professional application. Pure logic, test-first.
 */

const raw: RawApplication = {
  name: "  Juan Pérez  ",
  isCompany: false,
  trades: ["fontaneria", "FONTANERIA", "no-such", "electricidad"],
  municipalities: [" Burjassot ", "burjassot", "Godella"],
  phone: " 612 34 56 78 ",
  email: "  Juan.Perez@GMAIL.com ",
  availabilityNote: "  Mañanas  ",
  experienceNote: "10 años",
  observations: "",
  website: "",
};

describe("normaliseApplication", () => {
  it("trims, lowercases email, dedupes trades to known ones, dedupes municipalities", () => {
    const n = normaliseApplication(raw);
    expect(n.name).toBe("Juan Pérez");
    expect(n.email).toBe("juan.perez@gmail.com");
    expect(n.phone).toBe("612345678");
    expect(n.trades).toEqual(["fontaneria", "electricidad"]);
    expect(n.municipalities).toEqual(["Burjassot", "Godella"]);
    expect(n.availabilityNote).toBe("Mañanas");
  });

  it("keeps at least one trade or reports it empty", () => {
    const n = normaliseApplication({ ...raw, trades: ["nope", "still-nope"] });
    expect(n.trades).toEqual([]);
  });
});

describe("applicationFingerprint", () => {
  it("is stable across formatting differences", () => {
    const a = applicationFingerprint(normaliseApplication(raw));
    const b = applicationFingerprint(
      normaliseApplication({ ...raw, email: "juan.perez@gmail.com", phone: "+34 612345678" }),
    );
    expect(a).toBe(b);
  });

  it("changes when the trade set changes", () => {
    const a = applicationFingerprint(normaliseApplication(raw));
    const b = applicationFingerprint(normaliseApplication({ ...raw, trades: ["pintura"] }));
    expect(a).not.toBe(b);
  });
});

describe("isSpamApplication", () => {
  it("flags a filled honeypot", () => {
    expect(isSpamApplication({ ...raw, website: "http://spam.example" })).toBe(true);
  });

  it("flags links in the free-text observations", () => {
    expect(isSpamApplication({ ...raw, observations: "Visita https://cheap-seo.example" })).toBe(true);
  });

  it("flags an implausible name", () => {
    expect(isSpamApplication({ ...raw, name: "asdfghjkl" })).toBe(true);
  });

  it("does not flag a normal application", () => {
    expect(isSpamApplication(raw)).toBe(false);
  });
});

describe("validateApplicationTransition", () => {
  it("follows NUEVA → CONTACTADA → EN_VALIDACION → APROBADA", () => {
    for (const [from, to] of [
      ["NUEVA", "CONTACTADA"],
      ["CONTACTADA", "EN_VALIDACION"],
      ["EN_VALIDACION", "APROBADA"],
    ] as const) {
      expect(validateApplicationTransition({ from, to, reason: null }).ok).toBe(true);
    }
  });

  it("allows rejection from any active state but needs a reason", () => {
    expect(validateApplicationTransition({ from: "NUEVA", to: "RECHAZADA", reason: null }).ok).toBe(false);
    expect(
      validateApplicationTransition({ from: "NUEVA", to: "RECHAZADA", reason: "no cubre la zona" }).ok,
    ).toBe(true);
  });

  it("rejects a nonsensical jump and any move out of a terminal state", () => {
    expect(validateApplicationTransition({ from: "NUEVA", to: "APROBADA", reason: null }).ok).toBe(false);
    expect(
      validateApplicationTransition({ from: "APROBADA", to: "EN_VALIDACION", reason: null }).ok,
    ).toBe(false);
    expect(validateApplicationTransition({ from: "RECHAZADA", to: "NUEVA", reason: null }).ok).toBe(false);
  });
});
