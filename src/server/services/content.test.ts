import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { contentService } from "./content";

async function reset() {
  await db.$executeRawUnsafe(
    `TRUNCATE TABLE "ArticleRevision","SlugRedirect","Article" RESTART IDENTITY CASCADE`,
  );
}
beforeEach(reset);
afterAll(() => db.$disconnect());

const ADMIN = "admin-1";

describe("contentService", () => {
  it("creates an article as a BORRADOR with a slug and a first revision", async () => {
    const r = await contentService.create({ title: "Fugas de agua en casa: guía rápida" }, ADMIN);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.value.slug).toBe("fugas-de-agua-en-casa-guia-rapida");
    const a = await contentService.getForAdmin(r.value.id);
    expect(a?.status).toBe("BORRADOR");
    expect(a?.revisions).toHaveLength(1);
  });

  it("refuses an invalid slug and a duplicate slug", async () => {
    const a = await contentService.create({ title: "Uno" }, ADMIN);
    const b = await contentService.create({ title: "Dos" }, ADMIN);
    if (!a.ok || !b.ok) return;
    expect((await contentService.update(b.value.id, { slug: "MAYUS" }, ADMIN)).ok).toBe(false);
    const dup = await contentService.update(b.value.id, { slug: a.value.slug }, ADMIN);
    expect(dup.ok).toBe(false);
    if (!dup.ok) expect(dup.error.kind).toBe("slug_taken");
  });

  it("validates the block body", async () => {
    const a = await contentService.create({ title: "Con bloques" }, ADMIN);
    if (!a.ok) return;
    const bad = await contentService.update(a.value.id, { body: [{ type: "nope" }] }, ADMIN);
    expect(bad.ok).toBe(false);
    if (!bad.ok) expect(bad.error.kind).toBe("invalid_body");
    const good = await contentService.update(
      a.value.id,
      { body: [{ type: "heading", level: 2, text: "Hola" }, { type: "text", md: "Texto." }] },
      ADMIN,
    );
    expect(good.ok).toBe(true);
  });

  it("cannot publish without a human review, then can", async () => {
    const a = await contentService.create({ title: "Guía a publicar" }, ADMIN);
    if (!a.ok) return;
    await contentService.setStatus(a.value.id, "REVISION", { adminId: ADMIN });

    const blocked = await contentService.setStatus(a.value.id, "PUBLICADO", { adminId: ADMIN });
    expect(blocked.ok).toBe(false);
    if (!blocked.ok) expect(blocked.error).toMatchObject({ error: "human_review_required" });

    await contentService.setReviewedByHuman(a.value.id, true, "Perito X", ADMIN);
    const ok = await contentService.setStatus(a.value.id, "PUBLICADO", { adminId: ADMIN });
    expect(ok.ok).toBe(true);
    const pub = await contentService.getForAdmin(a.value.id);
    expect(pub?.status).toBe("PUBLICADO");
    expect(pub?.publishedAt).toBeTruthy();
  });

  it("creates a 301 redirect when a published article's slug changes", async () => {
    const a = await contentService.create({ title: "Original" }, ADMIN);
    if (!a.ok) return;
    await contentService.setStatus(a.value.id, "REVISION", { adminId: ADMIN });
    await contentService.setReviewedByHuman(a.value.id, true, undefined, ADMIN);
    await contentService.setStatus(a.value.id, "PUBLICADO", { adminId: ADMIN });

    await contentService.update(a.value.id, { slug: "titulo-mejor" }, ADMIN);
    const resolved = await contentService.resolvePublic("original");
    expect(resolved.kind).toBe("redirect");
    if (resolved.kind === "redirect") expect(resolved.to).toBe("titulo-mejor");
    expect((await contentService.resolvePublic("titulo-mejor")).kind).toBe("article");
  });

  it("publishes scheduled articles whose time has come", async () => {
    const a = await contentService.create({ title: "Programada" }, ADMIN);
    if (!a.ok) return;
    await contentService.setStatus(a.value.id, "REVISION", { adminId: ADMIN });
    await contentService.setReviewedByHuman(a.value.id, true, undefined, ADMIN);
    const future = new Date(Date.now() + 3600_000);
    const sched = await contentService.setStatus(a.value.id, "PROGRAMADO", {
      adminId: ADMIN,
      publishAt: future,
    });
    expect(sched.ok).toBe(true);

    expect(await contentService.publishDue(new Date(Date.now() + 1000))).toBe(0);
    expect(await contentService.publishDue(new Date(Date.now() + 7200_000))).toBe(1);
    expect((await contentService.getForAdmin(a.value.id))?.status).toBe("PUBLICADO");
  });

  it("restores a previous revision", async () => {
    const a = await contentService.create({ title: "V1" }, ADMIN);
    if (!a.ok) return;
    await contentService.update(a.value.id, { title: "V2", excerpt: "resumen v2" }, ADMIN);
    const withRevs = await contentService.getForAdmin(a.value.id);
    // oldest revision is the "Creado" snapshot with title V1
    const created = withRevs!.revisions.at(-1)!;
    await contentService.restoreRevision(a.value.id, created.id, ADMIN);
    expect((await contentService.getForAdmin(a.value.id))?.title).toBe("V1");
  });

  it("surfaces quality warnings", async () => {
    const a = await contentService.create({ title: "Sin autor ni meta" }, ADMIN);
    if (!a.ok) return;
    const w = await contentService.warningsFor(a.value.id);
    expect(w.join(" ")).toMatch(/autor/i);
    expect(w.join(" ")).toMatch(/meta description/i);
  });
});
