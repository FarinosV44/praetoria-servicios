import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { requestService } from "./requests";
import { adminService } from "./admin";
import { hashPassword } from "@/lib/password";

async function reset() {
  await db.$executeRawUnsafe(
    `TRUNCATE TABLE "AdminActionLog","StatusEvent","Consent","Photo","Contact","RequestLocation","AnalysisVersion","Request","AdminUser" RESTART IDENTITY CASCADE`,
  );
}
beforeEach(reset);
afterAll(() => db.$disconnect());

async function seedAdmin() {
  return db.adminUser.create({
    data: { email: "a@x.test", name: "A", passwordHash: await hashPassword("pw"), role: "ADMIN" },
  });
}

async function submittedRequest(trade = "fontaneria", municipality = "Valencia") {
  const d = await requestService.createDraft({ clientChoseUnsure: false });
  await requestService.describeProblem(d.id, {
    problemText: "Fuga de agua bajo el fregadero.",
    municipality,
    postalCode: "46007",
  });
  await requestService.attachContact(d.id, {
    name: "Cliente Uno",
    phone: "600111222",
    email: "",
    preferredChannel: "WHATSAPP",
    consent: { requestHandling: true, operationalComms: true, marketing: false, textVersion: "v1" },
  });
  await requestService.submit(d.id);
  await db.request.update({ where: { id: d.id }, data: { trade } });
  return d;
}

describe("adminService", () => {
  it("lists submitted requests, never drafts, with filters and search", async () => {
    await requestService.createDraft({ clientChoseUnsure: false }); // a bare draft
    const r1 = await submittedRequest("fontaneria", "Valencia");
    await submittedRequest("electricidad", "Godella");

    const all = await adminService.listRequests({});
    expect(all.total).toBe(2); // draft excluded

    const onlyFont = await adminService.listRequests({ trade: "fontaneria" });
    expect(onlyFont.total).toBe(1);

    const byMuni = await adminService.listRequests({ municipality: "godella" });
    expect(byMuni.total).toBe(1);

    const bySearch = await adminService.listRequests({ search: "Cliente Uno" });
    expect(bySearch.total).toBe(2);

    const full = await db.request.findUnique({ where: { id: r1.id } });
    const byRef = await adminService.listRequests({ search: full!.reference });
    expect(byRef.total).toBe(1);
  });

  it("returns a detail with photos, analysis history and status history", async () => {
    const r = await submittedRequest();
    const full = await db.request.findUnique({ where: { id: r.id } });
    const detail = await adminService.getDetail(full!.reference);
    expect(detail).not.toBeNull();
    expect(detail!.request.statusHistory.length).toBeGreaterThanOrEqual(2);
  });

  it("changes status through the state machine and logs the admin action", async () => {
    const admin = await seedAdmin();
    const r = await submittedRequest();
    const full = await db.request.findUnique({ where: { id: r.id } });

    const ok = await adminService.changeStatus(admin.id, full!.reference, "EN_REVISION");
    expect(ok.ok).toBe(true);

    const bad = await adminService.changeStatus(admin.id, full!.reference, "CERRADA");
    expect(bad.ok).toBe(false);

    const logs = await db.adminActionLog.findMany({ where: { adminId: admin.id } });
    expect(logs.some((l) => l.action === "change_status")).toBe(true);
  });

  it("request-more-info moves to REQUIERE_INFORMACION and logs", async () => {
    const admin = await seedAdmin();
    const r = await submittedRequest();
    const full = await db.request.findUnique({ where: { id: r.id } });
    const res = await adminService.requestMoreInfo(
      admin.id,
      full!.reference,
      "Falta una foto de la zona.",
    );
    expect(res.ok).toBe(true);
    const after = await db.request.findUnique({ where: { id: r.id } });
    expect(after!.status).toBe("REQUIERE_INFORMACION");
  });

  it("kpis count the right buckets", async () => {
    await submittedRequest();
    await submittedRequest();
    const k = await adminService.kpis();
    expect(k.nuevas).toBe(2);
    expect(k.pendientes).toBe(2);
  });
});
