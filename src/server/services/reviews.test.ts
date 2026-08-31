import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { requestService } from "./requests";
import { serviceClosureService } from "./serviceClosure";
import { reviewService } from "./reviews";

/**
 * Issue #26 — verified reviews + reputation. Integration tests against the real
 * schema: honest averages, moderation without cherry-picking, PII scrubbing,
 * negative → incidence, consent + withdrawal traced.
 */

async function reset() {
  await db.$executeRawUnsafe(
    `TRUNCATE TABLE "Review","IncidenceEvent","Incidence","ServiceCompletion","QuoteLine","Quote","AdminActionLog","AdminUser","StatusEvent","Contact","RequestLocation","Request" RESTART IDENTITY CASCADE`,
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

/** A CERRADA request in trade `trade`, ready to be reviewed. */
async function closedRequest(trade = "fontaneria") {
  const d = await requestService.createDraft({ trade, clientChoseUnsure: false });
  await db.request.update({ where: { id: d.id }, data: { status: "ACEPTADA" } });
  await db.quote.create({
    data: {
      requestId: d.id,
      version: 1,
      status: "ACEPTADO",
      workDescription: "Trabajo",
      subtotalCents: 10000,
      taxCents: 2100,
      totalCents: 12100,
      warrantyText: "6 meses",
      warrantyResponsible: "Praetoria Servicios",
      estimatedTimeframe: "2-3 días",
    },
  });
  await serviceClosureService.recordCompletion(
    d.id,
    { completedAt: new Date(), workDone: "Hecho." },
    ADMIN,
  );
  await serviceClosureService.confirmByClient(d.id);
  return d.id;
}

async function publishedReview(
  trade: string,
  rating: number,
  extra: Parameters<typeof reviewService.submit>[1] = { rating, publishConsent: true },
) {
  const reqId = await closedRequest(trade);
  const s = await reviewService.submit(reqId, { ...extra, rating, publishConsent: true });
  if (!s.ok) throw new Error("submit failed");
  await reviewService.moderate(s.value.id, "AUTORIZADA", { adminId: ADMIN });
  return s.value.id;
}

describe("reviewService — capture", () => {
  it("refuses a review for a request that is not CERRADA (AC-26-nojob)", async () => {
    const d = await requestService.createDraft({ trade: "fontaneria", clientChoseUnsure: false });
    const r = await reviewService.submit(d.id, { rating: 5, publishConsent: false });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.kind).toBe("not_closed");
  });

  it("refuses a review for a non-existent request", async () => {
    const r = await reviewService.submit("nope", { rating: 5, publishConsent: false });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.kind).toBe("not_found");
  });

  it("stores optional dimensions", async () => {
    await admin();
    const reqId = await closedRequest();
    const s = await reviewService.submit(reqId, {
      rating: 4,
      publishConsent: true,
      punctuality: 5,
      cleanliness: 3,
      comment: "Correcto en general.",
    });
    expect(s.ok).toBe(true);
    if (!s.ok) return;
    const row = await db.review.findUnique({ where: { id: s.value.id } });
    expect(row?.punctuality).toBe(5);
    expect(row?.cleanliness).toBe(3);
    expect(row?.clarity).toBeNull();
  });
});

describe("reviewService — PII (AC-26-pii)", () => {
  it("auto-holds a review whose comment contains PII and blocks publication", async () => {
    await admin();
    const reqId = await closedRequest();
    const s = await reviewService.submit(reqId, {
      rating: 5,
      publishConsent: true,
      comment: "Genial, llamadme al 612345678 para más trabajos",
    });
    if (!s.ok) return;
    const held = await db.review.findUnique({ where: { id: s.value.id } });
    expect(held?.status).toBe("RETENIDA_PII");
    expect(held?.piiFlagged).toBe(true);

    const blocked = await reviewService.moderate(s.value.id, "AUTORIZADA", { adminId: ADMIN });
    expect(blocked.ok).toBe(false);

    await reviewService.applyRedaction(s.value.id, ADMIN);
    const redacted = await db.review.findUnique({ where: { id: s.value.id } });
    expect(redacted?.comment).not.toMatch(/612345678/);
    expect(redacted?.piiFlagged).toBe(false);

    const nowOk = await reviewService.moderate(s.value.id, "AUTORIZADA", { adminId: ADMIN });
    expect(nowOk.ok).toBe(true);
    const published = await reviewService.listPublished({ trade: "fontaneria" });
    expect(published[0].comment).not.toMatch(/612345678/);
  });
});

