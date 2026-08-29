/**
 * Spanish phone normalisation and validation (issue #10).
 * Accepts common user formats and returns E.164 (+34XXXXXXXXX) or an error.
 * Spanish mobiles start with 6 or 7, landlines with 8 or 9; all are 9 digits.
 */

export type PhoneResult =
  | { ok: true; e164: string; national: string; kind: "mobile" | "landline" }
  | { ok: false; reason: "empty" | "not_numeric" | "bad_length" | "bad_prefix" | "bad_country" };

export function normalizeSpanishPhone(input: string): PhoneResult {
  const trimmed = input.trim();
  if (!trimmed) return { ok: false, reason: "empty" };

  // Keep digits; remember a leading +.
  const hadPlus = trimmed.startsWith("+") || trimmed.startsWith("00");
  let digits = trimmed.replace(/[^\d]/g, "");
  if (trimmed.startsWith("00")) digits = digits.replace(/^00/, "");

  if (!digits) return { ok: false, reason: "not_numeric" };

  // Strip a country code of 34 when present (with + / 00, or an unambiguous 11-digit form).
  if (digits.startsWith("34") && (hadPlus || digits.length === 11)) {
    digits = digits.slice(2);
  } else if (hadPlus && !digits.startsWith("34")) {
    return { ok: false, reason: "bad_country" };
  }

  if (digits.length !== 9) return { ok: false, reason: "bad_length" };

  const first = digits[0];
  if (first === "6" || first === "7") {
    return { ok: true, e164: `+34${digits}`, national: digits, kind: "mobile" };
  }
  if (first === "8" || first === "9") {
    return { ok: true, e164: `+34${digits}`, national: digits, kind: "landline" };
  }
  return { ok: false, reason: "bad_prefix" };
}

export function isValidSpanishPhone(input: string): boolean {
  return normalizeSpanishPhone(input).ok;
}
