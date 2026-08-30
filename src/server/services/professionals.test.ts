import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { requestService } from "./requests";
import { professionalService } from "./professionals";
import { assignmentService } from "./assignment";

async function reset() {
  await db.$executeRawUnsafe(
    `TRUNCATE TABLE "Assignment","ProfessionalDocument","ProfessionalVerification","ProfessionalCredential","Professional","AdminActionLog","AdminUser","StatusEvent","Contact","RequestLocation","Request" RESTART IDENTITY CASCADE`,
  );
}
beforeEach(reset);
afterAll(() => db.$disconnect());

const ADMIN = "admin-1";
const PDF = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34]);

async function admin() {
  const a = await db.adminUser.create({
    data: { id: ADMIN, email: "a@praetoria.local", name: "A", passwordHash: "x" },
  });
  return a.id;
}

async function approvedPro(over: { trades?: string[]; municipalities?: string[] } = {}) {
  const c = await professionalService.create(
    {
      legalName: "Juan Pérez",
      displayName: "Juan P.",
      trades: over.trades ?? ["fontaneria"],
      municipalities: over.municipalities ?? ["Valencia"],
    },
    ADMIN,
  );
  if (!c.ok) throw new Error("create failed");
  await professionalService.transition(c.value.id, "DOCUMENTACION_PENDIENTE", { adminId: ADMIN });
  await professionalService.transition(c.value.id, "VERIFICANDO", { adminId: ADMIN });
  await professionalService.transition(c.value.id, "APROBADO", { adminId: ADMIN });
  return c.value.id;
}

async function submittedRequest(over: Partial<{ trade: string; municipality: string; postalCode: string }> = {}) {
  const d = await requestService.createDraft({ trade: over.trade ?? "fontaneria", clientChoseUnsure: false });
  await requestService.describeProblem(d.id, {
    problemText: "Fuga de agua bajo el fregadero de la cocina.",
    municipality: over.municipality ?? "Valencia",
    postalCode: over.postalCode ?? "46001",
  });
  return d.id;
}

describe("professionalService", () => {
  it("creates a CANDIDATO with a non-sequential reference + an audit log", async () => {
    await admin();
    const r = await professionalService.create(
      { legalName: "Ana Ruiz", displayName: "Ana R.", trades: ["montaje"], municipalities: ["Godella"] },
      ADMIN,
    );
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.value.reference).toMatch(/^PRO-[2-9A-HJ-NP-Z]{4}$/);
    const p = await professionalService.getById(r.value.id);
    expect(p?.status).toBe("CANDIDATO");
    const logs = await db.adminActionLog.findMany({ where: { professionalId: r.value.id } });
    expect(logs.map((l) => l.action)).toContain("professional_created");
  });

  it("rejects an invalid transition and requires a reason to suspend", async () => {
    await admin();
    const c = await professionalService.create(
      { legalName: "X", displayName: "X", trades: [], municipalities: [] },
      ADMIN,
    );
    if (!c.ok) return;
    const bad = await professionalService.transition(c.value.id, "APROBADO", { adminId: ADMIN });
    expect(bad.ok).toBe(false);
    if (!bad.ok) expect(bad.error.kind).toBe("invalid_transition");

    const id = await approvedPro();
    const noReason = await professionalService.transition(id, "SUSPENDIDO", { adminId: ADMIN });
    expect(noReason.ok).toBe(false);
    if (!noReason.ok) expect(noReason.error.kind).toBe("reason_required");
  });

  it("records who/when/what for a verification", async () => {
    await admin();
    const id = await approvedPro();
    await professionalService.recordVerification(
      id,
      { kind: "IDENTITY", passed: true, note: "DNI comprobado" },
      ADMIN,
    );
    const p = await professionalService.getById(id);
    expect(p?.verifications).toHaveLength(1);
    expect(p?.verifications[0].checkedByAdminId).toBe(ADMIN);
    expect(p?.verifications[0].kind).toBe("IDENTITY");
    expect(p?.verifications[0].checkedAt).toBeInstanceOf(Date);
  });

  it("stores a document as a private blob and deletes it verifiably", async () => {
    await admin();
    const id = await approvedPro();
    const add = await professionalService.addDocument(
      id,
      { bytes: PDF, size: PDF.length, contentType: "application/pdf", kind: "rc" },
      ADMIN,
    );
    expect(add.ok).toBe(true);
    if (!add.ok) return;
    let p = await professionalService.getById(id);
    expect(p?.documents).toHaveLength(1);
    expect(p?.documents[0].storageKey).toMatch(/^professional\//);

    const del = await professionalService.deleteDocument(add.value.id, ADMIN);
    expect(del.ok).toBe(true);
    p = await professionalService.getById(id);
    expect(p?.documents).toHaveLength(0);
  });

  it("suspension ends active assignments but keeps the rows (history preserved)", async () => {
    await admin();
    const proId = await approvedPro();
    const reqId = await submittedRequest();
    const a = await assignmentService.assign({ requestId: reqId, professionalId: proId, adminId: ADMIN });
    expect(a.ok).toBe(true);

    await professionalService.transition(proId, "SUSPENDIDO", { adminId: ADMIN, reason: "incidencia" });

    const active = await db.assignment.findFirst({ where: { requestId: reqId, active: true } });
    expect(active).toBeNull();
    const all = await db.assignment.findMany({ where: { requestId: reqId } });
    expect(all).toHaveLength(1); // the row survives
    expect(all[0].endedReason).toContain("suspendido");
  });

  it("lists items nearing expiry", async () => {
    await admin();
    const id = await approvedPro();
    const soon = new Date(Date.now() + 10 * 24 * 3600_000);
    const later = new Date(Date.now() + 400 * 24 * 3600_000);
    await professionalService.addCredential(
      id,
      { trade: "fontaneria", label: "Carné", expiresAt: soon },
      ADMIN,
    );
    await professionalService.addCredential(
      id,
      { trade: "montaje", label: "Otro", expiresAt: later },
      ADMIN,
    );
    const items = await professionalService.expiringItems();
    expect(items.credentials).toHaveLength(1);
    expect(items.credentials[0].professional.reference).toMatch(/^PRO-/);
  });
});