describe("reviewService — averages (AC-26-averages)", () => {
  it("computes a reproducible average only from published reviews", async () => {
    await admin();
    await publishedReview("fontaneria", 5, { rating: 5, publishConsent: true, punctuality: 5 });
    await publishedReview("fontaneria", 4, { rating: 4, publishConsent: true, punctuality: 4 });
    await publishedReview("fontaneria", 3);
    // a 4th review submitted but NOT authorised must not count
    const pendingReq = await closedRequest("fontaneria");
    await reviewService.submit(pendingReq, { rating: 1, publishConsent: true });

    const agg = await reviewService.aggregateFor({ trade: "fontaneria" });
    expect(agg.count).toBe(3);
    expect(agg.average).toBe(4); // (5+4+3)/3
    expect(agg.dimensionAverages.punctuality).toBe(4.5);
    expect(agg.distribution).toEqual({ 1: 0, 2: 0, 3: 1, 4: 1, 5: 1 });
  });

  it("returns an empty aggregate — never invented — when there are no real reviews", async () => {
    const agg = await reviewService.aggregateFor({ trade: "pintura" });
    expect(agg.count).toBe(0);
    expect(agg.average).toBeNull();
  });
});

describe("reviewService — no cherry-picking (AC-26-cherrypick)", () => {
  it("publishes a 1-star review by the same path as a 5-star one", async () => {
    await admin();
    const oneStar = await publishedReview("electricidad", 1, {
      rating: 1,
      publishConsent: true,
      comment: "Llegó tarde y el precio no coincidió.",
    });
    const published = await reviewService.listPublished({ trade: "electricidad" });
    expect(published.map((p) => p.id)).toContain(oneStar);
    expect(published.find((p) => p.id === oneStar)?.rating).toBe(1);
  });

  it("listPublished exposes only transparent sorts, never a rating filter", async () => {
    await admin();
    await publishedReview("montaje", 2);
    await publishedReview("montaje", 5);
    const asc = await reviewService.listPublished({ trade: "montaje", sort: "rating_asc" });
    expect(asc.map((r) => r.rating)).toEqual([2, 5]);
    const recent = await reviewService.listPublished({ trade: "montaje" });
    expect(recent).toHaveLength(2);
  });
});

describe("reviewService — negative → incidence (AC-26-negative)", () => {
  it("opens an incidence from a review and links it", async () => {
    await admin();
    const id = await publishedReview("fontaneria", 2, {
      rating: 2,
      publishConsent: true,
      comment: "No quedó bien.",
    });
    const r = await reviewService.openIncidence(id, ADMIN);
    expect(r.ok).toBe(true);
    const row = await db.review.findUnique({ where: { id } });
    expect(row?.incidenceId).toBeTruthy();
    const inc = await db.incidence.findUnique({ where: { id: row!.incidenceId! } });
    expect(inc?.status).toBe("ABIERTA");
  });
});

describe("reviewService — consent + withdrawal (AC-26-consent / AC-26-nodemo)", () => {
  it("never lists a review without publish consent, even authorised", async () => {
    await admin();
    const reqId = await closedRequest();
    const s = await reviewService.submit(reqId, { rating: 5, publishConsent: false });
    if (!s.ok) return;
    await reviewService.moderate(s.value.id, "AUTORIZADA", { adminId: ADMIN });
    expect(await reviewService.listPublished()).toHaveLength(0);
  });

  it("withdrawal needs a reason, removes the review from listings, and is traced", async () => {
    await admin();
    const id = await publishedReview("fontaneria", 5);
    expect(await reviewService.listPublished({ trade: "fontaneria" })).toHaveLength(1);

    const noReason = await reviewService.withdraw(id, "", ADMIN);
    expect(noReason.ok).toBe(false);

    const done = await reviewService.withdraw(id, "El cliente ha pedido retirarla.", ADMIN);
    expect(done.ok).toBe(true);
    expect(await reviewService.listPublished({ trade: "fontaneria" })).toHaveLength(0);

    const log = await db.adminActionLog.findFirst({
      where: { action: "review_moderation" },
      orderBy: { createdAt: "desc" },
    });
    expect((log?.detail as { to?: string })?.to).toBe("RETIRADA");
  });
});
