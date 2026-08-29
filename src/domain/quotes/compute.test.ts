import { describe, expect, it } from "vitest";
import { checkComplete, computeTotals, priceLabel } from "./compute";

const line = (amountCents: number, included = true) => ({ concept: "x", amountCents, included });

describe("computeTotals", () => {
  it("sums only the charged lines and applies IVA in integer cents", () => {
    const t = computeTotals([line(10000), line(5000), line(3000, false)], 2100);
    expect(t.subtotalCents).toBe(15000);
    expect(t.taxCents).toBe(3150);
    expect(t.totalCents).toBe(18150);
  });

  it("handles no charged lines", () => {
    const t = computeTotals([line(0, false)], 2100);
    expect(t).toEqual({ subtotalCents: 0, taxCents: 0, totalCents: 0 });
  });

  it("rejects non-integer cents", () => {
    expect(() => computeTotals([line(10.5)], 2100)).toThrow();
  });
});

describe("checkComplete", () => {
  const base = {
    workDescription: "Sustituir el sifón y revisar la instalación bajo el fregadero.",
    lines: [line(8000)],
    warrantyText: "Garantía comercial de 6 meses sobre la reparación.",
    warrantyResponsible: "Praetoria Servicios",
    scheduledFor: new Date("2026-09-10T09:00:00Z"),
    estimatedTimeframe: null,
    professionalRef: "Fontanero interno #3",
    validUntil: new Date("2026-09-20T00:00:00Z"),
    isEstimate: false,
    maxTotalCents: null,
  };

  it("passes a complete quote", () => {
    expect(checkComplete(base).complete).toBe(true);
  });

  it("lists every missing D4 field", () => {
    const r = checkComplete({
      workDescription: "",
      lines: [],
      warrantyText: null,
      warrantyResponsible: null,
      scheduledFor: null,
      estimatedTimeframe: null,
      professionalRef: null,
      validUntil: null,
      isEstimate: true,
      maxTotalCents: 0,
    });
    expect(r.complete).toBe(false);
    expect(r.missing.length).toBeGreaterThanOrEqual(7);
    expect(r.missing).toContain("Garantía aplicable");
    expect(r.missing).toContain("Total máximo (al ser una estimación)");
  });

  it("an estimate needs a max total", () => {
    expect(checkComplete({ ...base, isEstimate: true, maxTotalCents: null }).complete).toBe(false);
    expect(checkComplete({ ...base, isEstimate: true, maxTotalCents: 20000 }).complete).toBe(true);
  });
});

describe("priceLabel", () => {
  it("never says precio cerrado for an estimate", () => {
    expect(priceLabel(true)).not.toContain("Precio cerrado");
    expect(priceLabel(false)).toBe("Precio cerrado");
  });
});
