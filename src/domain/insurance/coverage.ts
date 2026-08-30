import type { CoverageResult } from "@/domain/analysis/schema";

/**
 * Coverage analysis presentation + legal-draft assembly (issue #15, benchmark D5).
 * Pure. The AI produces the structured `CoverageResult`; here we (a) split it into
 * the three things D5 requires kept separate — cláusula de póliza · norma legal ·
 * valoración — and (b) assemble a prudent "borrador de parte/reclamación".
 *
 * Rules baked in: never promise coverage or a result; never invent articles or
 * cite generic laws when the conclusion depends on the contract; the draft is
 * always labelled "borrador pendiente de revisión" until an admin acts.
 */

export const VERDICT_LABEL: Record<CoverageResult["verdict"], string> = {
  COBERTURA_PROBABLE: "Cobertura probable",
  EXCLUSION_PROBABLE: "Exclusión probable",
  DUDOSA: "Dudosa",
  INFORMACION_INSUFICIENTE: "Información insuficiente",
};

export const DRAFT_PENDING_LABEL = "Borrador pendiente de revisión";
export const DRAFT_REVIEWED_LABEL = "Revisado por Praetoria";

/**
 * The D5 three-way split. `policyClause` and its references come straight from
 * the contract; `legalNorm` is only ever the *process* framework (never a
 * specific article the conclusion hinges on); `assessment` is Praetoria's
 * prudent reading, always hedged.
 */
export type CoverageBreakdown = {
  policyClause: {
    text: string | null;
    references: CoverageResult["references"];
    exclusions: string[];
    limitsAndExcess: string[];
    deadlines: string[];
  };
  legalNorm: {
    /** the real process, not an invented article */
    process: string[];
  };
  assessment: {
    verdict: CoverageResult["verdict"];
    verdictLabel: string;
    confidence: number;
    factsToProve: string[];
    recommendedDocumentation: string[];
    openQuestions: string[];
    caveats: string[];
  };
};

const PROCESS_STEPS = [
  "Si hay desacuerdo con la aseguradora, cada parte puede nombrar un perito.",
  "Si los peritos no se ponen de acuerdo, se designa un tercer perito y emiten un dictamen.",
  "Puedes reclamar ante el Servicio de Atención al Cliente de la aseguradora y, después, ante el Defensor del Asegurado.",
  "Como última vía administrativa, existe la Dirección General de Seguros y Fondos de Pensiones (DGSFP).",
  "Siempre queda abierta la vía judicial.",
];

const STANDARD_CAVEATS = [
  "Este análisis es orientativo y no garantiza la cobertura ni el resultado: la decisión final es de la aseguradora, normalmente tras la visita de un perito.",
  "No se citan artículos concretos de una ley cuando la conclusión depende del clausulado del contrato.",
  'Un rechazo frecuente es "falta de mantenimiento": conviene poder acreditar el origen súbito y accidental del daño y que se comunicó en plazo.',
];

export function buildCoverageBreakdown(result: CoverageResult): CoverageBreakdown {
  return {
    policyClause: {
      text: result.applicableClause ?? null,
      references: result.references ?? [],
      exclusions: result.relevantExclusions ?? [],
      limitsAndExcess: result.limitsAndExcess ?? [],
      deadlines: result.deadlines ?? [],
    },
    legalNorm: { process: PROCESS_STEPS },
    assessment: {
      verdict: result.verdict,
      verdictLabel: VERDICT_LABEL[result.verdict],
      confidence: result.confidence,
      factsToProve: result.factsToProve ?? [],
      recommendedDocumentation: result.recommendedDocumentation ?? [],
      openQuestions: result.openQuestions ?? [],
      caveats: STANDARD_CAVEATS,
    },
  };
}

/**
 * True when the conclusion is blocked on a missing policy document — the system
 * should then ask the client to upload it (issue #15: "Si falta la condición
 * aplicable, el sistema pide el documento").
 */
export function needsPolicyDocument(result: CoverageResult): boolean {
  return (
    result.verdict === "INFORMACION_INSUFICIENTE" ||
    (!result.applicableClause && result.references.length === 0)
  );
}

export type DraftContext = {
  clientName: string;
  reference: string;
  insurerName: string | null;
  policyNumber: string | null;
  problemSummary: string;
};

/**
 * Assemble the "borrador de parte/reclamación". Includes the four parts issue
 * #15 requires: hechos, petición, fundamento contractual, anexos. Always prudent,
 * always labelled pending review by the caller.
 */
export function buildDraft(result: CoverageResult, ctx: DraftContext): string {
  const lines: string[] = [];
  const p = (s: string) => lines.push(s);

  p(`A la atención de ${ctx.insurerName ?? "[aseguradora]"}`);
  p(`Póliza: ${ctx.policyNumber ?? "[número de póliza]"} · Referencia interna: ${ctx.reference}`);
  p("");
  p(`${ctx.clientName}, tomador/asegurado de la póliza indicada, comunica lo siguiente.`);
  p("");

  p("HECHOS");
  p(ctx.problemSummary);
  if (result.factsToProve.length > 0) {
    p("");
    p("Hechos que se acreditarán:");
    for (const f of result.factsToProve) p(`- ${f}`);
  }
  p("");

  p("PETICIÓN");
  if (result.verdict === "EXCLUSION_PROBABLE") {
    p(
      "Se solicita la revisión del expediente y, en su caso, la designación de perito, así como una " +
        "resolución motivada con referencia a la cláusula concreta que se considere aplicable.",
    );
  } else {
    p(
      "Se solicita la tramitación del siniestro con cargo a las garantías contratadas, la designación " +
        "de perito si procede y la indemnización o reparación que corresponda conforme a la póliza.",
    );
  }
  p("");

  p("FUNDAMENTO CONTRACTUAL");
  if (result.applicableClause) {
    p(`Cláusula potencialmente aplicable: ${result.applicableClause}`);
  } else {
    p(
      "No se dispone todavía del texto de la condición aplicable; se aportará al recibir el " +
        "condicionado completo.",
    );
  }
  for (const r of result.references) {
    p(`- ${r.document}, pág. ${r.page}: "${r.quote}"`);
  }
  if (result.limitsAndExcess.length > 0) {
    p("Límites y franquicias a considerar:");
    for (const l of result.limitsAndExcess) p(`- ${l}`);
  }
  if (result.deadlines.length > 0) {
    p("Plazos:");
    for (const d of result.deadlines) p(`- ${d}`);
  }
  if (result.relevantExclusions.length > 0) {
    p("Exclusiones que la aseguradora podría invocar (y que se rebaten con los hechos anteriores):");
    for (const e of result.relevantExclusions) p(`- ${e}`);
  }
  p("");

  p("ANEXOS");
  const anexos =
    result.recommendedDocumentation.length > 0
      ? result.recommendedDocumentation
      : ["Fotografías del daño", "Copia de la póliza", "Presupuesto o factura de la reparación"];
  for (const a of anexos) p(`- ${a}`);
  p("");

  p(
    "Este escrito es un borrador orientativo pendiente de revisión. No constituye asesoramiento " +
      "jurídico ni garantiza la cobertura.",
  );

  return lines.join("\n");
}
