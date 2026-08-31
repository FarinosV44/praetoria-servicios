import { describe, expect, it } from "vitest";
import { isLocalPageIndexable, type LocalPageForEligibility } from "./local-page";

/**
 * Issue #25, D10 — a local (municipio) page is indexable ONLY with real,
 * differentiating content. Pure logic, test-first.
 */

const full: LocalPageForEligibility = {
  status: "PUBLICADO",
  noindex: false,
  coverageNote: "Cubrimos todo el casco urbano y el polígono norte.",
  typicalServices: ["fontaneria", "electricidad"],
  responseTimeNote: "Presupuesto en 24 h laborables; visita habitual en 2-3 días.",
  localFaq: [{ q: "¿Atendéis urgencias?", a: "Priorizamos las de riesgo." }],
  completedJobsNote: "Más de 30 intervenciones en el último año.",
  casePhotoNote: null,
};

describe("isLocalPageIndexable", () => {
  it("passes for a covered municipality with real content", () => {
    const r = isLocalPageIndexable(full, { coveredMunicipality: true });
    expect(r.indexable).toBe(true);
    expect(r.reasons).toEqual([]);
  });

  it("is not indexable if the municipality is not covered", () => {
    const r = isLocalPageIndexable(full, { coveredMunicipality: false });
    expect(r.indexable).toBe(false);
    expect(r.reasons.join(" ")).toMatch(/cobertura/i);
  });

  it("is not indexable while unpublished or flagged noindex", () => {
    expect(isLocalPageIndexable({ ...full, status: "BORRADOR" }, { coveredMunicipality: true }).indexable).toBe(false);
    expect(isLocalPageIndexable({ ...full, noindex: true }, { coveredMunicipality: true }).indexable).toBe(false);
  });

  it("requires a coverage note", () => {
    const r = isLocalPageIndexable({ ...full, coverageNote: "" }, { coveredMunicipality: true });
    expect(r.indexable).toBe(false);
    expect(r.reasons.join(" ")).toMatch(/cobertura real/i);
  });

  it("requires at least two differentiating signals beyond coverage", () => {
    const thin = {
      ...full,
      typicalServices: [],
      responseTimeNote: null,
      localFaq: [],
      completedJobsNote: "Algún trabajo.",
      casePhotoNote: null,
    };
    const r = isLocalPageIndexable(thin, { coveredMunicipality: true });
    expect(r.indexable).toBe(false);
    expect(r.reasons.join(" ")).toMatch(/contenido específico/i);

    const okWithTwo = { ...thin, responseTimeNote: "Presupuesto en 24 h." };
    expect(isLocalPageIndexable(okWithTwo, { coveredMunicipality: true }).indexable).toBe(true);
  });

  it("reports every failing reason at once", () => {
    const bad = {
      status: "BORRADOR" as const,
      noindex: true,
      coverageNote: "",
      typicalServices: [],
      responseTimeNote: null,
      localFaq: [],
      completedJobsNote: null,
      casePhotoNote: null,
    };
    const r = isLocalPageIndexable(bad, { coveredMunicipality: false });
    expect(r.indexable).toBe(false);
    expect(r.reasons.length).toBeGreaterThanOrEqual(4);
  });
});
