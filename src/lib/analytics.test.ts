import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  ANALYTICS_EVENTS,
  sanitizeProps,
  setAnalyticsConsent,
  isAnalyticsAllowed,
  track,
} from "./analytics";

/**
 * Issue #18 — analytics carries ZERO PII and is consent-gated.
 * These are pure-logic tests written before the implementation (D-007).
 */

const PII_INPUT = {
  device: "mobile",
  category: "fontaneria",
  // every one of these must be stripped
  phone: "600111222",
  email: "ana@example.com",
  description: "Se me ha roto el grifo del baño y gotea sin parar",
  photo: "https://blob/photo-1.jpg",
  name: "Ana Pérez",
  address: "Calle Falsa 123",
  municipality: "Valencia",
  postalCode: "46001",
};

describe("sanitizeProps", () => {
  it("keeps only the allowlisted keys and drops every PII key", () => {
    const out = sanitizeProps(PII_INPUT);
    expect(out).toEqual({ device: "mobile", category: "fontaneria" });
    for (const k of ["phone", "email", "description", "photo", "name", "address", "municipality", "postalCode"]) {
      expect(out).not.toHaveProperty(k);
    }
  });

  it("no PII value survives anywhere in the output", () => {
    const serialized = JSON.stringify(sanitizeProps(PII_INPUT));
    expect(serialized).not.toMatch(/ana@example\.com/i);
    expect(serialized).not.toMatch(/600111222/);
    expect(serialized).not.toMatch(/Ana P/i);
    expect(serialized).not.toMatch(/Calle Falsa/i);
    expect(serialized).not.toMatch(/roto el grifo/i);
  });

  it("drops an allowlisted key whose value looks like PII", () => {
    expect(sanitizeProps({ category: "ana@example.com" })).toEqual({});
    expect(sanitizeProps({ category: "has spaces and is long free text here" })).toEqual({});
    expect(sanitizeProps({ source: "+34 600 11 12 22" })).toEqual({});
  });

  it("keeps device/category and clamps numeric fields", () => {
    expect(sanitizeProps({ device: "desktop", category: "no-se" })).toEqual({
      device: "desktop",
      category: "no-se",
    });
    expect(sanitizeProps({ device: "phone-booth" })).toEqual({});
    expect(sanitizeProps({ count: 3, durationMs: 1200 })).toEqual({ count: 3, durationMs: 1200 });
    expect(sanitizeProps({ count: -1 })).toEqual({});
    expect(sanitizeProps({ durationMs: Number.POSITIVE_INFINITY })).toEqual({});
  });

  it("carries the two funnel dimensions the AC requires: device and category", () => {
    const out = sanitizeProps({ device: "tablet", category: "electricidad", step: "photos" });
    expect(out.device).toBe("tablet");
    expect(out.category).toBe("electricidad");
  });
});

describe("track — consent gate", () => {
  beforeEach(() => setAnalyticsConsent(false));
  afterEach(() => setAnalyticsConsent(false));

  it("does not fire without ANALYTICS consent", () => {
    expect(isAnalyticsAllowed()).toBe(false);
    expect(track("landing_cta_click", { category: "fontaneria" }).sent).toBe(false);
  });

  it("fires once consent is granted, with sanitized props only", () => {
    setAnalyticsConsent(true);
    expect(isAnalyticsAllowed()).toBe(true);
    const r = track("request_submitted", {
      device: "mobile",
      category: "fontaneria",
      phone: "600111222",
    } as never);
    expect(r.sent).toBe(true);
    expect(r.event).toBe("request_submitted");
    expect(r.props).toEqual({ device: "mobile", category: "fontaneria" });
  });

  it("refuses an event name outside the fixed list", () => {
    setAnalyticsConsent(true);
    expect(track("something_made_up" as never).sent).toBe(false);
  });

  it("exposes the fixed event list from the issue", () => {
    expect(ANALYTICS_EVENTS).toContain("landing_cta_click");
    expect(ANALYTICS_EVENTS).toContain("quote_accepted");
    expect(ANALYTICS_EVENTS).toContain("insurance_completed");
  });
});
