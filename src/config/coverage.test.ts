import { describe, expect, it } from "vitest";
import { checkCoverage } from "./coverage";

describe("checkCoverage", () => {
  it("matches a served municipality by name, accent-insensitively", () => {
    expect(checkCoverage({ municipality: "Valencia" }).covered).toBe(true);
    expect(checkCoverage({ municipality: "  almàssera " }).covered).toBe(true);
    expect(checkCoverage({ municipality: "Almassera" }).covered).toBe(true);
  });

  it("matches by postal code", () => {
    const r = checkCoverage({ postalCode: "46100" });
    expect(r.covered).toBe(true);
    expect(r.matchedBy).toBe("postalCode");
    expect(r.area?.municipality).toBe("Burjassot");
  });

  it("prefers a postal-code match", () => {
    const r = checkCoverage({ municipality: "Valencia", postalCode: "46001" });
    expect(r.matchedBy).toBe("postalCode");
  });

  it("returns not covered for an unserved area", () => {
    const r = checkCoverage({ municipality: "Sevilla", postalCode: "41001" });
    expect(r.covered).toBe(false);
    expect(r.matchedBy).toBeNull();
  });

  it("treats any Valencia-province postcode as within the wider area (D-013)", () => {
    const r = checkCoverage({ municipality: "Torrent", postalCode: "46900" });
    expect(r.covered).toBe(true);
    expect(r.matchedBy).toBe("area");
    expect(r.area).toBeNull();
  });

  it("still prefers a confirmed list match over the wider-area rule", () => {
    expect(checkCoverage({ postalCode: "46001" }).matchedBy).toBe("postalCode");
  });

  it("handles empty input", () => {
    expect(checkCoverage({}).covered).toBe(false);
  });
});
