import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { requestService } from "./requests";
import { analysisService } from "./analysis";

async function reset() {
  await db.$executeRawUnsafe(
    `TRUNCATE TABLE "StatusEvent","ClientCorrection","AnalysisVersion","Photo","Contact","RequestLocation","Request" RESTART IDENTITY CASCADE`,
  );
}
beforeEach(reset);
afterAll(() => db.$disconnect());

describe("analysisService (mock adapter)", () => {
  it("produces a schema-valid analysis and stores it as the active version", async () => {
    const draft = await requestService.createDraft({ clientChoseUnsure: false });
    await requestService.describeProblem(draft.id, {
      problemText: "Hay una fuga de agua bajo el fregadero de la cocina desde ayer por la noche.",
      municipality: "Valencia",
      postalCode: "46007",
    });
    const r = await analysisService.analyze(draft.id);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value.outcome).toBe("OK");
      expect(r.value.result?.recommendedTrade).toBe("fontaneria");
      expect(r.value.result?.plainSummary).toBeTruthy();
      expect(r.value.version).toBe(1);
    }
    const active = await analysisService.getActive(draft.id);
    expect(active?.version).toBe(1);
  });

  it("flags NEEDS_MORE_INFO when the description is sparse and there are no photos", async () => {
    const draft = await requestService.createDraft({ clientChoseUnsure: true });
    await requestService.describeProblem(draft.id, {
      problemText: "no va bien",
      municipality: "Godella",
      postalCode: "46110",
    });
    const r = await analysisService.analyze(draft.id);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value.outcome).toBe("NEEDS_MORE_INFO");
  });

  it("re-analyses after a correction, keeping the history and bumping the version", async () => {
    const draft = await requestService.createDraft({ clientChoseUnsure: false });
    await requestService.describeProblem(draft.id, {
      problemText: "La lavadora no desagua y hace un ruido raro al centrifugar.",
      municipality: "Valencia",
      postalCode: "46007",
    });
    await analysisService.analyze(draft.id);
    await analysisService.recordCorrection({
      requestId: draft.id,
      wrongSections: ["oficio"],
      clarification: "En realidad creo que es un problema del desagüe, no del electrodoméstico.",
    });
    const second = await analysisService.analyze(draft.id);
    expect(second.ok).toBe(true);
    if (second.ok) expect(second.value.version).toBe(2);

    const history = await analysisService.history(draft.id);
    expect(history).toHaveLength(2);
    expect(history.filter((h) => h.isActive)).toHaveLength(1);
    expect(history.find((h) => h.isActive)?.version).toBe(2);
  });

  it("stops after the re-analysis cap", async () => {
    const draft = await requestService.createDraft({ clientChoseUnsure: false });
    await requestService.describeProblem(draft.id, {
      problemText: "Persiana del salón atascada, no sube ni baja.",
      municipality: "Valencia",
      postalCode: "46007",
    });
    for (let i = 0; i < 4; i++) await analysisService.analyze(draft.id);
    const capped = await analysisService.analyze(draft.id);
    expect(capped.ok).toBe(false);
    if (!capped.ok) expect(capped.error.kind).toBe("too_many_reanalyses");
  });
});
