import { describe, expect, it } from "vitest";
import { coverageResultSchema, type CoverageResult } from "@/domain/analysis/schema";
import {
  buildCoverageBreakdown,
  buildDraft,
  DRAFT_PENDING_LABEL,
  needsPolicyDocument,
  VERDICT_LABEL,
} from "./coverage";

const withPages: CoverageResult = coverageResultSchema.parse({
  verdict: "DUDOSA",
  applicableClause: "Garantía de daños por agua de las condiciones particulares.",
  limitsAndExcess: ["Franquicia de 90 EUR en daños por agua"],
  deadlines: ["Comunicación del siniestro en 7 días"],
  relevantExclusions: ["Falta de mantenimiento"],
  factsToProve: ["Origen súbito del daño", "Fecha de detección"],
  recommendedDocumentation: ["Fotografías", "Factura"],
  references: [{ document: "Condiciones particulares", page: 1, quote: "Daños por agua: cubierto" }],
  openQuestions: ["¿Hay parte de un fontanero?"],
  confidence: 35,
});

const noPages: CoverageResult = coverageResultSchema.parse({
  verdict: "INFORMACION_INSUFICIENTE",
  references: [],
  factsToProve: [],
  recommendedDocumentation: [],
  confidence: 10,
});

describe("buildCoverageBreakdown — D5 three-way split", () => {
  const b = buildCoverageBreakdown(withPages);

  it("keeps the policy clause separate, with its page references", () => {
    expect(b.policyClause.text).toContain("daños por agua");
    expect(b.policyClause.references[0]).toMatchObject({ page: 1 });
    expect(b.policyClause.exclusions).toContain("Falta de mantenimiento");
  });

  it("the legal norm is the real process, not an invented article", () => {
    const joined = b.legalNorm.process.join(" ");
    expect(joined).toContain("perito");
    expect(joined).toContain("Defensor del Asegurado");
    expect(joined).toContain("DGSFP");
    expect(joined).not.toMatch(/art[íi]culo \d+/i);
  });

  it("the assessment is hedged and never promises coverage", () => {
    expect(b.assessment.verdictLabel).toBe(VERDICT_LABEL.DUDOSA);
    expect(b.assessment.caveats.join(" ")).toContain("no garantiza la cobertura");
    expect(b.assessment.caveats.join(" ")).toContain("falta de mantenimiento");
  });
});

describe("needsPolicyDocument", () => {
  it("is true when the verdict is INFORMACION_INSUFICIENTE", () => {
    expect(needsPolicyDocument(noPages)).toBe(true);
  });
  it("is false once there is an applicable clause with references", () => {
    expect(needsPolicyDocument(withPages)).toBe(false);
  });
});

describe("buildDraft — the four required parts", () => {
  const draft = buildDraft(withPages, {
    clientName: "Ana",
    reference: "PS-1234-ABCD",
    insurerName: "Mapfre",
    policyNumber: "123456",
    problemSummary: "Mancha de humedad en el techo del baño tras una lluvia intensa.",
  });

  it("includes HECHOS, PETICIÓN, FUNDAMENTO CONTRACTUAL and ANEXOS", () => {
    expect(draft).toContain("HECHOS");
    expect(draft).toContain("PETICIÓN");
    expect(draft).toContain("FUNDAMENTO CONTRACTUAL");
    expect(draft).toContain("ANEXOS");
  });

  it("carries the page reference in the fundamento", () => {
    expect(draft).toContain('Condiciones particulares, pág. 1: "Daños por agua: cubierto"');
  });

  it("names the insurer and policy, and the facts to prove", () => {
    expect(draft).toContain("Mapfre");
    expect(draft).toContain("123456");
    expect(draft).toContain("Origen súbito del daño");
  });

  it("is explicitly a pending-review orientative draft", () => {
    expect(draft.toLowerCase()).toContain("borrador orientativo pendiente de revisión");
    expect(draft.toLowerCase()).toContain("ni garantiza la cobertura");
  });

  it("without a clause, states the condition will be supplied and still lists default anexos", () => {
    const d = buildDraft(noPages, {
      clientName: "Ana",
      reference: "PS-1",
      insurerName: null,
      policyNumber: null,
      problemSummary: "Daño.",
    });
    expect(d).toContain("[aseguradora]");
    expect(d).toContain("condicionado completo");
    expect(d).toContain("Copia de la póliza");
  });
});

describe("labels", () => {
  it("the pending label is the D5 wording", () => {
    expect(DRAFT_PENDING_LABEL).toBe("Borrador pendiente de revisión");
  });
});
