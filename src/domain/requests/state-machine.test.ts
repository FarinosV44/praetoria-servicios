import { describe, expect, it } from "vitest";
import {
  allowedNextStatuses,
  canTransition,
  isTerminal,
  validateTransition,
  REQUEST_STATUSES,
} from "./state-machine";

describe("request state machine", () => {
  it("lists every status", () => {
    expect(REQUEST_STATUSES).toHaveLength(11);
  });

  it("allows the happy path start", () => {
    expect(allowedNextStatuses("BORRADOR")).toContain("PENDIENTE_ANALISIS");
    expect(canTransition("BORRADOR", "PENDIENTE_ANALISIS", "CLIENT")).toBe(true);
  });

  it("rejects an invalid jump", () => {
    expect(canTransition("BORRADOR", "PRESUPUESTO_ENVIADO", "ADMIN")).toBe(false);
    const r = validateTransition({ from: "BORRADOR", to: "CERRADA", actor: "ADMIN" });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.kind).toBe("invalid_transition");
  });

  it("enforces actor rules — a client cannot move a request into review", () => {
    expect(canTransition("VALIDADA_CLIENTE", "EN_REVISION", "CLIENT")).toBe(false);
    expect(canTransition("VALIDADA_CLIENTE", "EN_REVISION", "ADMIN")).toBe(true);
    const r = validateTransition({ from: "VALIDADA_CLIENTE", to: "EN_REVISION", actor: "CLIENT" });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.kind).toBe("forbidden_actor");
  });

  it("only the client confirms their own analysis and accepts a quote", () => {
    expect(canTransition("PENDIENTE_ANALISIS", "VALIDADA_CLIENTE", "CLIENT")).toBe(true);
    expect(canTransition("PENDIENTE_ANALISIS", "VALIDADA_CLIENTE", "ADMIN")).toBe(false);
    expect(canTransition("PRESUPUESTO_ENVIADO", "ACEPTADA", "CLIENT")).toBe(true);
    expect(canTransition("PRESUPUESTO_ENVIADO", "ACEPTADA", "ADMIN")).toBe(false);
  });

  it("requires a reason for a rejection", () => {
    const noReason = validateTransition({ from: "EN_REVISION", to: "RECHAZADA", actor: "ADMIN" });
    expect(noReason.ok).toBe(false);
    if (!noReason.ok) expect(noReason.error.kind).toBe("reason_required");

    const withReason = validateTransition({
      from: "EN_REVISION",
      to: "RECHAZADA",
      actor: "ADMIN",
      reason: "Fuera de cobertura",
    });
    expect(withReason.ok).toBe(true);
  });

  it("terminal statuses have no exits", () => {
    expect(isTerminal("CANCELADA")).toBe(true);
    expect(isTerminal("CERRADA")).toBe(true);
    expect(allowedNextStatuses("CERRADA")).toHaveLength(0);
    expect(allowedNextStatuses("CANCELADA")).toHaveLength(0);
  });

  it("every non-terminal status can reach a terminal one", () => {
    for (const status of REQUEST_STATUSES) {
      if (isTerminal(status)) continue;
      expect(allowedNextStatuses(status).length).toBeGreaterThan(0);
    }
  });
});
