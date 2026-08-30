import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { requestService } from "./services/requests";
import { clientLinkService } from "./services/clientLink";
import { insuranceService } from "./services/insurance";
import { photoService } from "./services/photos";
import { isSameOrigin } from "@/lib/http";
import { redactForTest, maskStringForTest } from "@/lib/logging";

async function reset() {
  await db.$executeRawUnsafe(
    `TRUNCATE TABLE "InsuranceDocument","InsuranceCase","Photo","ClientLink","Consent","Contact","RequestLocation","StatusEvent","Request" RESTART IDENTITY CASCADE`,
  );
}
beforeEach(reset);
afterAll(() => db.$disconnect());

const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);
const PDF = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d]);

async function submitted() {
  const d = await requestService.createDraft({ clientChoseUnsure: false });
  await requestService.describeProblem(d.id, {
    problemText: "Fuga bajo el fregadero.",
    municipality: "Valencia",
    postalCode: "46007",
  });
  await requestService.attachContact(d.id, {
    name: "Ana",
    phone: "600111222",
    email: "ana@example.com",
    preferredChannel: "EMAIL",
    consent: { requestHandling: true, operationalComms: true, marketing: false, textVersion: "v1" },
  });
  await requestService.submit(d.id);
  return d.id;
}

describe("cross-resource authorization (issue #17)", () => {
  it("a signed link resolves ONLY to its own request", async () => {
    const a = await submitted();
    const b = await submitted();
    const { token } = await clientLinkService.issue(a);
    const r = await clientLinkService.resolve(token);
    expect(r.ok && r.value.requestId).toBe(a);
    expect(r.ok && r.value.requestId).not.toBe(b);
  });

  it("a token-scoped photo upload only ever touches the token's own request", async () => {
    const a = await submitted();
    const b = await submitted();
    await requestService.applyTransition({
      requestId: a,
      to: "REQUIERE_INFORMACION",
      actor: "ADMIN",
      actorId: "sys",
    });
    const { token } = await clientLinkService.issue(a);
    const link = await clientLinkService.resolve(token);
    if (!link.ok) throw new Error();

    // this is exactly what /api/uploads does with a link token
    const added = await photoService.add({
      requestId: link.value.requestId,
      bytes: PNG,
      declaredType: "image/png",
      size: PNG.length,
    });
    expect(added.ok).toBe(true);
    expect(await db.photo.count({ where: { requestId: a } })).toBe(1);
    expect(await db.photo.count({ where: { requestId: b } })).toBe(0);
  });

  it("an insurance doc uploaded under link A lands on case A only", async () => {
    const a = await submitted();
    const b = await submitted();
    const { token } = await clientLinkService.issue(a);
    const link = await clientLinkService.resolve(token);
    if (!link.ok) throw new Error();
    await insuranceService.recordConsent(link.value.requestId, true, "v1");
    const add = await insuranceService.addDocument({
      requestId: link.value.requestId,
      bytes: PDF,
      size: PDF.length,
      kind: "otro",
    });
    expect(add.ok).toBe(true);
    const caseA = await insuranceService.getCase(a);
    const caseB = await insuranceService.getCase(b);
    expect(caseA?.documents.length).toBe(1);
    expect(caseB).toBeNull();
  });

  it("a revoked or foreign token is refused", async () => {
    const a = await submitted();
    const { token } = await clientLinkService.issue(a);
    await clientLinkService.revokeAll(a);
    expect((await clientLinkService.resolve(token)).ok).toBe(false);
    expect((await clientLinkService.resolve(a)).ok).toBe(false); // the raw id is not a token
  });
});

describe("CSRF / origin check on mutating route handlers (issue #17)", () => {
  const make = (origin: string | null) =>
    new Request("http://localhost:3000/api/uploads", {
      method: "POST",
      headers: origin ? { origin, host: "localhost:3000" } : { host: "localhost:3000" },
    });

  it("accepts a same-origin request and rejects a cross-origin one", () => {
    // APP_URL in the test env is http://localhost:3000
    expect(isSameOrigin(make("http://localhost:3000"))).toBe(true);
    expect(isSameOrigin(make("https://evil.example"))).toBe(false);
    expect(isSameOrigin(make(null))).toBe(false); // no Origin and no Referer
  });
});

describe("PII redaction in logs (issue #17)", () => {
  it("never emits a phone, email, name, description or policy text", () => {
    const out = redactForTest({
      phone: "+34600111222",
      email: "ana@example.com",
      name: "Ana López",
      nombre: "Ana López",
      description: "Fuga en el baño, la dirección es Calle Falsa 123",
      poliza: "condiciones particulares nº 000000",
      nested: { contact: { phone: "600111222" }, note: "escribe a ana@example.com o al 600111222" },
      requestId: "req_123", // safe — kept
      count: 3, // safe — kept
    });
    const flat = JSON.stringify(out);
    expect(flat).not.toContain("600111222");
    expect(flat).not.toContain("ana@example.com");
    expect(flat).not.toContain("Ana López");
    expect(flat).not.toContain("Calle Falsa");
    expect(flat).not.toContain("000000");
    // safe fields survive
    expect(out.requestId).toBe("req_123");
    expect(out.count).toBe(3);
  });

  it("masks emails and phone numbers embedded in free text", () => {
    expect(maskStringForTest("contacto: ana@example.com / +34 600 111 222")).not.toContain(
      "ana@example.com",
    );
    expect(maskStringForTest("llama al 600111222")).toContain("[phone]");
  });
});
