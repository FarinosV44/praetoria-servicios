import { describe, expect, it } from "vitest";
import {
  PROFESSIONAL_STATUSES,
  allowedNextProfessionalStatuses,
  isAssignable,
  isProfessionalTerminal,
  validateProfessionalTransition,
} from "./state-machine";

/** Issue #22 — professional lifecycle states + rules. */

describe("professional state machine", () => {
  it("has exactly the six states from the issue", () => {
    expect([...PROFESSIONAL_STATUSES]).toEqual([
      "CANDIDATO",
      "DOCUMENTACION_PENDIENTE",
      "VERIFICANDO",
      "APROBADO",
      "SUSPENDIDO",
      "RECHAZADO",
    ]);
  });

  it("only APROBADO is assignable", () => {
    for (const s of PROFESSIONAL_STATUSES) {
      expect(isAssignable(s)).toBe(s === "APROBADO");
    }
  });

  it("walks the happy path candidato → aprobado", () => {
    expect(validateProfessionalTransition({ from: "CANDIDATO", to: "DOCUMENTACION_PENDIENTE" }).ok).toBe(true);
    expect(validateProfessionalTransition({ from: "DOCUMENTACION_PENDIENTE", to: "VERIFICANDO" }).ok).toBe(true);
    expect(validateProfessionalTransition({ from: "VERIFICANDO", to: "APROBADO" }).ok).toBe(true);
  });

  it("rejects an invalid jump", () => {
    const r = validateProfessionalTransition({ from: "CANDIDATO", to: "APROBADO" });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.kind).toBe("invalid_transition");
  });

  it("requires a reason to reject or suspend", () => {
    const reject = validateProfessionalTransition({ from: "VERIFICANDO", to: "RECHAZADO" });
    expect(reject.ok).toBe(false);
    if (!reject.ok) expect(reject.error.kind).toBe("reason_required");
    expect(validateProfessionalTransition({ from: "VERIFICANDO", to: "RECHAZADO", reason: "cédula caducada" }).ok).toBe(true);

    const suspend = validateProfessionalTransition({ from: "APROBADO", to: "SUSPENDIDO" });
    expect(suspend.ok).toBe(false);
    expect(validateProfessionalTransition({ from: "APROBADO", to: "SUSPENDIDO", reason: "incidencia grave" }).ok).toBe(true);
  });

  it("suspension is reversible; rejection is terminal", () => {
    expect(allowedNextProfessionalStatuses("SUSPENDIDO")).toContain("APROBADO");
    expect(isProfessionalTerminal("RECHAZADO")).toBe(true);
    expect(isProfessionalTerminal("SUSPENDIDO")).toBe(false);
    expect(allowedNextProfessionalStatuses("RECHAZADO")).toEqual([]);
  });
});
