import { describe, expect, it } from "vitest";
import {
  INCIDENCE_STATUSES,
  validateIncidenceTransition,
  firstResponseDueAt,
  isOverdue,
  WARRANTY_KINDS,
  warrantyKindLabel,
} from "./incidence";

/** Issue #23 — incidence lifecycle, SLA, warranty differentiation. Pure — test-first (D-007). */

describe("incidence state machine", () => {
  it("has the five states", () => {
    expect([...INCIDENCE_STATUSES]).toEqual([
      "ABIERTA",
      "EN_CLASIFICACION",
      "EN_CURSO",
      "RESUELTA",
      "DESESTIMADA",
    ]);
  });

  it("walks abierta → clasificación → en curso → resuelta", () => {
    expect(validateIncidenceTransition({ from: "ABIERTA", to: "EN_CLASIFICACION" }).ok).toBe(true);
    expect(validateIncidenceTransition({ from: "EN_CLASIFICACION", to: "EN_CURSO" }).ok).toBe(true);
    expect(
      validateIncidenceTransition({
        from: "EN_CURSO",
        to: "RESUELTA",
        reason: "reparado",
        hasEvidence: true,
      }).ok,
    ).toBe(true);
  });

  it("cannot close (resuelta / desestimada) without a reason", () => {
    const r = validateIncidenceTransition({ from: "EN_CURSO", to: "RESUELTA", hasEvidence: true });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.kind).toBe("reason_required");
  });

  it("cannot close without evidence", () => {
    const r = validateIncidenceTransition({ from: "EN_CURSO", to: "RESUELTA", reason: "x" });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.kind).toBe("evidence_required");
  });

  it("desestimar also needs reason + evidence", () => {
    expect(validateIncidenceTransition({ from: "ABIERTA", to: "DESESTIMADA" }).ok).toBe(false);
    expect(
      validateIncidenceTransition({
        from: "ABIERTA",
        to: "DESESTIMADA",
        reason: "no procede",
        hasEvidence: true,
      }).ok,
    ).toBe(true);
  });

  it("resolved / dismissed can be reopened without reason", () => {
    expect(validateIncidenceTransition({ from: "RESUELTA", to: "EN_CURSO" }).ok).toBe(true);
    expect(validateIncidenceTransition({ from: "DESESTIMADA", to: "EN_CLASIFICACION" }).ok).toBe(true);
  });

  it("rejects an invalid jump", () => {
    const r = validateIncidenceTransition({ from: "ABIERTA", to: "RESUELTA", reason: "x", hasEvidence: true });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.kind).toBe("invalid_transition");
  });
});

describe("SLA", () => {
  it("computes the first-response deadline from the open time", () => {
    const opened = new Date("2026-09-01T09:00:00Z");
    const due = firstResponseDueAt(opened);
    expect(due.getTime()).toBeGreaterThan(opened.getTime());
  });

  it("flags overdue", () => {
    const due = new Date("2026-09-01T09:00:00Z");
    expect(isOverdue(due, new Date("2026-09-01T08:00:00Z"))).toBe(false);
    expect(isOverdue(due, new Date("2026-09-01T10:00:00Z"))).toBe(true);
  });
});

describe("warranty kinds", () => {
  it("differentiates legal / comercial / cortesía", () => {
    expect([...WARRANTY_KINDS]).toEqual(["LEGAL", "COMERCIAL", "CORTESIA"]);
    expect(warrantyKindLabel("LEGAL")).toMatch(/legal/i);
    expect(warrantyKindLabel("COMERCIAL")).toMatch(/comercial/i);
    expect(warrantyKindLabel("CORTESIA")).toMatch(/cortes/i);
  });
});
