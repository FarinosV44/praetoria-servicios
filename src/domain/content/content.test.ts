import { describe, expect, it } from "vitest";
import { toSlug, isValidSlug } from "./slug";
import { ARTICLE_STATUSES, validateArticleTransition } from "./article-status";
import { bodySchema, headingsOf, faqItemsOf } from "./blocks";
import { articleWarnings } from "./quality";

/** Issue #24 — pure content logic, test-first (D-007). */

describe("slug", () => {
  it("normalises accents, spaces and case", () => {
    expect(toSlug("Guía rápida: fugas de agua en casa")).toBe("guia-rapida-fugas-de-agua-en-casa");
    expect(toSlug("  ¿Qué hago si salta el diferencial?  ")).toBe("que-hago-si-salta-el-diferencial");
  });
  it("validates the shape", () => {
    expect(isValidSlug("fugas-de-agua")).toBe(true);
    expect(isValidSlug("Fugas De Agua")).toBe(false);
    expect(isValidSlug("-leading")).toBe(false);
    expect(isValidSlug("a")).toBe(false);
  });
});

describe("article status machine", () => {
  it("has the five states", () => {
    expect([...ARTICLE_STATUSES]).toEqual([
      "BORRADOR",
      "REVISION",
      "PROGRAMADO",
      "PUBLICADO",
      "ARCHIVADO",
    ]);
  });
  it("cannot publish or schedule without a human review", () => {
    const r = validateArticleTransition({ from: "REVISION", to: "PUBLICADO", reviewedByHuman: false });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toBe("human_review_required");
    expect(
      validateArticleTransition({ from: "REVISION", to: "PUBLICADO", reviewedByHuman: true }).ok,
    ).toBe(true);
  });
  it("PROGRAMADO needs a future publish date", () => {
    const now = new Date("2026-09-01T00:00:00Z");
    expect(
      validateArticleTransition({
        from: "REVISION",
        to: "PROGRAMADO",
        reviewedByHuman: true,
        publishAt: new Date("2026-08-01T00:00:00Z"),
        now,
      }).ok,
    ).toBe(false);
    expect(
      validateArticleTransition({
        from: "REVISION",
        to: "PROGRAMADO",
        reviewedByHuman: true,
        publishAt: new Date("2026-09-10T00:00:00Z"),
        now,
      }).ok,
    ).toBe(true);
  });
  it("rejects an invalid jump", () => {
    expect(validateArticleTransition({ from: "BORRADOR", to: "PUBLICADO", reviewedByHuman: true }).ok).toBe(
      false,
    );
  });
});

describe("block body", () => {
  const body = [
    { type: "heading", level: 2, text: "Qué hacer" },
    { type: "text", md: "Cierra la **llave de paso**." },
    { type: "list", ordered: true, items: ["Corta el agua", "Llámanos"] },
    { type: "faq", items: [{ q: "¿Es urgente?", a: "Depende del caudal." }] },
  ];

  it("validates a well-formed body", () => {
    expect(bodySchema.safeParse(body).success).toBe(true);
  });
  it("rejects an unknown block type and a bad heading level", () => {
    expect(bodySchema.safeParse([{ type: "marquee", text: "no" }]).success).toBe(false);
    expect(bodySchema.safeParse([{ type: "heading", level: 5, text: "x" }]).success).toBe(false);
  });
  it("extracts headings for the table of contents", () => {
    expect(headingsOf(body)).toEqual([{ level: 2, text: "Qué hacer", id: "que-hacer" }]);
  });
  it("extracts FAQ items for JSON-LD", () => {
    expect(faqItemsOf(body)).toEqual([{ q: "¿Es urgente?", a: "Depende del caudal." }]);
  });
});

describe("quality warnings", () => {
  const base = {
    title: "Fugas de agua",
    slug: "fugas-de-agua",
    author: "Equipo Praetoria",
    metaDescription: "Guía breve sobre fugas de agua en casa.",
    body: [{ type: "image", src: "/x.jpg", alt: "" }],
  };

  it("flags a duplicate title / slug", () => {
    const w = articleWarnings({
      article: base,
      otherTitles: ["fugas de agua"],
      otherSlugs: ["fugas-de-agua"],
    });
    expect(w.join(" ")).toMatch(/título duplicado/i);
    expect(w.join(" ")).toMatch(/slug duplicado/i);
  });
  it("flags a missing author and an image without alt", () => {
    const w = articleWarnings({
      article: { ...base, author: "" },
      otherTitles: [],
      otherSlugs: [],
    });
    expect(w.join(" ")).toMatch(/autor/i);
    expect(w.join(" ")).toMatch(/alt/i);
  });
  it("is clean for a good article", () => {
    const w = articleWarnings({
      article: {
        ...base,
        body: [{ type: "text", md: "Contenido." }],
      },
      otherTitles: [],
      otherSlugs: [],
    });
    expect(w).toEqual([]);
  });
});
