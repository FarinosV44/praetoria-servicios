import { describe, expect, it } from "vitest";
import { parseSeoCsv } from "./metrics-csv";

/**
 * Issue #27 — CSV import is the fallback when no API is configured. The parser
 * maps GSC-style headers, coerces numbers, and NEVER keeps a row whose query
 * contains PII. Pure logic, test-first.
 */

const GSC = [
  "Consulta,Clics,Impresiones,CTR,Posición",
  "fontanero valencia,120,3400,3.53%,4.2",
  "reparar grifo burjassot,8,900,0.89%,12.7",
  '"presupuesto, fontanería",3,210,1.43%,18',
].join("\n");

describe("parseSeoCsv", () => {
  it("parses a Spanish GSC export: headers, percentages, decimals", () => {
    const r = parseSeoCsv(GSC);
    expect(r.rows).toHaveLength(3);
    expect(r.rows[0]).toMatchObject({
      query: "fontanero valencia",
      clicks: 120,
      impressions: 3400,
      position: 4.2,
    });
    expect(r.rows[0].ctr).toBeCloseTo(0.0353, 4);
    expect(r.rows[2].query).toBe("presupuesto, fontanería"); // quoted comma preserved
    expect(r.skipped).toBe(0);
  });

  it("maps English GSC headers too", () => {
    const r = parseSeoCsv("Query,Clicks,Impressions,CTR,Position\nabc,1,2,50%,1");
    expect(r.rows[0]).toMatchObject({ query: "abc", clicks: 1, impressions: 2, position: 1 });
  });

  it("drops — and counts — any row whose query contains PII (AC-27-nopii)", () => {
    const csv = [
      "Consulta,Clics,Impresiones,CTR,Posición",
      "fontanero valencia,10,100,10%,5",
      "llamar al 612345678,4,40,10%,6",
      "juan@correo.es fontanero,2,20,10%,7",
    ].join("\n");
    const r = parseSeoCsv(csv);
    expect(r.rows.map((x) => x.query)).toEqual(["fontanero valencia"]);
    expect(r.skipped).toBe(2);
    expect(r.skippedReasons).toContain("pii");
  });

  it("skips structurally broken rows without throwing", () => {
    const r = parseSeoCsv("Consulta,Clics,Impresiones,CTR,Posición\nsolo un campo\nok,1,2,3%,4");
    expect(r.rows).toHaveLength(1);
    expect(r.skipped).toBe(1);
  });

  it("returns an empty result for empty input", () => {
    expect(parseSeoCsv("").rows).toEqual([]);
    expect(parseSeoCsv("   \n  ").rows).toEqual([]);
  });

  it("keeps optional device and page columns when present", () => {
    const csv =
      "Query,Page,Clicks,Impressions,CTR,Position,Device\n" +
      "x,/servicios/fontaneria,5,50,10%,3,MOBILE";
    const r = parseSeoCsv(csv);
    expect(r.rows[0]).toMatchObject({ page: "/servicios/fontaneria", device: "mobile" });
  });
});
