import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { requestService } from "./requests";
import { analysisService } from "./analysis";
import { insuranceService } from "./insurance";
import { coverageService } from "./coverage";
import { hashPassword } from "@/lib/password";

async function reset() {
  await db.$executeRawUnsafe(
    `TRUNCATE TABLE "CoverageDraftRevision","CoverageAnalysis","InsuranceDocument","InsuranceCase","AnalysisVersion","ClientCorrection","Consent","Contact","RequestLocation","StatusEvent","Request","AdminUser" RESTART IDENTITY CASCADE`,
  );
}
beforeEach(reset);
afterAll(() => db.$disconnect());

const PDF = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34]);

async function ready(withDoc = true) {
  const admin = await db.adminUser.create({
    data: { email: "c@x.test", name: "C", passwordHash: await hashPassword("pw"), role: "ADMIN" },
  });
  const d = await requestService.createDraft({ clientChoseUnsure: false });
  await requestService.describeProblem(d.id, {
    problemText: "Mancha de humedad en el techo del baño tras la lluvia.",
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
  await analysisService.analyze(d.id); // active analysis
  await insuranceService.recordConsent(d.id, true, "v1");
  if (withDoc) {
    await insuranceService.addDocument({ requestId: d.id, bytes: PDF, size: PDF.length, kind: "condiciones_particulares" });
  }
  return { admin, requestId: d.id };
}

describe("coverageService", () => {
  it("needs a policy before it can analyse", async () => {
    const { requestId } = await ready(false);
    await db.insuranceCase.delete({ where: { requestId } });
    const r = await coverageService.analyze(requestId);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.kind).toBe("no_policy");
  });

  it("produces a verdict, a breakdown with page references, and a pending draft", async () => {
    const { requestId } = await ready();
    const r = await coverageService.analyze(requestId);
    expect(r.ok).toBe(true);

    const view = await coverageService.getForRequest(requestId);
    expect(view).not.toBeNull();
    expect(["COBERTURA_PROBABLE", "EXCLUSION_PROBABLE", "DUDOSA", "INFORMACION_INSUFICIENTE"]).toContain(
      view!.verdict,
    );
    expect(view!.draftStatusLabel).toBe("Borrador pendiente de revisión");
    expect(view!.reviewed).toBe(false);
    // D5 three-way split
    expect(view!.breakdown!.legalNorm.process.join(" ")).toContain("Defensor del Asegurado");
    expect(view!.breakdown!.policyClause.references.length).toBeGreaterThan(0);
    // draft has the four parts
    for (const part of ["HECHOS", "PETICIÓN", "FUNDAMENTO CONTRACTUAL", "ANEXOS"]) {
      expect(view!.draftText).toContain(part);
    }
  });

  it("asks for the document when there is no policy text", async () => {
    const { requestId } = await ready(false);
    const r = await coverageService.analyze(requestId);
    expect(r.ok).toBe(true);
    const view = await coverageService.getForRequest(requestId);
    expect(view!.verdict).toBe("INFORMACION_INSUFICIENTE");
    expect(view!.needsPolicyDocument).toBe(true);
  });

  it("records the human review with the admin and a revision, and only then shows 'reviewed'", async () => {
    const { admin, requestId } = await ready();
    await coverageService.analyze(requestId);

    const before = await coverageService.getForRequest(requestId);
    expect(before!.reviewed).toBe(false);

    const mr = await coverageService.markReviewed(admin.id, requestId, "Revisado y ajustado.");
    expect(mr.ok).toBe(true);

    const after = await coverageService.getForRequest(requestId);
    expect(after!.reviewed).toBe(true);
    expect(after!.draftStatusLabel).toBe("Revisado por Praetoria");
    expect(after!.reviewedAt).toBeTruthy();
    expect(after!.revisions.length).toBe(1);

    const row = await db.coverageAnalysis.findFirst();
    expect(row?.reviewedByAdminId).toBe(admin.id);
  });

  it("a re-analysis resets the review state (the text changed)", async () => {
    const { admin, requestId } = await ready();
    await coverageService.analyze(requestId);
    await coverageService.markReviewed(admin.id, requestId);
    expect((await coverageService.getForRequest(requestId))!.reviewed).toBe(true);

    await coverageService.analyze(requestId);
    expect((await coverageService.getForRequest(requestId))!.reviewed).toBe(false);
  });

  it("an edit keeps the previous text as a revision", async () => {
    const { admin, requestId } = await ready();
    await coverageService.analyze(requestId);
    const original = (await coverageService.getForRequest(requestId))!.draftText;

    await coverageService.reviseDraft(admin.id, requestId, "Texto nuevo del borrador.", "Ajuste de redacción.");
    const view = await coverageService.getForRequest(requestId);
    expect(view!.draftText).toBe("Texto nuevo del borrador.");
    expect(view!.revisions.length).toBe(1);
    const rev = await db.coverageDraftRevision.findFirst();
    expect(rev?.draftText).toBe(original);
  });
});
