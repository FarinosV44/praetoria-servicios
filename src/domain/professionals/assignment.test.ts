import { describe, expect, it } from "vitest";
import { checkAssignment, type AssignableProfessional } from "./assignment";

/**
 * Issue #22, AC "el panel impide asignaciones incompatibles con oficio, zona o
 * estado" + "no asignar un oficio regulado sin acreditación vigente".
 * Pure logic — written before the implementation (D-007).
 */

const NOW = new Date("2026-09-01T00:00:00Z");

const base: AssignableProfessional = {
  status: "APROBADO",
  trades: ["fontaneria", "montaje"],
  municipalities: ["Valencia", "Burjassot"],
  credentials: [],
};

describe("checkAssignment", () => {
  it("passes for an approved pro whose trade and zone match", () => {
    const r = checkAssignment(
      base,
      { trade: "fontaneria", municipality: "Valencia", postalCode: "46001" },
      NOW,
    );
    expect(r.ok).toBe(true);
  });

  it("blocks a professional who is not APROBADO", () => {
    const r = checkAssignment(
      { ...base, status: "SUSPENDIDO" },
      { trade: "fontaneria", municipality: "Valencia", postalCode: "46001" },
      NOW,
    );
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reasons.map((x) => x.kind)).toContain("status");
  });

  it("blocks a trade the professional does not do", () => {
    const r = checkAssignment(
      base,
      { trade: "electricidad", municipality: "Valencia", postalCode: "46001" },
      NOW,
    );
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reasons.map((x) => x.kind)).toContain("trade");
  });

  it("blocks a municipality the professional does not cover", () => {
    const r = checkAssignment(
      base,
      { trade: "fontaneria", municipality: "Paterna", postalCode: "46980" },
      NOW,
    );
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reasons.map((x) => x.kind)).toContain("zone");
  });

  it("blocks a regulated trade with no credential", () => {
    const r = checkAssignment(
      { ...base, status: "APROBADO", trades: ["electricidad"], municipalities: ["Valencia"] },
      { trade: "electricidad", municipality: "Valencia", postalCode: "46001" },
      NOW,
    );
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reasons.map((x) => x.kind)).toContain("credential");
  });

  it("blocks a regulated trade whose credential has expired", () => {
    const r = checkAssignment(
      {
        ...base,
        trades: ["electricidad"],
        municipalities: ["Valencia"],
        credentials: [{ trade: "electricidad", expiresAt: new Date("2026-08-01T00:00:00Z") }],
      },
      { trade: "electricidad", municipality: "Valencia", postalCode: "46001" },
      NOW,
    );
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reasons.map((x) => x.kind)).toContain("credential");
  });

  it("passes a regulated trade with a valid credential", () => {
    const r = checkAssignment(
      {
        ...base,
        trades: ["electricidad"],
        municipalities: ["Valencia"],
        credentials: [{ trade: "electricidad", expiresAt: new Date("2027-01-01T00:00:00Z") }],
      },
      { trade: "electricidad", municipality: "Valencia", postalCode: "46001" },
      NOW,
    );
    expect(r.ok).toBe(true);
  });

  it("accepts a credential with no expiry date", () => {
    const r = checkAssignment(
      {
        ...base,
        trades: ["climatizacion"],
        municipalities: ["Valencia"],
        credentials: [{ trade: "climatizacion", expiresAt: null }],
      },
      { trade: "climatizacion", municipality: "Valencia", postalCode: "46001" },
      NOW,
    );
    expect(r.ok).toBe(true);
  });

  it("reports every incompatibility at once", () => {
    const r = checkAssignment(
      { ...base, status: "VERIFICANDO", trades: ["montaje"], municipalities: ["Godella"] },
      { trade: "electricidad", municipality: "Valencia", postalCode: "46001" },
      NOW,
    );
    expect(r.ok).toBe(false);
    if (!r.ok) {
      const kinds = r.reasons.map((x) => x.kind).sort();
      expect(kinds).toEqual(["credential", "status", "trade", "zone"]);
    }
  });

  it("cannot assign a request with no resolved trade", () => {
    const r = checkAssignment(
      base,
      { trade: null, municipality: "Valencia", postalCode: "46001" },
      NOW,
    );
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reasons.map((x) => x.kind)).toContain("trade");
  });
});
