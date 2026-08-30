import { describe, expect, it } from "vitest";
import { TRUST_CHARTER, commitmentsAtAcceptance } from "./trust-charter";

/**
 * Issue #21 AC — "cada promesa comercial corresponde a una función o proceso
 * operativo real" + "existe versión y fecha de vigencia".
 */

describe("Carta de Confianza", () => {
  it("has a version and an ISO effective date", () => {
    expect(TRUST_CHARTER.version).toMatch(/^\d+\.\d+$/);
    expect(TRUST_CHARTER.effectiveDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(Number.isNaN(Date.parse(TRUST_CHARTER.effectiveDate))).toBe(false);
  });

  it("every commitment names a real backing function/process", () => {
    for (const c of TRUST_CHARTER.commitments) {
      expect(c.id, `commitment ${c.title}`).toMatch(/^[a-z-]+$/);
      expect(c.title.length).toBeGreaterThan(3);
      expect(c.body.length).toBeGreaterThan(20);
      expect(c.backing.trim().length, `backing for "${c.title}"`).toBeGreaterThan(15);
    }
  });

  it("distinguishes what Praetoria provides from what the professional executes", () => {
    expect(TRUST_CHARTER.praetoriaProvides.length).toBeGreaterThan(2);
    expect(TRUST_CHARTER.professionalExecutes.length).toBeGreaterThan(2);
  });

  it("surfaces potential costs before acceptance", () => {
    expect(TRUST_CHARTER.preAcceptanceCosts.some((c) => /visita/i.test(c))).toBe(true);
    expect(TRUST_CHARTER.preAcceptanceCosts.some((c) => /impuesto|IVA/i.test(c))).toBe(true);
    expect(TRUST_CHARTER.preAcceptanceCosts.some((c) => /adicional|extra/i.test(c))).toBe(true);
  });

  it("commitmentsAtAcceptance is a non-empty subset flagged atAcceptance", () => {
    const subset = commitmentsAtAcceptance();
    expect(subset.length).toBeGreaterThan(0);
    expect(subset.every((c) => c.atAcceptance === true)).toBe(true);
    expect(subset.length).toBeLessThan(TRUST_CHARTER.commitments.length);
  });

  it("the landing summary is short and readable", () => {
    expect(TRUST_CHARTER.summary.length).toBeLessThanOrEqual(7);
    for (const s of TRUST_CHARTER.summary) expect(s.length).toBeLessThan(160);
  });
});
