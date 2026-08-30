import { describe, expect, it } from "vitest";
import { normalizeSpanishPhone, phoneLast4Matches } from "./phone";

describe("normalizeSpanishPhone", () => {
  it("normalises common mobile formats to E.164", () => {
    for (const input of [
      "600111222",
      "600 11 12 22",
      "+34600111222",
      "0034 600 111 222",
      "34600111222",
    ]) {
      const r = normalizeSpanishPhone(input);
      expect(r.ok, input).toBe(true);
      if (r.ok) {
        expect(r.e164).toBe("+34600111222");
        expect(r.kind).toBe("mobile");
      }
    }
  });

  it("accepts landlines", () => {
    const r = normalizeSpanishPhone("961234567");
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.kind).toBe("landline");
  });

  it("rejects wrong length", () => {
    const r = normalizeSpanishPhone("6001112");
    expect(r).toEqual({ ok: false, reason: "bad_length" });
  });

  it("rejects a non-Spanish country code", () => {
    const r = normalizeSpanishPhone("+33123456789");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe("bad_country");
  });

  it("rejects a bad national prefix", () => {
    const r = normalizeSpanishPhone("100200300");
    expect(r).toEqual({ ok: false, reason: "bad_prefix" });
  });

  it("rejects empty and non-numeric", () => {
    expect(normalizeSpanishPhone("")).toEqual({ ok: false, reason: "empty" });
    expect(normalizeSpanishPhone("abc")).toEqual({ ok: false, reason: "not_numeric" });
  });
});

describe("phoneLast4Matches", () => {
  it("matches the last 4 digits regardless of formatting", () => {
    expect(phoneLast4Matches("+34600111222", "1222")).toBe(true);
    expect(phoneLast4Matches("600 111 222", "1222")).toBe(true);
  });

  it("rejects a wrong or malformed attempt", () => {
    expect(phoneLast4Matches("+34600111222", "9999")).toBe(false);
    expect(phoneLast4Matches("+34600111222", "222")).toBe(false);
    expect(phoneLast4Matches("+34600111222", "12220")).toBe(false);
  });

  it("rejects when there is no stored phone", () => {
    expect(phoneLast4Matches(null, "1222")).toBe(false);
    expect(phoneLast4Matches("", "1222")).toBe(false);
    expect(phoneLast4Matches("12", "0012")).toBe(false);
  });
});
