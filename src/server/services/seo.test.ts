import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { seoService } from "./seo";
import { requestService } from "./requests";

async function reset() {
  await db.$executeRawUnsafe(
    `TRUNCATE TABLE "SeoMetricRow","SeoMetricImport","Article","AdminActionLog","AdminUser","StatusEvent","Request" RESTART IDENTITY CASCADE`,
  );
}
beforeEach(reset);
afterAll(() => db.$disconnect());

const ADMIN = "admin-1";
async function admin() {
  await db.adminUser.create({
    data: { id: ADMIN, email: "a@praetoria.local", name: "A", passwordHash: "x" },
  });
}

const CSV = [
  "Consulta,Página,Clics,Impresiones,CTR,Posición",
  "fontanero valencia,/servicios/fontaneria,5,3000,0.17%,3.1",
  "reparar grifo,/problemas/grifo-que-gotea,40,800,5%,8",
  "llamar 612345678,/x,1,10,10%,5",
].join("\n");

describe("seoService", () => {
  it("imports a CSV, drops PII rows, and records the period + source", async () => {
    await admin();
    const r = await seoService.importCsv(
      CSV,
      { source: "gsc-csv", periodStart: new Date("2026-07-01"), periodEnd: new Date("2026-07-31") },
      ADMIN,
    );
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.value.rowCount).toBe(2);
    expect(r.value.skipped).toBe(1);
    expect(r.value.skippedReasons).toContain("pii");

    const stored = await db.seoMetricRow.findMany();
    expect(stored.every((s) => !/612345678/.test(s.query))).toBe(true);

    const imports = await seoService.listImports();
    expect(imports[0].source).toBe("gsc-csv");
    expect(imports[0].rowCount).toBe(2);
  });

  it("refuses an empty / header-only CSV", async () => {
    await admin();
    const r = await seoService.importCsv("Consulta,Clics\n", { source: "x", periodStart: new Date(), periodEnd: new Date() }, ADMIN);
    expect(r.ok).toBe(false);
  });

  it("overview surfaces a low-CTR recommendation with a period label", async () => {
    await admin();
    await seoService.importCsv(
      CSV,
      { source: "gsc-csv", periodStart: new Date("2026-07-01"), periodEnd: new Date("2026-07-31") },
      ADMIN,
    );
    const o = await seoService.overview();
    expect(o.metrics.source).toBe("gsc-csv");
    expect(o.metrics.period?.start.toISOString().slice(0, 10)).toBe("2026-07-01");
    expect(o.lowCtr.some((x) => x.query === "fontanero valencia" && x.kind === "recommendation")).toBe(true);
    // linking gaps come from local data even with no import
    expect(Array.isArray(o.linkingGaps)).toBe(true);
  });

  it("flags a page with imported traffic but no attributed request (AC-27-funnel)", async () => {
    await admin();
    await seoService.importCsv(
      "Consulta,Página,Clics,Impresiones,CTR,Posición\nx,/guias/algo,25,900,2.7%,6",
      { source: "gsc-csv", periodStart: new Date("2026-07-01"), periodEnd: new Date("2026-07-31") },
      ADMIN,
    );
    const before = await seoService.pagesWithTrafficNoRequests();
    expect(before.items.map((i) => i.page)).toContain("/guias/algo");

    // a submitted request that entered on that page removes it from the list
    const d = await requestService.createDraft({ trade: "fontaneria", clientChoseUnsure: false });
    await db.request.update({
      where: { id: d.id },
      data: { entryPath: "/guias/algo", submittedAt: new Date() },
    });
    const after = await seoService.pagesWithTrafficNoRequests();
    expect(after.items.map((i) => i.page)).not.toContain("/guias/algo");
  });

  it("creates a BORRADOR article from a real query, never published", async () => {
    await admin();
    const r = await seoService.draftFromQuery("cambiar bombín de seguridad", ADMIN);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const a = await db.article.findUnique({ where: { id: r.value.id } });
    expect(a?.status).toBe("BORRADOR");
    expect(a?.targetKeywords).toContain("cambiar bombín de seguridad");
  });
});
