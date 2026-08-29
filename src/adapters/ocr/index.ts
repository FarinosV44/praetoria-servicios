/**
 * OcrEngine — text extraction from insurance policy PDFs/scans (issue #14).
 * PDFs with a text layer are read directly; scans need OCR. Page references
 * are preserved (issue #14: "La extracción conserva referencias de página").
 */
export interface PageText {
  page: number;
  text: string;
  /** true when this page's text came from OCR rather than an embedded text layer */
  ocr: boolean;
}

export interface OcrInput {
  data: Uint8Array;
  contentType: string;
  documentLabel: string;
}

export interface OcrResult {
  pages: PageText[];
  /** true when no readable text could be extracted at all */
  unreadable: boolean;
}

export interface OcrEngine {
  extract(input: OcrInput): Promise<OcrResult>;
}

export { createMockOcrEngine } from "./mock";
