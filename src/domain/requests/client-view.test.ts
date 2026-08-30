import { describe, expect, it } from "vitest";
import { REQUEST_STATUSES } from "./state-machine";
import { canAddInfo, canDecideQuote, clientStatusView } from "./client-view";

describe("clientStatusView", () => {
  it("covers every internal status with a plain-language view and no raw enum", () => {
    for (const status of REQUEST_STATUSES) {
      const v = clientStatusView(status);
      expect(v.label.length).toBeGreaterThan(3);
      expect(v.description.length).toBeGreaterThan(10);
      // the client-facing text never leaks the internal enum token
      expect(`${v.label} ${v.description}`).not.toContain(status);
      expect(["info", "action", "good", "ended"]).toContain(v.tone);
    }
  });

  it("marks the states where the client must act", () => {
    expect(clientStatusView("REQUIERE_INFORMACION").awaitingClient).toBe(true);
    expect(clientStatusView("PRESUPUESTO_ENVIADO").awaitingClient).toBe(true);
    expect(clientStatusView("PENDIENTE_ANALISIS").awaitingClient).toBe(false);
    expect(clientStatusView("EN_REVISION").awaitingClient).toBe(false);
  });
});

describe("canDecideQuote / canAddInfo", () => {
  it("a quote decision is only possible while the quote is sent", () => {
    expect(canDecideQuote("PRESUPUESTO_ENVIADO")).toBe(true);
    expect(canDecideQuote("ACEPTADA")).toBe(false);
    expect(canDecideQuote("EN_REVISION")).toBe(false);
  });

  it("info can only be added when it was requested", () => {
    expect(canAddInfo("REQUIERE_INFORMACION")).toBe(true);
    expect(canAddInfo("PENDIENTE_ANALISIS")).toBe(false);
  });
});
