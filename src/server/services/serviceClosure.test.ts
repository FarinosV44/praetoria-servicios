import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { requestService } from "./requests";
import { serviceClosureService } from "./serviceClosure";
import { reviewService } from "./reviews";

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

/** A request in ACEPTADA with an accepted quote v1. */
async function acceptedRequest() {
  const d = await requestService.createDraft({ trade: "fontaneria", clientChoseUnsure: false });
  await db.request.update({ where: { id: d.id }, data: { status: "ACEPTADA" } });
  await db.quote.create({
    data: {
      requestId: d.id,
      version: 1,
      status: "ACEPTADO",
      workDescription: "Sustituir sifón",
      subtotalCents: 10000,
      taxCents: 2100,
      totalCents: 12100,
      warrantyText: "6 meses sobre la reparación",
      warrantyResponsible: "Praetoria Servicios",
      estimatedTimeframe: "2-3 días",
    },
  });
  return d.id;
}

describe("serviceClosureService", () => {
  it("records completion and pulls the accepted quote version automatically", async () => {
    await admin();
    const requestId = await acceptedRequest();
    const r = await serviceClosureService.recordCompletion(
      requestId,
      { completedAt: new Date(), workDone: "Sifón sustituido y probado.", warrantyKind: "COMERCIAL" },
      ADMIN,
    );
    expect(r.ok).toBe(true);
    const { completion } = await serviceClosureService.getForRequest(requestId);
    expect(completion?.acceptedQuoteVersion).toBe(1);
    expect(completion?.warrantyKind).toBe("COMERCIAL");
  });

  it("client confirmation moves the request to CERRADA and needs a completion first", async () => {
    await admin();
    const requestId = await acceptedRequest();

    const early = await serviceClosureService.confirmByClient(requestId);
    expect(early.ok).toBe(false);
    if (!early.ok) expect(early.error.kind).toBe("no_completion");

    await serviceClosureService.recordCompletion(
      requestId,
      { completedAt: new Date(), workDone: "Hecho." },
      ADMIN,
    );
    const ok = await serviceClosureService.confirmByClient(requestId);
    expect(ok.ok).toBe(true);
    const req = await db.request.findUnique({ where: { id: requestId } });
    expect(req?.status).toBe("CERRADA");
    expect(req?.closedAt).toBeTruthy();
  });

  it("an incidence cannot be resolved without a reason and evidence", async () => {
    await admin();
    const requestId = await acceptedRequest();
    const open = await serviceClosureService.openIncidence({
      requestId,
      description: "El grifo sigue goteando.",
      openedBy: "CLIENT",
    });
    expect(open.ok).toBe(true);
    if (!open.ok) return;
    expect(open.value.reference).toMatch(/^INC-/);

    await serviceClosureService.classifyIncidence(
      open.value.id,
      { kind: "resultado deficiente" },
      ADMIN,
    );
    // → EN_CLASIFICACION; classify again → EN_CURSO
    await serviceClosureService.classifyIncidence(open.value.id, { kind: "resultado deficiente" }, ADMIN);

    const noReason = await serviceClosureService.transitionIncidence(
      open.value.id,
      "RESUELTA",
      { evidenceNote: "foto adjunta" },
      ADMIN,
    );
    expect(noReason.ok).toBe(false);
    if (!noReason.ok) expect(noReason.error.kind).toBe("reason_required");

    const noEvidence = await serviceClosureService.transitionIncidence(
      open.value.id,
      "RESUELTA",
      { reason: "reapretado el sifón" },
      ADMIN,
    );
    expect(noEvidence.ok).toBe(false);
    if (!noEvidence.ok) expect(noEvidence.error.kind).toBe("evidence_required");

    const done = await serviceClosureService.transitionIncidence(
      open.value.id,
      "RESUELTA",
      { reason: "reapretado el sifón", evidenceNote: "foto del cliente sin goteo + parte del profesional" },
      ADMIN,
    );
    expect(done.ok).toBe(true);
    const { incidences } = await serviceClosureService.getForRequest(requestId);
    expect(incidences[0].status).toBe("RESUELTA");
    expect(incidences[0].closedReason).toBeTruthy();
    expect(incidences[0].evidenceNote).toBeTruthy();
  });

  it("lists open incidences with an overdue flag", async () => {
    await admin();
    const requestId = await acceptedRequest();
    const open = await serviceClosureService.openIncidence({
      requestId,
      description: "problema",
      openedBy: "ADMIN",
    });
    if (!open.ok) return;
    // 48h later the 24h SLA is blown
    const list = await serviceClosureService.listOpenIncidences(
      new Date(Date.now() + 48 * 3600_000),
    );
    expect(list).toHaveLength(1);
    expect(list[0].overdue).toBe(true);
  });

  it("builds a downloadable expediente with the economic trace", async () => {
    await admin();
    const requestId = await acceptedRequest();
    await serviceClosureService.recordCompletion(
      requestId,
      {
        completedAt: new Date(),
        workDone: "Hecho.",
        approvedExtrasNote: "Cambio de latiguillo aprobado por WhatsApp el 02/09 (+8 €).",
        warrantyKind: "COMERCIAL",
      },
      ADMIN,
    );
    await serviceClosureService.confirmByClient(requestId);

    const exp = await serviceClosureService.buildExpediente(requestId);
    expect(exp.ok).toBe(true);
    if (!exp.ok) return;
    const e = exp.value as Record<string, unknown>;
    expect((e.presupuestoAceptado as Record<string, unknown>).version).toBe(1);
    expect((e.cambiosEconomicos as Record<string, unknown>).extrasAprobados).toMatch(/latiguillo/);
    expect((e.ejecucion as Record<string, unknown>).confirmadoPorCliente).toBeTruthy();
  });
});

describe("reviewService", () => {
  it("refuses a review for a request that is not CERRADA", async () => {
    const requestId = await acceptedRequest();
    const r = await reviewService.submit(requestId, { rating: 5, publishConsent: false });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.kind).toBe("not_closed");
  });

  it("accepts a review once the request is CERRADA; publication needs authorize + consent", async () => {
    await admin();
    const requestId = await acceptedRequest();
    await serviceClosureService.recordCompletion(
      requestId,
      { completedAt: new Date(), workDone: "Hecho." },
      ADMIN,
    );
    await serviceClosureService.confirmByClient(requestId);

    const submitted = await reviewService.submit(requestId, {
      rating: 5,
      comment: "Todo perfecto y muy rápido.",
      publishConsent: true,
      authorDisplayName: "Ana G.",
    });
    expect(submitted.ok).toBe(true);
    if (!submitted.ok) return;

    // not published until an admin authorises it
    expect(await reviewService.listPublished()).toHaveLength(0);

    await reviewService.authorize(submitted.value.id, "AUTORIZADA", ADMIN);
    const published = await reviewService.listPublished();
    expect(published).toHaveLength(1);
    expect(published[0].authorDisplayName).toBe("Ana G.");
    expect(published[0].rating).toBe(5);
  });

  it("a review without publish consent is never listed even if authorised", async () => {
    await admin();
    const requestId = await acceptedRequest();
    await serviceClosureService.recordCompletion(
      requestId,
      { completedAt: new Date(), workDone: "Hecho." },
      ADMIN,
    );
    await serviceClosureService.confirmByClient(requestId);
    const s = await reviewService.submit(requestId, { rating: 4, publishConsent: false });
    if (!s.ok) return;
    await reviewService.authorize(s.value.id, "AUTORIZADA", ADMIN);
    expect(await reviewService.listPublished()).toHaveLength(0);
  });
});
