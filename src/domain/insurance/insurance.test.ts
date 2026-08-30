import { describe, expect, it } from "vitest";
import {
  DOC_KINDS,
  EMPTY_EXTRACTION,
  extractionStatusFor,
  missingDocKinds,
  missingSummary,
  policyExtractionSchema,
} from "./schema";
import { extractPolicyFields } from "./extract";
import { detectDocumentType, validateInsuranceDoc } from "./validation";

// Mirrors the mock OcrEngine output.
const PARTICULARES =
  "CONDICIONES PARTICULARES. Tomador: Ana. Póliza nº 123456. " +
  "Vigencia: 01/01/2026 a 31/12/2026. Garantías contratadas: Incendio, Daños por agua, " +
  "Responsabilidad civil. Franquicia daños por agua: 90 EUR.";
const GENERALES =
  "CONDICIONES GENERALES. Exclusiones: daños preexistentes, falta de mantenimiento, " +
  "humedades por condensación. Plazo de comunicación del siniestro: 7 días.";

describe("extractPolicyFields", () => {
  const result = extractPolicyFields([
    { docId: "doc-a", pages: [{ page: 1, text: PARTICULARES }] },
    { docId: "doc-b", pages: [{ page: 2, text: GENERALES }] },
  ]);

  it("validates against the schema", () => {
    expect(policyExtractionSchema.safeParse(result).success).toBe(true);
  });

  it("extracts policy number and validity as ISO", () => {
    expect(result.policyNumber).toBe("123456");
    expect(result.validFrom).toBe("2026-01-01");
    expect(result.validTo).toBe("2026-12-31");
  });

  it("extracts coverages with a page reference", () => {
    const names = result.coverages.map((c) => c.text.toLowerCase());
    expect(names).toContain("incendio");
    expect(names).toContain("daños por agua");
    expect(result.coverages[0].ref).toEqual({ doc: "doc-a", page: 1 });
  });

  it("extracts an exclusion from the generales doc with its page ref", () => {
    const exc = result.exclusions.map((e) => e.text.toLowerCase());
    expect(exc.join(" ")).toContain("falta de mantenimiento");
    expect(result.exclusions[0].ref).toEqual({ doc: "doc-b", page: 2 });
  });

  it("extracts the water-damage franchise", () => {
    expect(result.franchises.some((f) => /90\s*EUR/i.test(f.text))).toBe(true);
  });

  it("returns an empty extraction for empty input", () => {
    const empty = extractPolicyFields([]);
    expect(empty).toEqual(EMPTY_EXTRACTION);
  });
});

describe("extractionStatusFor", () => {
  it("PENDING with no documents", () => {
    expect(
      extractionStatusFor(EMPTY_EXTRACTION, { anyDocuments: false, anyReadable: false }),
    ).toBe("PENDING");
  });

  it("UNREADABLE when documents exist but nothing could be read", () => {
    expect(
      extractionStatusFor(EMPTY_EXTRACTION, { anyDocuments: true, anyReadable: false }),
    ).toBe("UNREADABLE");
  });

  it("PARTIAL when the core identity is incomplete", () => {
    expect(
      extractionStatusFor(
        { ...EMPTY_EXTRACTION, policyNumber: "123456" },
        { anyDocuments: true, anyReadable: true },
      ),
    ).toBe("PARTIAL");
  });

  it("DONE when insurer + policy + validity + a coverage are present", () => {
    expect(
      extractionStatusFor(
        {
          ...EMPTY_EXTRACTION,
          insurerName: "Mapfre",
          policyNumber: "1",
          validFrom: "2026-01-01",
          validTo: "2026-12-31",
          coverages: [{ text: "Incendio", ref: null }],
        },
        { anyDocuments: true, anyReadable: true },
      ),
    ).toBe("DONE");
  });
});

describe("missing docs", () => {
  it("flags both condiciones as missing when none uploaded", () => {
    expect(missingDocKinds([])).toEqual(["condiciones_particulares", "condiciones_generales"]);
  });
  it("clears the flag once a kind is present", () => {
    expect(missingDocKinds(["condiciones_particulares"])).toEqual(["condiciones_generales"]);
  });
  it("summary lists documents and unidentified fields", () => {
    const s = missingSummary(["condiciones_particulares"], EMPTY_EXTRACTION);
    expect(s.join(" ")).toContain("Condiciones generales");
    expect(s.join(" ")).toContain("aseguradora");
  });
});

describe("detectDocumentType / validateInsuranceDoc", () => {
  it("detects a PDF by its magic bytes", () => {
    expect(detectDocumentType(new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d]))).toBe(
      "application/pdf",
    );
  });
  it("rejects an unknown type", () => {
    const r = validateInsuranceDoc({ bytes: new Uint8Array([1, 2, 3, 4, 5]), size: 5 }, 0);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe("bad_type");
  });
  it("rejects an empty file", () => {
    const r = validateInsuranceDoc({ bytes: new Uint8Array(), size: 0 }, 0);
    expect(r.ok).toBe(false);
  });
  it("accepts a PDF within limits", () => {
    const r = validateInsuranceDoc(
      { bytes: new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d]), size: 5 },
      0,
    );
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.type).toBe("application/pdf");
  });
});

describe("DOC_KINDS", () => {
  it("is the three-kind taxonomy", () => {
    expect(DOC_KINDS).toEqual(["condiciones_particulares", "condiciones_generales", "otro"]);
  });
});
