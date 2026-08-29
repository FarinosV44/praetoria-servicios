import { LIMITS } from "@/config/limits";

/**
 * Photo upload validation (issue #6). Type is decided by the file's actual
 * bytes ("magic bytes"), never by extension or the client-declared MIME type —
 * "No se aceptan formatos ejecutables disfrazados de imagen."
 */

export type DetectedImageType = "image/jpeg" | "image/png" | "image/webp" | "image/heic" | null;

function bytesMatch(buf: Uint8Array, sig: number[], offset = 0): boolean {
  if (buf.length < offset + sig.length) return false;
  for (let i = 0; i < sig.length; i++) if (buf[offset + i] !== sig[i]) return false;
  return true;
}

const ascii = (s: string) => [...s].map((c) => c.charCodeAt(0));

/** Sniff the real image type from the leading bytes. Returns null if it is not a supported image. */
export function detectImageType(buf: Uint8Array): DetectedImageType {
  if (bytesMatch(buf, [0xff, 0xd8, 0xff])) return "image/jpeg";
  if (bytesMatch(buf, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return "image/png";
  if (bytesMatch(buf, ascii("RIFF")) && bytesMatch(buf, ascii("WEBP"), 8)) return "image/webp";
  // HEIC/HEIF: 'ftyp' box at offset 4, brand at offset 8
  if (bytesMatch(buf, ascii("ftyp"), 4)) {
    const brand = String.fromCharCode(...buf.slice(8, 12));
    if (["heic", "heix", "hevc", "heim", "heis", "mif1", "msf1"].includes(brand)) {
      return "image/heic";
    }
  }
  return null;
}

export type PhotoRejection =
  | { code: "not_an_image"; message: string }
  | { code: "too_large"; message: string }
  | { code: "too_many"; message: string }
  | { code: "empty"; message: string };

export interface PhotoCandidate {
  bytes: Uint8Array;
  declaredType: string;
  size: number;
}

export function validatePhoto(
  candidate: PhotoCandidate,
  currentCount: number,
): { ok: true; type: DetectedImageType } | { ok: false; error: PhotoRejection } {
  if (candidate.size === 0 || candidate.bytes.length === 0) {
    return { ok: false, error: { code: "empty", message: "El archivo está vacío" } };
  }
  if (currentCount >= LIMITS.photos.max) {
    return {
      ok: false,
      error: { code: "too_many", message: `Máximo ${LIMITS.photos.max} fotos` },
    };
  }
  if (candidate.size > LIMITS.photos.maxBytes) {
    const mb = Math.round(LIMITS.photos.maxBytes / (1024 * 1024));
    return {
      ok: false,
      error: { code: "too_large", message: `Cada foto debe pesar menos de ${mb} MB` },
    };
  }
  const type = detectImageType(candidate.bytes);
  if (!type) {
    return {
      ok: false,
      error: {
        code: "not_an_image",
        message: "El archivo no es una imagen admitida (JPG, PNG, WebP o HEIC)",
      },
    };
  }
  return { ok: true, type };
}
