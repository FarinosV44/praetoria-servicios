import { afterAll, afterEach, beforeEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { requestService } from "./requests";
import { communicationService } from "./communications";
import { getAdapters, __setAdapters } from "@/server/container";
import type { MemoryMailer } from "@/adapters/email/memory";

async function reset() {
  await db.$executeRawUnsafe(
    `TRUNCATE TABLE "Communication","AdminActionLog","StatusEvent","Consent","Contact","RequestLocation","Request" RESTART IDENTITY CASCADE`,
  );
  (getAdapters().mailer as MemoryMailer).clear();
}
beforeEach(reset);
afterEach(() => __setAdapters(undefined));
afterAll(() => db.$disconnect());

async function makeRequest(channel: "EMAIL" | "WHATSAPP") {
  const d = await requestService.createDraft({ clientChoseUnsure: false });
  await requestService.describeProblem(d.id, {
    problemText: "Fuga bajo el fregadero.",
    municipality: "Valencia",
    postalCode: "46007",
  });
  await requestService.attachContact(d.id, {
    name: "Ana",
    phone: channel === "WHATSAPP" ? "600111222" : "",
    email: channel === "EMAIL" ? "ana@example.com" : "",
    preferredChannel: channel,
    consent: { requestHandling: true, operationalComms: true, marketing: false, textVersion: "v1" },
  });
  await requestService.submit(d.id);
  return d.id;
}

describe("communicationService", () => {
  it("enqueues a pending email confirmation and is idempotent per (request, kind)", async () => {
    const requestId = await makeRequest("EMAIL");

    const first = await communicationService.enqueue({ requestId, kind: "CONFIRMATION" });
    expect(first.ok).toBe(true);
    if (!first.ok) throw new Error();
    expect(first.value.status).toBe("PENDING");

    const second = await communicationService.enqueue({ requestId, kind: "CONFIRMATION" });
    expect(second.ok && second.value.skipped).toBe(true);
    expect(second.ok && second.value.id).toBe(first.value.id);

    const rows = await communicationService.listForRequest(requestId);
    expect(rows).toHaveLength(1);
    expect(rows[0].channel).toBe("EMAIL");
  });

  it("sendPending delivers the queued email and marks it SENT", async () => {
    const requestId = await makeRequest("EMAIL");
    await communicationService.enqueue({ requestId, kind: "CONFIRMATION" });

    const res = await communicationService.sendPending();
    expect(res).toEqual({ sent: 1, failed: 0 });

    const outbox = (getAdapters().mailer as MemoryMailer).outbox;
    expect(outbox).toHaveLength(1);
    expect(outbox[0].to).toBe("ana@example.com");
    expect(outbox[0].subject).toContain("Praetoria Servicios");
    expect(outbox[0].html).toContain("<!doctype html>");

    const [row] = await communicationService.listForRequest(requestId);
    expect(row.status).toBe("SENT");
    expect(row.providerId).toBeTruthy();
    expect(row.attempts).toBe(1);
  });

  it("a send failure records FAILED and never loses the request (AC-13-nolost)", async () => {
    const requestId = await makeRequest("EMAIL");
    const real = getAdapters();
    __setAdapters({
      ...real,
      mailer: { async send() { return { ok: false, error: "smtp down" }; } },
    });

    await communicationService.notify({ requestId, kind: "CONFIRMATION" });

    const request = await db.request.findUnique({ where: { id: requestId } });
    expect(request?.status).toBe("PENDIENTE_ANALISIS"); // unchanged
    const [row] = await communicationService.listForRequest(requestId);
    expect(row.status).toBe("FAILED");
    expect(row.error).toContain("smtp down");
  });

  it("retry moves a FAILED row back to PENDING and a later send succeeds", async () => {
    const requestId = await makeRequest("EMAIL");
    const real = getAdapters();
    __setAdapters({
      ...real,
      mailer: { async send() { return { ok: false, error: "temporary" }; } },
    });
    await communicationService.enqueue({ requestId, kind: "CONFIRMATION" });
    await communicationService.sendPending();
    expect((await communicationService.listForRequest(requestId))[0].status).toBe("FAILED");

    __setAdapters(undefined); // back to the memory mailer
    (getAdapters().mailer as MemoryMailer).clear();
    const moved = await communicationService.retry(requestId);
    expect(moved).toBe(1);
    const res = await communicationService.sendPending();
    expect(res.sent).toBe(1);
    expect((await communicationService.listForRequest(requestId))[0].status).toBe("SENT");
  });

  it("WhatsApp is prepared as a link, never auto-sent, and carries the admin message", async () => {
    const requestId = await makeRequest("WHATSAPP");
    const enq = await communicationService.enqueue({
      requestId,
      kind: "INFO_REQUEST",
      message: "¿Qué modelo de caldera es?",
    });
    expect(enq.ok && enq.value.status).toBe("LINK_PREPARED");

    const res = await communicationService.sendPending();
    expect(res).toEqual({ sent: 0, failed: 0 }); // the queue ignores WhatsApp rows

    const [row] = await communicationService.listForRequest(requestId);
    const link = await communicationService.whatsappLink(row.id);
    expect(link.ok).toBe(true);
    if (link.ok) {
      expect(link.value.url).toContain("https://wa.me/34600111222");
      expect(decodeURIComponent(link.value.url)).toContain("¿Qué modelo de caldera es?");
    }
    expect((await communicationService.listForRequest(requestId))[0].status).toBe("LINK_PREPARED");
  });

  it("refuses to enqueue when the client cannot be reached", async () => {
    const d = await requestService.createDraft({ clientChoseUnsure: false });
    // no contact attached
    const r = await communicationService.enqueue({ requestId: d.id, kind: "CONFIRMATION" });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.kind).toBe("no_contact");
  });
});
