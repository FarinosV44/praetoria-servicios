import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { requestService } from "./requests";
import { photoService } from "./photos";

const jpeg = () => new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0x10, 1, 2, 3, 4]);
const elf = () => new Uint8Array([0x7f, 0x45, 0x4c, 0x46, 1, 1, 1]);

async function reset() {
  await db.$executeRawUnsafe(
    `TRUNCATE TABLE "StatusEvent","Consent","Photo","Contact","RequestLocation","ClientLink","Request" RESTART IDENTITY CASCADE`,
  );
}
beforeEach(reset);
afterAll(() => db.$disconnect());

describe("photoService", () => {
  it("adds a valid photo, stores only a key, returns a signed URL", async () => {
    const draft = await requestService.createDraft({ clientChoseUnsure: false });
    const r = await photoService.add({
      requestId: draft.id,
      bytes: jpeg(),
      declaredType: "image/jpeg",
      size: 10,
      hint: "vista general",
    });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value.signedUrl).toContain("memory://");
      const row = await db.photo.findUnique({ where: { id: r.value.id } });
      expect(row?.storageKey).toMatch(/^requests\/.+\/photos\/.+\.jpg$/);
      expect(row?.storageKey).not.toContain("http");
    }
  });

  it("rejects a non-image (executable disguised as .jpg)", async () => {
    const draft = await requestService.createDraft({ clientChoseUnsure: false });
    const r = await photoService.add({
      requestId: draft.id,
      bytes: elf(),
      declaredType: "image/jpeg",
      size: 7,
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatchObject({ kind: "rejected", code: "not_an_image" });
  });

  it("rejects uploads once the request is locked (in review)", async () => {
    const draft = await requestService.createDraft({ clientChoseUnsure: false });
    await requestService.submit(draft.id);
    await requestService.applyTransition({
      requestId: draft.id,
      to: "VALIDADA_CLIENTE",
      actor: "CLIENT",
    });
    await requestService.applyTransition({
      requestId: draft.id,
      to: "EN_REVISION",
      actor: "ADMIN",
    });
    const r = await photoService.add({
      requestId: draft.id,
      bytes: jpeg(),
      declaredType: "image/jpeg",
      size: 10,
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.kind).toBe("request_locked");
  });

  it("lists in order, removes (soft-delete + blob), and reorders", async () => {
    const draft = await requestService.createDraft({ clientChoseUnsure: false });
    const a = await photoService.add({
      requestId: draft.id,
      bytes: jpeg(),
      declaredType: "image/jpeg",
      size: 10,
    });
    const b = await photoService.add({
      requestId: draft.id,
      bytes: jpeg(),
      declaredType: "image/jpeg",
      size: 10,
    });
    if (!a.ok || !b.ok) throw new Error("setup failed");

    let list = await photoService.list(draft.id);
    expect(list.map((p) => p.id)).toEqual([a.value.id, b.value.id]);

    await photoService.reorder(draft.id, [b.value.id, a.value.id]);
    list = await photoService.list(draft.id);
    expect(list.map((p) => p.id)).toEqual([b.value.id, a.value.id]);

    await photoService.remove(draft.id, a.value.id);
    list = await photoService.list(draft.id);
    expect(list.map((p) => p.id)).toEqual([b.value.id]);
    const removed = await db.photo.findUnique({ where: { id: a.value.id } });
    expect(removed?.deletedAt).toBeInstanceOf(Date);
  });

  it("purges all photos for a request", async () => {
    const draft = await requestService.createDraft({ clientChoseUnsure: false });
    await photoService.add({
      requestId: draft.id,
      bytes: jpeg(),
      declaredType: "image/jpeg",
      size: 10,
    });
    await photoService.add({
      requestId: draft.id,
      bytes: jpeg(),
      declaredType: "image/jpeg",
      size: 10,
    });
    const n = await photoService.deleteAllForRequest(draft.id);
    expect(n).toBe(2);
    expect(await db.photo.count({ where: { requestId: draft.id } })).toBe(0);
  });
});
