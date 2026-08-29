import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { requestService } from "./requests";

/**
 * Integration tests — run against the `praetoria_test` database.
 * Requires: `docker compose up -d` and the test DB migrated
 * (`DATABASE_URL=...praetoria_test npx prisma migrate deploy`).
 */

async function reset() {
  await db.$executeRawUnsafe(
    `TRUNCATE TABLE
      "StatusEvent","Consent","ClientCorrection","AnalysisVersion","Communication",
      "Quote","Photo","RequestLocation","Contact","CoverageDraftRevision","CoverageAnalysis",
      "InsuranceDocument","InsuranceCase","ClientLink","Request"
     RESTART IDENTITY CASCADE`,
  );
}

beforeEach(reset);
afterAll(async () => {
  await db.$disconnect();
});

describe("requestService", () => {
  it("creates a draft with a unique reference and an initial status event", async () => {
    const draft = await requestService.createDraft({
      trade: "fontaneria",
      clientChoseUnsure: false,
    });
    expect(draft.reference).toMatch(/^PS-[A-Z0-9]{4}-[A-Z0-9]{4}$/);
    expect(draft.status).toBe("BORRADOR");
    expect(draft.expiresAt).toBeInstanceOf(Date);

    const full = await requestService.getById(draft.id);
    expect(full?.statusHistory).toHaveLength(1);
    expect(full?.statusHistory[0]).toMatchObject({ to: "BORRADOR", actorType: "SYSTEM" });
  });

  it("maps the 'no sé' choice to clientChoseUnsure with no trade", async () => {
    const draft = await requestService.createDraft({ trade: "no-se", clientChoseUnsure: true });
    expect(draft.trade).toBeNull();
    expect(draft.clientChoseUnsure).toBe(true);
  });

  it("stores the problem + location and computes coverage", async () => {
    const draft = await requestService.createDraft({ clientChoseUnsure: false });
    const r = await requestService.describeProblem(draft.id, {
      problemText: "Hay una fuga de agua bajo el fregadero desde ayer.",
      municipality: "Valencia",
      postalCode: "46007",
    });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value.withinCoverage).toBe(true);
      expect(r.value.municipality).toBe("Valencia");
    }
    const out = await requestService.describeProblem(draft.id, {
      problemText: "Reparación de persiana en un piso.",
      municipality: "Sevilla",
      postalCode: "41001",
    });
    if (out.ok) expect(out.value.withinCoverage).toBe(false);
  });

  it("attaches contact + granular consent, normalising the phone", async () => {
    const draft = await requestService.createDraft({ clientChoseUnsure: false });
    const r = await requestService.attachContact(draft.id, {
      name: "Ana",
      phone: "600 11 12 22",
      email: "",
      preferredChannel: "WHATSAPP",
      consent: {
        requestHandling: true,
        operationalComms: true,
        marketing: false,
        textVersion: "v1",
      },
    });
    expect(r.ok).toBe(true);
    const full = await requestService.getById(draft.id);
    expect(full?.contact?.phone).toBe("+34600111222");
    const marketing = full?.consents.find((c) => c.type === "MARKETING");
    expect(marketing?.granted).toBe(false);
    expect(full?.consents).toHaveLength(3);
  });

  it("applies a valid transition and records author + reason immutably", async () => {
    const draft = await requestService.createDraft({ clientChoseUnsure: false });
    const submitted = await requestService.submit(draft.id);
    expect(submitted.ok).toBe(true);
    if (submitted.ok) {
      expect(submitted.value.status).toBe("PENDIENTE_ANALISIS");
      expect(submitted.value.submittedAt).toBeInstanceOf(Date);
    }

    const reviewed = await requestService.applyTransition({
      requestId: draft.id,
      to: "EN_REVISION",
      actor: "ADMIN",
      actorId: "admin-1",
    });
    expect(reviewed.ok).toBe(true);

    const full = await requestService.getById(draft.id);
    expect(full?.statusHistory.map((s) => s.to)).toEqual([
      "BORRADOR",
      "PENDIENTE_ANALISIS",
      "EN_REVISION",
    ]);
    const last = full!.statusHistory.at(-1)!;
    expect(last).toMatchObject({
      from: "PENDIENTE_ANALISIS",
      actorType: "ADMIN",
      actorId: "admin-1",
    });
  });

  it("rejects an invalid transition and writes no status event", async () => {
    const draft = await requestService.createDraft({ clientChoseUnsure: false });
    const bad = await requestService.applyTransition({
      requestId: draft.id,
      to: "PRESUPUESTO_ENVIADO",
      actor: "ADMIN",
    });
    expect(bad.ok).toBe(false);
    if (!bad.ok) expect(bad.error.kind).toBe("invalid_transition");

    const full = await requestService.getById(draft.id);
    expect(full?.statusHistory).toHaveLength(1); // only the creation event
    expect(full?.status).toBe("BORRADOR");
  });

  it("rejects a forbidden actor (client cannot move to review)", async () => {
    const draft = await requestService.createDraft({ clientChoseUnsure: false });
    await requestService.submit(draft.id);
    await requestService.applyTransition({
      requestId: draft.id,
      to: "VALIDADA_CLIENTE",
      actor: "CLIENT",
    });
    const forbidden = await requestService.applyTransition({
      requestId: draft.id,
      to: "EN_REVISION",
      actor: "CLIENT",
    });
    expect(forbidden.ok).toBe(false);
    if (!forbidden.ok) expect(forbidden.error.kind).toBe("forbidden_actor");
  });

  it("submit is idempotent", async () => {
    const draft = await requestService.createDraft({ clientChoseUnsure: false });
    const a = await requestService.submit(draft.id);
    const b = await requestService.submit(draft.id);
    expect(a.ok && b.ok).toBe(true);
    const full = await requestService.getById(draft.id);
    expect(full?.statusHistory.filter((s) => s.to === "PENDIENTE_ANALISIS")).toHaveLength(1);
  });

  it("deletes stale never-submitted drafts only", async () => {
    const stale = await requestService.createDraft({ clientChoseUnsure: false });
    const fresh = await requestService.createDraft({ clientChoseUnsure: false });
    const submitted = await requestService.createDraft({ clientChoseUnsure: false });
    await requestService.submit(submitted.id);

    // Age the stale draft past the cutoff.
    await db.request.update({
      where: { id: stale.id },
      data: { updatedAt: new Date("2020-01-01T00:00:00Z") },
    });

    const removed = await requestService.deleteExpiredDrafts();
    expect(removed).toBe(1);
    expect(await requestService.getById(stale.id)).toBeNull();
    expect(await requestService.getById(fresh.id)).not.toBeNull();
    expect(await requestService.getById(submitted.id)).not.toBeNull();
  });
});
