import { describe, expect, it } from "vitest";
import {
  canSend,
  channelForContact,
  idempotencyKey,
  KIND_PURPOSE,
} from "./schema";
import { bodyPreview, renderTemplate } from "./templates";

describe("canSend — consent gate (issue #13: no marketing under operational consent)", () => {
  it("always allows a transactional confirmation", () => {
    expect(canSend("CONFIRMATION", {})).toBe(true);
    expect(canSend("CONFIRMATION", { REQUEST_HANDLING: false })).toBe(true);
  });

  it("allows operational messages under request-handling consent", () => {
    expect(canSend("INFO_REQUEST", { REQUEST_HANDLING: true })).toBe(true);
    expect(canSend("QUOTE_AVAILABLE", { REQUEST_HANDLING: true, OPERATIONAL_COMMS: false })).toBe(
      true,
    );
  });

  it("blocks operational messages if request-handling consent was withdrawn", () => {
    expect(canSend("INFO_REQUEST", { REQUEST_HANDLING: false })).toBe(false);
  });

  it("a marketing-purpose message needs explicit marketing consent, not operational", () => {
    // Synthesise a marketing kind by overriding the purpose map for the test.
    const original = KIND_PURPOSE.GENERIC;
    KIND_PURPOSE.GENERIC = "marketing";
    try {
      expect(canSend("GENERIC", { OPERATIONAL_COMMS: true, MARKETING: false })).toBe(false);
      expect(canSend("GENERIC", { MARKETING: true })).toBe(true);
    } finally {
      KIND_PURPOSE.GENERIC = original;
    }
  });
});

describe("channelForContact", () => {
  it("honours the preferred channel when the matching detail exists", () => {
    expect(
      channelForContact({ email: "a@b.com", phone: "34600", preferredChannel: "EMAIL" }),
    ).toBe("EMAIL");
    expect(
      channelForContact({ email: "a@b.com", phone: "34600", preferredChannel: "WHATSAPP" }),
    ).toBe("WHATSAPP");
  });

  it("falls back to the other channel when the preferred detail is missing", () => {
    expect(channelForContact({ email: null, phone: "34600", preferredChannel: "EMAIL" })).toBe(
      "WHATSAPP",
    );
    expect(channelForContact({ email: "a@b.com", phone: null, preferredChannel: "WHATSAPP" })).toBe(
      "EMAIL",
    );
  });

  it("returns null when there is no way to reach the client", () => {
    expect(channelForContact({ email: null, phone: null, preferredChannel: "EMAIL" })).toBeNull();
    expect(channelForContact({ email: "  ", phone: "", preferredChannel: "WHATSAPP" })).toBeNull();
  });
});

describe("idempotencyKey", () => {
  it("is stable per (request, kind) and differs across kinds", () => {
    expect(idempotencyKey("req_1", "CONFIRMATION")).toBe("req_1:CONFIRMATION");
    expect(idempotencyKey("req_1", "CONFIRMATION")).toBe(idempotencyKey("req_1", "CONFIRMATION"));
    expect(idempotencyKey("req_1", "QUOTE_AVAILABLE")).not.toBe(
      idempotencyKey("req_1", "CONFIRMATION"),
    );
  });
});

describe("renderTemplate", () => {
  const ctx = { clientName: "Ana", reference: "PS-7Q2M-KX9A" };

  it("fills the brand, name and reference and leaves no placeholders", () => {
    const m = renderTemplate("CONFIRMATION", ctx);
    expect(m.subject).toContain("PS-7Q2M-KX9A");
    expect(m.subject).toContain("Praetoria Servicios");
    expect(m.text).toContain("Hola Ana:");
    expect(m.text).not.toMatch(/\{[a-z]+\}/i);
    expect(m.html).not.toMatch(/\{[a-z]+\}/i);
    expect(m.html).toContain("<!doctype html>");
  });

  it("uses a configurable brand name", () => {
    const m = renderTemplate("CONFIRMATION", { ...ctx, brand: "Praetoria" });
    expect(m.subject).toContain("Praetoria");
    expect(m.subject).not.toContain("Praetoria Servicios");
  });

  it("INFO_REQUEST embeds the admin message", () => {
    const m = renderTemplate("INFO_REQUEST", { ...ctx, message: "¿Qué modelo de caldera es?" });
    expect(m.text).toContain("¿Qué modelo de caldera es?");
  });

  it("QUOTE_AVAILABLE includes the URL when given and a fallback line when not", () => {
    const withUrl = renderTemplate("QUOTE_AVAILABLE", { ...ctx, url: "https://x.test/s/tok" });
    expect(withUrl.text).toContain("https://x.test/s/tok");
    const without = renderTemplate("QUOTE_AVAILABLE", ctx);
    expect(without.text).not.toContain("http");
    expect(without.text).toContain("canal preferido");
  });

  it("escapes HTML in substituted values", () => {
    const m = renderTemplate("INFO_REQUEST", { ...ctx, message: "<script>alert(1)</script>" });
    expect(m.html).not.toContain("<script>alert(1)</script>");
    expect(m.html).toContain("&lt;script&gt;");
  });
});

describe("bodyPreview", () => {
  it("collapses whitespace and truncates", () => {
    expect(bodyPreview("a\n\n  b   c")).toBe("a b c");
    expect(bodyPreview("x".repeat(300)).length).toBe(240);
    expect(bodyPreview("x".repeat(300)).endsWith("…")).toBe(true);
  });
});
