import { describe, expect, it } from "vitest";
import { isLikelyDuplicate, isLikelySpam } from "./spam";

/**
 * Issue #26 — duplicate / spam detection on review comments. Pure logic, test-first.
 */

describe("isLikelyDuplicate", () => {
  it("catches an exact repeat regardless of case and spacing", () => {
    const prior = ["Trabajo excelente, muy recomendable."];
    expect(isLikelyDuplicate("  trabajo   EXCELENTE, muy recomendable. ", prior)).toBe(true);
  });

  it("catches a near-identical repeat", () => {
    const prior = ["El fontanero fue puntual y dejó todo muy limpio, un diez"];
    expect(isLikelyDuplicate("El fontanero fue puntual y dejó todo limpio, un diez!", prior)).toBe(true);
  });

  it("does not flag two genuinely different comments", () => {
    const prior = ["Puntual y limpio."];
    expect(isLikelyDuplicate("Llegó tarde y el precio no coincidió con el presupuesto.", prior)).toBe(false);
  });

  it("ignores an empty comment", () => {
    expect(isLikelyDuplicate("", ["algo"])).toBe(false);
  });
});

describe("isLikelySpam", () => {
  it("flags a comment with a URL", () => {
    expect(isLikelySpam("Genial, visita https://mi-tienda.example para ofertas")).toBe(true);
  });

  it("flags obvious keyword spam", () => {
    expect(isLikelySpam("CASINO ONLINE gana dinero rápido!!! click aquí")).toBe(true);
  });

  it("flags a wall of repeated characters", () => {
    expect(isLikelySpam("buenoooooooooooooooo aaaaaaaaaaaaaaaa")).toBe(true);
  });

  it("does not flag a normal negative review", () => {
    expect(isLikelySpam("No quedé satisfecho: tardaron más de lo previsto y hubo que insistir.")).toBe(false);
  });
});
