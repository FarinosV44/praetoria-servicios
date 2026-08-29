import type { OcrEngine, OcrInput, OcrResult } from "./index";

/**
 * Mock OCR for development/tests. Returns canned policy-like text unless the
 * input is empty (then "unreadable", to exercise issue #14's UNREADABLE path).
 */
export function createMockOcrEngine(): OcrEngine {
  return {
    async extract(input: OcrInput): Promise<OcrResult> {
      if (input.data.byteLength === 0) {
        return { pages: [], unreadable: true };
      }
      return {
        pages: [
          {
            page: 1,
            ocr: input.contentType !== "application/pdf",
            text:
              "CONDICIONES PARTICULARES. Tomador: [nombre]. Póliza nº 000000. " +
              "Vigencia: 01/01/2026 a 31/12/2026. Garantías contratadas: Incendio, " +
              "Daños por agua, Responsabilidad civil. Franquicia daños por agua: 90 EUR.",
          },
          {
            page: 2,
            ocr: input.contentType !== "application/pdf",
            text:
              "CONDICIONES GENERALES. Exclusiones: daños preexistentes, falta de " +
              "mantenimiento, humedades por condensación. Plazo de comunicación del " +
              "siniestro: 7 días desde su conocimiento.",
          },
        ],
        unreadable: false,
      };
    },
  };
}
