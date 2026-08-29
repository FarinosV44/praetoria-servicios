import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { requestService } from "./requests";
import { quoteService } from "./quotes";
import { hashPassword } from "@/lib/password";

async function reset() {
  await db.$executeRawUnsafe(
    `TRUNCATE TABLE "QuoteLine","Quote","AdminActionLog","StatusEvent","Consent","Contact","RequestLocation","Request","AdminUser" RESTART IDENTITY CASCADE`,
  );
}
beforeEach(reset);
afterAll(() => db.$disconnect());

async function setup() {
  const admin = await db.adminUser.create({
    data: { email: "q@x.test", name: "Q", passwordHash: await hashPassword("pw"), role: "ADMIN" },
  });
  const d = await requestService.createDraft({ clientChoseUnsure: false });
  await requestService.describeProblem(d.id, {
    problemText: "Fuga bajo el fregadero.",
    municipality: "Valencia",
    postalCode: "46007",
  });
  await requestService.attachContact(d.id, {
    name: "C",
    phone: "600111222",
    email: "",
    preferredChannel: "WHATSAPP",
    consent: { requestHandling: true, operationalComms: true, marketing: false, textVersion: "v1" },
  });
  await requestService.submit(d.id);
  await requestService.applyTransition({
    requestId: d.id,
    to: "VALIDADA_CLIENTE",
    actor: "CLIENT",
  });
  await requestService.applyTransition({
    requestId: d.id,
    to: "EN_REVISION",
    actor: "ADMIN",
    actorId: admin.id,
  });
  const req = await db.request.findUnique({ where: { id: d.id } });
  return { admin, reference: req!.reference, requestId: d.id };
}

const completeInput = {
  workDescription: "Sustituir sifón y revisar la instalación.",
  lines: [
    { kind: "MANO_OBRA" as const, concept: "Reparación", amount: "80", included: true },
    { kind: "MATERIALES" as const, concept: "Sifón", amount: "12", included: true },
    {
      kind: "RETIRADA_LIMPIEZA" as const,
      concept: "Retirada de residuos",
      amount: "0",
      included: false,
    },
  ],
  taxRateBps: 2100,
  isEstimate: false,
  assumptions: ["Si la tubería general está dañada, el precio cambia."],
  professionalRef: "Fontanero interno #3",
  warrantyText: "Garantía comercial de 6 meses.",
  warrantyResponsible: "Praetoria Servicios",
  scheduledFor: "2026-09-10",
  validUntil: "2026-09-25",
};

describe("quoteService", () => {
  it("saves a draft with computed integer-cents totals", async () => {
    const { admin, reference } = await setup();
    const r = await quoteService.saveDraft(admin.id, reference, completeInput as never);
    expect(r.ok).toBe(true);
    if (r.ok) {
      const q = await quoteService.getById(r.value.id);
      expect(q?.subtotalCents).toBe(9200); // 80 + 12, the 0/not-included line excluded
      expect(q?.taxCents).toBe(1932);
      expect(q?.totalCents).toBe(11132);
      expect(q?.lines).toHaveLength(3);
    }
  });

  it("refuses to send an incomplete quote and lists what is missing", async () => {
    const { admin, reference } = await setup();
    const saved = await quoteService.saveDraft(admin.id, reference, {
      ...completeInput,
      warrantyText: undefined,
      validUntil: undefined,
    } as never);
    if (!saved.ok) throw new Error("save failed");
    const sent = await quoteService.markSent(admin.id, reference, saved.value.id);
    expect(sent.ok).toBe(false);
    if (!sent.ok && sent.error.kind === "incomplete") {
      expect(sent.error.missing).toContain("Garantía aplicable");
      expect(sent.error.missing).toContain("Validez de la oferta");
    } else {
      throw new Error("expected incomplete");
    }
  });

  it("sends a complete quote and moves the request to PRESUPUESTO_ENVIADO", async () => {
    const { admin, reference, requestId } = await setup();
    const saved = await quoteService.saveDraft(admin.id, reference, completeInput as never);
    if (!saved.ok) throw new Error("save failed");
    const sent = await quoteService.markSent(admin.id, reference, saved.value.id);
    expect(sent.ok).toBe(true);
    const req = await db.request.findUnique({ where: { id: requestId } });
    expect(req?.status).toBe("PRESUPUESTO_ENVIADO");
    const q = await quoteService.getById(saved.value.id);
    expect(q?.status).toBe("ENVIADO");
  });

  it("records a client acceptance with evidence and locks it", async () => {
    const { admin, reference, requestId } = await setup();
    const saved = await quoteService.saveDraft(admin.id, reference, completeInput as never);
    if (!saved.ok) throw new Error("save failed");
    await quoteService.markSent(admin.id, reference, saved.value.id);

    const dec = await quoteService.recordDecision(saved.value.id, "ACEPTADO", {
      via: "signed-link",
      at: "now",
    });
    expect(dec.ok).toBe(true);
    const req = await db.request.findUnique({ where: { id: requestId } });
    expect(req?.status).toBe("ACEPTADA");

    const again = await quoteService.recordDecision(saved.value.id, "RECHAZADO", {});
    expect(again.ok).toBe(false);
  });

  it("a new draft after one was sent gets the next version", async () => {
    const { admin, reference } = await setup();
    const v1 = await quoteService.saveDraft(admin.id, reference, completeInput as never);
    if (!v1.ok) throw new Error();
    await quoteService.markSent(admin.id, reference, v1.value.id);
    const v2 = await quoteService.saveDraft(admin.id, reference, completeInput as never);
    expect(v2.ok && v2.value.version).toBe(2);
  });
});