describe("assignmentService", () => {
  it("blocks an incompatible assignment and reports why", async () => {
    await admin();
    const proId = await approvedPro({ trades: ["fontaneria"], municipalities: ["Valencia"] });
    const reqId = await submittedRequest({ trade: "electricidad", municipality: "Sevilla", postalCode: "41001" });
    const r = await assignmentService.assign({ requestId: reqId, professionalId: proId, adminId: ADMIN });
    expect(r.ok).toBe(false);
    if (!r.ok && r.error.kind === "incompatible") {
      const kinds = r.error.reasons.map((x) => x.kind).sort();
      expect(kinds).toContain("trade");
      expect(kinds).toContain("zone");
    }
  });

  it("blocks a regulated trade without a valid credential, then allows it once added", async () => {
    await admin();
    const proId = await approvedPro({ trades: ["electricidad"], municipalities: ["Valencia"] });
    const reqId = await submittedRequest({ trade: "electricidad" });

    const blocked = await assignmentService.assign({ requestId: reqId, professionalId: proId, adminId: ADMIN });
    expect(blocked.ok).toBe(false);
    if (!blocked.ok && blocked.error.kind === "incompatible") {
      expect(blocked.error.reasons.some((x) => x.kind === "credential")).toBe(true);
    }

    await professionalService.addCredential(
      proId,
      { trade: "electricidad", label: "Carné BT", expiresAt: new Date(Date.now() + 365 * 24 * 3600_000) },
      ADMIN,
    );
    const ok = await assignmentService.assign({ requestId: reqId, professionalId: proId, adminId: ADMIN });
    expect(ok.ok).toBe(true);
  });

  it("substitutes a professional keeping traceability", async () => {
    await admin();
    const p1 = await approvedPro({ municipalities: ["Valencia"] });
    const p2 = await approvedPro({ municipalities: ["Valencia"] });
    const reqId = await submittedRequest();

    await assignmentService.assign({ requestId: reqId, professionalId: p1, adminId: ADMIN });
    const sub = await assignmentService.assign({
      requestId: reqId,
      professionalId: p2,
      adminId: ADMIN,
      reason: "no disponible",
    });
    expect(sub.ok).toBe(true);

    const rows = await db.assignment.findMany({ where: { requestId: reqId }, orderBy: { assignedAt: "asc" } });
    expect(rows).toHaveLength(2);
    expect(rows[0].active).toBe(false);
    expect(rows[0].professionalId).toBe(p1);
    expect(rows[1].active).toBe(true);
    expect(rows[1].professionalId).toBe(p2);
  });

  it("the client view is not 'verificado' on a contact-only check", async () => {
    await admin();
    const proId = await approvedPro({ municipalities: ["Valencia"] });
    const reqId = await submittedRequest();
    await professionalService.recordVerification(proId, { kind: "CONTACT", passed: true }, ADMIN);
    await assignmentService.assign({ requestId: reqId, professionalId: proId, adminId: ADMIN });

    const view = await assignmentService.clientProfessionalView(reqId);
    expect(view?.isVerified).toBe(false);

    await professionalService.recordVerification(proId, { kind: "IDENTITY", passed: true }, ADMIN);
    const view2 = await assignmentService.clientProfessionalView(reqId);
    expect(view2?.isVerified).toBe(true);
    expect(view2?.verifiedScope).toContain("Identidad");
  });
});
