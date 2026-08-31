import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { applicationService } from "./applications";
import type { RawApplication } from "@/domain/professionals/application";

async function reset() {
  await db.$executeRawUnsafe(
    `TRUNCATE TABLE "ProfessionalApplication","AdminActionLog","AdminUser","Professional" RESTART IDENTITY CASCADE`,
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

const base: RawApplication = {
  name: "Juan Pérez",
  isCompany: false,
  trades: ["fontaneria"],
  municipalities: ["Burjassot"],
  phone: "612345678",
  email: "juan@example.com",
  availabilityNote: "Mañanas",
  experienceNote: "10 años en instalaciones",
  observations: "",
  website: "",
};

describe("applicationService", () => {
  it("stores a valid submission that then shows in the admin inbox (AC-20-inadmin)", async () => {
    const r = await applicationService.submit(base);
    expect(r.ok).toBe(true);
    const inbox = await applicationService.listForAdmin();
    expect(inbox).toHaveLength(1);
    expect(inbox[0].status).toBe("NUEVA");
    expect(inbox[0].trades).toEqual(["fontaneria"]);
  });

  it("silently drops a honeypot hit but still returns success (AC-20-antispam)", async () => {
    const r = await applicationService.submit({ ...base, website: "http://bot.example" });
    expect(r.ok).toBe(true);
    expect(await applicationService.listForAdmin()).toHaveLength(0);
  });

  it("dedupes a repeat submission within the window (idempotency, AC-20-antispam)", async () => {
    await applicationService.submit(base);
    await applicationService.submit({ ...base, phone: "+34 612 34 56 78", availabilityNote: "Tardes" });
    expect(await applicationService.listForAdmin()).toHaveLength(1);
  });

  it("rejects a submission with no known trade", async () => {
    const r = await applicationService.submit({ ...base, trades: ["no-such-trade"] });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.kind).toBe("invalid");
  });

  it("walks the status machine and records the actor", async () => {
    await admin();
    await applicationService.submit(base);
    const [app] = await applicationService.listForAdmin();

    expect((await applicationService.setStatus(app.id, "APROBADA", { adminId: ADMIN })).ok).toBe(false);
    expect((await applicationService.setStatus(app.id, "CONTACTADA", { adminId: ADMIN })).ok).toBe(true);
    expect((await applicationService.setStatus(app.id, "EN_VALIDACION", { adminId: ADMIN })).ok).toBe(true);

    const noReason = await applicationService.setStatus(app.id, "RECHAZADA", { adminId: ADMIN });
    expect(noReason.ok).toBe(false);

    const log = await db.adminActionLog.findFirst({ where: { action: "application_status" } });
    expect(log?.adminId).toBe(ADMIN);
  });

  it("appends internal notes with a timestamp", async () => {
    await admin();
    await applicationService.submit(base);
    const [app] = await applicationService.listForAdmin();
    await applicationService.addNote(app.id, "Llamado, no contesta", ADMIN);
    await applicationService.addNote(app.id, "Segundo intento OK", ADMIN);
    const fresh = await applicationService.get(app.id);
    expect(fresh?.internalNotes?.split("\n")).toHaveLength(2);
    expect(fresh?.internalNotes).toMatch(/Segundo intento OK/);
  });

  it("converts an APROBADA application into a CANDIDATO professional, once (AC-20-noaccess bridge)", async () => {
    await admin();
    await applicationService.submit(base);
    const [app] = await applicationService.listForAdmin();

    expect((await applicationService.convertToProfessional(app.id, ADMIN)).ok).toBe(false); // not approved

    await applicationService.setStatus(app.id, "EN_VALIDACION", { adminId: ADMIN });
    await applicationService.setStatus(app.id, "APROBADA", { adminId: ADMIN });

    const conv = await applicationService.convertToProfessional(app.id, ADMIN);
    expect(conv.ok).toBe(true);
    if (!conv.ok) return;
    const pro = await db.professional.findUnique({ where: { id: conv.value.professionalId } });
    expect(pro?.status).toBe("CANDIDATO");
    expect(pro?.trades).toEqual(["fontaneria"]);

    const again = await applicationService.convertToProfessional(app.id, ADMIN);
    expect(again.ok).toBe(false);
    if (!again.ok) expect(again.error.kind).toBe("already_converted");
  });
});
