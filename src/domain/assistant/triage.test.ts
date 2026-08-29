import { describe, expect, it } from "vitest";
import { instructionsFor, isEmergency, TRIAGE_RISKS } from "./triage";

describe("assistant triage", () => {
  it("has instructions for every risk", () => {
    for (const r of TRIAGE_RISKS) expect(r.instructions.length).toBeGreaterThan(0);
  });

  it("merges and de-duplicates instructions", () => {
    const lines = instructionsFor(["fuego", "estructural"]);
    expect(lines).toContain("Sal del domicilio y llama al 112 desde un lugar seguro.");
    expect(new Set(lines).size).toBe(lines.length);
  });

  it("flags gas / fire / structural as an emergency", () => {
    expect(isEmergency(["gas"])).toBe(true);
    expect(isEmergency(["fuego"])).toBe(true);
    expect(isEmergency(["estructural"])).toBe(true);
    expect(isEmergency(["agua"])).toBe(false);
    expect(isEmergency([])).toBe(false);
  });

  it("ignores unknown keys", () => {
    expect(instructionsFor(["nonsense"])).toEqual([]);
  });
});
