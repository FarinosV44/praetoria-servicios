import { describe, expect, it } from "vitest";
import { internalLinkingGaps, type GapInputs } from "./linking-gaps";

const base: GapInputs = {
  problems: [
    { slug: "fuga-de-agua", title: "Fuga de agua en casa", trade: "fontaneria" },
    { slug: "montaje-de-armario", title: "Montaje de un armario", trade: "montaje" },
  ],
  serviceTradeKeys: ["fontaneria"],
  localPages: [
    { slug: "burjassot", municipality: "Burjassot", indexable: true, reasons: [], status: "PUBLICADO" },
    {
      slug: "godella",
      municipality: "Godella",
      indexable: false,
      reasons: ["Falta una nota de cobertura real."],
      status: "PUBLICADO",
    },
    { slug: "draft", municipality: "X", indexable: false, reasons: ["borrador"], status: "BORRADOR" },
  ],
  articles: [
    { slug: "con-enlaces", title: "Guía con enlaces", internalLinkCount: 3, status: "PUBLICADO" },
    { slug: "sin-enlaces", title: "Guía sin enlaces", internalLinkCount: 0, status: "PUBLICADO" },
    { slug: "borrador", title: "Borrador", internalLinkCount: 0, status: "BORRADOR" },
  ],
};

describe("internalLinkingGaps", () => {
  it("flags a problem whose trade has no service page", () => {
    const g = internalLinkingGaps(base);
    const svc = g.filter((x) => x.area === "servicio");
    expect(svc).toHaveLength(1);
    expect(svc[0].detail).toMatch(/montaje/);
  });

  it("flags a published-but-not-indexable zone with its reasons, not drafts", () => {
    const zonas = internalLinkingGaps(base).filter((x) => x.area === "zona");
    expect(zonas).toHaveLength(1);
    expect(zonas[0].title).toMatch(/Godella/);
    expect(zonas[0].detail).toMatch(/nota de cobertura/i);
  });

  it("flags only published articles with zero internal links", () => {
    const guias = internalLinkingGaps(base).filter((x) => x.area === "guía");
    expect(guias.map((x) => x.href)).toEqual(["/guias/sin-enlaces"]);
  });

  it("every gap carries a concrete action (AC-27-alertaction)", () => {
    for (const g of internalLinkingGaps(base)) {
      expect(g.action.trim().length).toBeGreaterThan(10);
      expect(g.kind).toBe("recommendation");
    }
  });
});
