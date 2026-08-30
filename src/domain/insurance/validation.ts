import { LIMITS } from "@/config/limits";
import { detectImageType } from "@/domain/photos/validation";

/**
 * Insurance-document upload validation (issue #14). Like photos, the type is
 * decided by the file's actual bytes, never by extension or declared MIME.
 * PDFs are allowed here (they are not for photos).
 */

export type DetectedDocType = "application/pdf" | "image/jpeg" | "image/png" | "image/webp" | null;

export function detectDocumentType(buf: Uint8Array): DetectedDocType {
  if (buf.length >= 5 && buf[0] === 0x25 && buf[1] === 0x50 && buf[2] === 0x44 && buf[3] === 0x46) {
    return "application/pdf"; // "%PDF"
  }
  const img = detectImageType(buf);
  if (img === "image/jpeg" || img === "image/png" || img === "image/webp") return img;
  return null;
}

export type DocRejection =
  | { code: "empty"; message: string }
  | { code: "too_many"; message: string }
  | { code: "too_large"; message: string }
  | { code: "bad_type"; message: string };

export function validateInsuranceDoc(
  candidate: { bytes: Uint8Array; size: number },
  currentCount: number,
): { ok: true; type: Exclude<DetectedDocType, null> } | { ok: false; error: DocRejection } {
  if (candidate.size === 0 || candidate.bytes.length === 0) {
    return { ok: false, error: { code: "empty", message: "El archivo está vacío" } };
  }
  if (currentCount >= LIMITS.insuranceDocs.max) {
    return {
      ok: false,
      error: { code: "too_many", message: `Máximo ${LIMITS.insuranceDocs.max} documentos` },
    };
  }
  if (candidate.size > LIMITS.insuranceDocs.maxBytes) {
    const mb = Math.round(LIMITS.insuranceDocs.maxBytes / (1024 * 1024));
    return {
      ok: false,
      error: { code: "too_large", message: `Cada documento debe pesar menos de ${mb} MB` },
    };
  }
  const type = detectDocumentType(candidate.bytes);
  if (!type) {
    return {
      ok: false,
      error: {
        code: "bad_type",
        message: "El archivo debe ser un PDF o una imagen (JPG, PNG o WebP)",
      },
    };
  }
  return { ok: true, type };
}
