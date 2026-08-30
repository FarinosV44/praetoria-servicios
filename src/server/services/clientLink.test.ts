import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { requestService } from "./requests";
import { quoteService } from "./quotes";
import { clientLinkService } from "./clientLink";
import { hashPassword } from "@/lib/password";

async function reset() {
  await db.$executeRawUnsafe(
    `TRUNCATE TABLE "ClientLink","QuoteLine","Quote","ClientCorrection","Communication","AdminActionLog","StatusEvent","Consent","Contact","RequestLocation","Request","AdminUser" RESTART IDENTITY CASCADE`,
  );
}
beforeEach(reset);
afterAll(() => db.$disconnect());

async function submittedRequest() {
  const d = await requestService.createDraft({ clientChoseUnsure: false });
  await requestService.describeProblem(d.id, {
    problemText: "Fuga bajo el fregadero.",
    municipality: "Valencia",
    postalCode: "46007",
  });
  await requestService.attachContact(d.id, {
    name: "Ana",
    phone: "600111222",
    email: "",
    preferredChannel: "WHATSAPP",
    consent: { requestHandling: true, operationalComms: true, marketing: false, textVersion: "v1" },
  });
  await requestService.submit(d.id);
  return d.id;
}

async function withSentQuote() {
  const admin = await db.adminUser.create({
    data: { email: "a@x.test", name: "A", passwordHash: await hashPassword("pw"), role: "ADMIN" },
  });
  const requestId = await submittedRequest();
  await requestService.applyTransition({ requestId, to: "VALIDADA_CLIENTE", actor: "CLIENT" });
  await requestService.applyTransition({
    requestId,
    to: "EN_REVISION",
    actor: "ADMIN",
    actorId: admin.id,
  });
  const req = await db.request.findUnique({ where: { id: requestId } });
  const saved = await quoteService.saveDraft(admin.id, req!.reference, {
    workDescription: "Sustituir sifón.",
    lines: [{ kind: "MANO_OBRA", concept: "Reparación", amount: "80", included: true }],
    taxRateBps: 2100,
    isEstimate: false,
    assumptions: ["Si la tubería general está dañada, el precio cambia."],
    professionalRef: "Fontanero #3",
    warrantyText: "6 meses.",
    warrantyResponsible: "Praetoria Servicios",
    scheduledFor: "2026-09-10",
    validUntil: "2026-09-25",
  } as never);
  if (!saved.ok) throw new Error("save failed");
  await quoteService.markSent(admin.id, req!.reference, saved.value.id);
  return { requestId, reference: req!.reference, quoteId: saved.value.id };
}

describe("clientLinkService", () => {
  it("issues a link that resolves to its request and nothing else", async () => {
    const requestId = await submittedRequest();
    const other = await submittedRequest();
    const { token } = await clientLinkService.issue(requestId);

    const r = await clientLinkService.resolve(token);
    expect(r.ok && r.value.requestId).toBe(requestId);
    expect(r.ok && r.value.requestId).not.toBe(other);
  });

  it("rejects a tampered or unknown token (no sequential access)", async () => {
    const requestId = await submittedRequest();
    const { token } = await clientLinkService.issue(requestId);

    expect((await clientLinkService.resolve(token + "x")).ok).toBe(false);
    expect((await clientLinkService.resolve("not-a-token")).ok).toBe(false);
    expect((await clientLinkService.resolve(requestId)).ok).toBe(false);
  });

  it("a revoked link stops working; regenerate needs the phone last 4", async () => {
    const requestId = await submittedRequest();
    const { token } = await clientLinkService.issue(requestId);
    await clientLinkService.revokeAll(requestId);

    const revoked = await clientLinkService.resolve(token);
    expect(revoked.ok).toBe(false);
    if (!revoked.ok) expect(revoked.error.kind).toBe("revoked");

    const req = await db.request.findUnique({ where: { id: requestId } });
    const bad = await clientLinkService.regenerate(req!.reference, "0000");
    expect(bad.ok).toBe(false);

    const good = await clientLinkService.regenerate(req!.reference, "1222");
    expect(good.ok).toBe(true);
    if (good.ok) {
      const newToken = good.value.url.split("/s/")[1];
      expect((await clientLinkService.resolve(newToken)).ok).toBe(true);
    }
  });

  it("client view shows a comprehensible status and the sent quote, no internal enum in the label", async () => {
    const { requestId } = await withSentQuote();
    const view = await clientLinkService.getClientView(requestId);
    expect(view).not.toBeNull();
    expect(view!.status.label).not.toContain("PRESUPUESTO_ENVIADO");
    expect(view!.canDecideQuote).toBe(true);
    expect(view!.quote?.total).toMatch(/€/);
    expect(view!.quote?.lines.length).toBe(1);
  });

  it("accept requires the phone last 4 and records evidence + version", async () => {
    const { requestId, quoteId } = await withSentQuote();

    const wrong = await clientLinkService.decideQuote(requestId, quoteId, "ACEPTADO", "9999", {});
    expect(wrong.ok).toBe(false);
    if (!wrong.ok) expect(wrong.error.kind).toBe("verification_failed");

    const okDecision = await clientLinkService.decideQuote(requestId, quoteId, "ACEPTADO", "1222", {
      ip: "1.2.3.4",
      userAgent: "test-agent",
    });
    expect(okDecision.ok).toBe(true);

    const quote = await db.quote.findUnique({ where: { id: quoteId } });
    expect(quote?.status).toBe("ACEPTADO");
    expect(quote?.acceptedAt).toBeTruthy();
    const ev = quote?.decisionEvidence as Record<string, unknown>;
    expect(ev.via).toBe("signed-link");
    expect(ev.quoteVersion).toBe(1);
    expect(ev.ip).toBe("1.2.3.4");
    const req = await db.request.findUnique({ where: { id: requestId } });
    expect(req?.status).toBe("ACEPTADA");
  });

  it("adding info when it was requested moves the request back into the queue", async () => {
    const requestId = await submittedRequest();
    await requestService.applyTransition({
      requestId,
      to: "REQUIERE_INFORMACION",
      actor: "ADMIN",
      actorId: (
        await db.adminUser.create({
          data: {
            email: "b@x.test",
            name: "B",
            passwordHash: await hashPassword("pw"),
            role: "ADMIN",
          },
        })
      ).id,
    });

    const r = await clientLinkService.addClientInfo(requestId, "La caldera es una Junkers de 24 kW.", "info");
    expect(r.ok).toBe(true);
    const req = await db.request.findUnique({ where: { id: requestId } });
    expect(req?.status).toBe("PENDIENTE_ANALISIS");
    const corr = await db.clientCorrection.findFirst({ where: { requestId } });
    expect(corr?.clarification).toContain("Junkers");
  });
});
