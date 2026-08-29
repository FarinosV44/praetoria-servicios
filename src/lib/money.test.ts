import { describe, expect, it } from "vitest";
import { addCents, cents, formatEuros, parseEuros, taxAmount, multiplyCents } from "./money";

describe("money", () => {
  it("rejects non-integer cents", () => {
    expect(() => cents(10.5)).toThrow();
  });

  it("parses Spanish and plain euro strings to integer cents", () => {
    expect(parseEuros("1.234,56")).toBe(123456);
    expect(parseEuros("1234,56")).toBe(123456);
    expect(parseEuros("1234.56")).toBe(123456);
    expect(parseEuros("90")).toBe(9000);
    expect(parseEuros("90 €")).toBe(9000);
  });

  it("adds without floating point drift", () => {
    // 0.1 + 0.2 in cents is exact
    expect(addCents(cents(10), cents(20))).toBe(30);
  });

  it("computes IVA from basis points", () => {
    expect(taxAmount(cents(10000), 2100)).toBe(2100); // 21% of 100.00
    expect(taxAmount(cents(9999), 2100)).toBe(2100); // rounds
  });

  it("multiplies by a factor with rounding", () => {
    expect(multiplyCents(cents(10000), 1.5)).toBe(15000);
    expect(multiplyCents(cents(333), 1 / 3)).toBe(111);
  });

  it("formats as EUR es-ES with a decimal comma", () => {
    const s = formatEuros(cents(123456));
    expect(s).toMatch(/1\.?234,56/); // grouping separator is ICU-dependent
    expect(s).toContain("€");
  });
});
