import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { localPageService } from "./localPage";

async function reset() {
  await db.$executeRawUnsafe(`TRUNCATE TABLE "LocalPage" RESTART IDENTITY CASCADE`);
}
beforeEach(reset);
afterAll(() => db.$disconnect());

const ADMIN = "admin-1";

async function realContent(id: string) {
  await localPageService.update(
    id,
    {
      coverageNote: "Cubrimos todo el casco urbano de Burjassot y el entorno del metro.",
      typicalServices: ["fontaneria", "electricidad"],
      responseTimeNote: "Presupuesto en 24 h laborables.",
      localFaq: [{ q: "¿Atendéis urgencias?", a: "Priorizamos las de riesgo." }],
    },
    ADMIN,
  );
}

describe("localPageService", () => {
  it("creates a BORRADOR with a slug derived from the municipality", async () => {
    const r = await localPageService.create({ municipality: "Burjassot" }, ADMIN);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.value.slug).toBe("burjassot");
    const admin = await localPageService.getForAdmin(r.value.id);
    expect(admin?.page.status).toBe("BORRADOR");
  });

  it("rejects a duplicate slug by suffixing it", async () => {
    const a = await localPageService.create({ municipality: "Burjassot" }, ADMIN);
    const b = await localPageService.create({ municipality: "Burjassot" }, ADMIN);
    if (!a.ok || !b.ok) return;
    expect(b.value.slug).not.toBe(a.value.slug);
  });

  it("rejects an unknown trade in serviceKey and typicalServices", async () => {
    const r = await localPageService.create({ municipality: "Burjassot" }, ADMIN);
    if (!r.ok) return;
    expect((await localPageService.update(r.value.id, { serviceKey: "brujeria" }, ADMIN)).ok).toBe(false);
    expect(
      (await localPageService.update(r.value.id, { typicalServices: ["fontaneria", "nope"] }, ADMIN)).ok,
    ).toBe(false);
  });

  it("rejects a malformed FAQ", async () => {
    const r = await localPageService.create({ municipality: "Burjassot" }, ADMIN);
    if (!r.ok) return;
    const bad = await localPageService.update(r.value.id, { localFaq: [{ q: "solo pregunta" }] }, ADMIN);
    expect(bad.ok).toBe(false);
    if (!bad.ok) expect(bad.error.kind).toBe("invalid_faq");
  });

  it("does not serve an unpublished page publicly", async () => {
    const r = await localPageService.create({ municipality: "Burjassot" }, ADMIN);
    if (!r.ok) return;
    await realContent(r.value.id);
    expect(await localPageService.getPublic("burjassot")).toBeNull();
  });

  it("serves a published page and reports it indexable only with real content", async () => {
    const r = await localPageService.create({ municipality: "Burjassot" }, ADMIN);
    if (!r.ok) return;
    await localPageService.setStatus(r.value.id, "PUBLICADO", ADMIN);

    const thin = await localPageService.getPublic("burjassot");
    expect(thin).not.toBeNull();
    expect(thin?.indexable).toBe(false);

    await realContent(r.value.id);
    const full = await localPageService.getPublic("burjassot");
    expect(full?.indexable).toBe(true);
  });

  it("keeps a page out of the indexable list when the municipality is not covered", async () => {
    const r = await localPageService.create({ municipality: "Cuenca" }, ADMIN);
    if (!r.ok) return;
    await realContent(r.value.id);
    await localPageService.setStatus(r.value.id, "PUBLICADO", ADMIN);
    expect(await localPageService.listIndexable()).toEqual([]);
  });

  it("honours the noindex flag in listIndexable", async () => {
    const r = await localPageService.create({ municipality: "Burjassot" }, ADMIN);
    if (!r.ok) return;
    await realContent(r.value.id);
    await localPageService.setStatus(r.value.id, "PUBLICADO", ADMIN);
    expect((await localPageService.listIndexable()).map((p) => p.slug)).toEqual(["burjassot"]);

    await localPageService.setNoindex(r.value.id, true, ADMIN);
    expect(await localPageService.listIndexable()).toEqual([]);
  });

  it("lists pages for the admin with an eligibility verdict and reasons", async () => {
    const r = await localPageService.create({ municipality: "Burjassot" }, ADMIN);
    if (!r.ok) return;
    const rows = await localPageService.listForAdmin();
    expect(rows).toHaveLength(1);
    expect(rows[0].indexable).toBe(false);
    expect(rows[0].reasons.length).toBeGreaterThan(0);
  });
});
