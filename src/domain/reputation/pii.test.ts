import { describe, expect, it } from "vitest";
import { detectPii, redactPii } from "./pii";

/**
 * Issue #26 — PII (phones, emails, addresses) must be detected and removed
 * before a review is published. Pure logic, test-first.
 */

describe("detectPii", () => {
  it("flags a Spanish mobile number in free text", () => {
    const hit = detectPii("Me atendió muy bien, mi teléfono es 612 34 56 78 por si acaso");
    expect(hit.hasPii).toBe(true);
    expect(hit.kinds).toContain("phone");
  });

  it("flags an email address", () => {
    expect(detectPii("escríbeme a juan.perez@gmail.com").kinds).toContain("email");
  });

  it("flags a street address", () => {
    expect(detectPii("vivo en Calle Mayor 14, 3ºB").kinds).toContain("address");
    expect(detectPii("Av. del Puerto 231").kinds).toContain("address");
  });

  it("does not flag clean text", () => {
    const hit = detectPii("El fontanero fue puntual y dejó todo limpio. Muy recomendable.");
    expect(hit.hasPii).toBe(false);
    expect(hit.kinds).toEqual([]);
  });

  it("does not flag a bare price or a time", () => {
    expect(detectPii("Me cobró 80 euros y tardó 2 horas, correcto.").hasPii).toBe(false);
  });
});

describe("redactPii", () => {
  it("replaces every detected span with a marker and leaves the rest intact", () => {
    const out = redactPii("Llámame al 612345678 o a pepe@correo.es, vivo en Calle Luna 3");
    expect(out).not.toMatch(/612345678/);
    expect(out).not.toMatch(/pepe@correo\.es/);
    expect(out).not.toMatch(/Calle Luna 3/);
    expect(out).toMatch(/\[dato eliminado\]/);
    expect(out).toMatch(/Llámame al/);
  });

  it("is a no-op on clean text", () => {
    const clean = "Trabajo impecable, volvería a llamarles.";
    expect(redactPii(clean)).toBe(clean);
  });

  it("leaves no PII that detectPii would still flag", () => {
    const out = redactPii("tel 611223344 y email a@b.com en Calle Sol 9");
    expect(detectPii(out).hasPii).toBe(false);
  });
});
