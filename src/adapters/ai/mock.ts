import {
  analysisResultSchema,
  coverageResultSchema,
  type AnalysisResult,
  type CoverageResult,
} from "@/domain/analysis/schema";
import { ok, type Result } from "@/lib/result";
import { isKnownTrade } from "@/config/trades";
import type { AiAnalyzer, AiError, CoverageAnalysisInput, ProblemAnalysisInput } from "./index";

/**
 * Deterministic mock analyzer for development and tests (issue #7:
 * "Existe adaptador simulado para desarrollo y tests"). No network, no keys.
 *
 * Heuristics are intentionally simple keyword matching — enough to exercise
 * every downstream branch (ok / needs-more-info / trade classification).
 */

const TRADE_HINTS: [RegExp, string][] = [
  [/fuga|agua|grifo|desag|tuber|cister|inodoro|water|calentador/i, "fontaneria"],
  [/enchufe|luz|luces|corto|chispa|diferencial|cuadro|electr(i|í)/i, "electricidad"],
  [/lavadora|nevera|frigor|horno|secadora|lavavaj|electrodom/i, "electrodomesticos"],
  [/mueble|estanter|montar|montaje|armario|ikea|television|tv/i, "montaje"],
  [/puerta|madera|carpinter|bisagra|persiana/i, "carpinteria"],
  [/pintar|pintura|pared|techo|gotel/i, "pintura"],
  [/jard(i|í)n|poda|c(e|é)sped|riego|planta/i, "jardineria"],
  [/limpiez|limpiar/i, "limpieza"],
  [/mudanz|traslad|embalaj/i, "mudanzas"],
  [/aire|clima|calefacc|radiador|caldera|bomba de calor/i, "climatizacion"],
  [/cerradura|llave|cerrajer|bombin/i, "cerrajeria"],
];

function guessTrade(text: string, declared?: string): string {
  if (declared && isKnownTrade(declared)) return declared;
  for (const [re, key] of TRADE_HINTS) if (re.test(text)) return key;
  return "montaje";
}

function needsMoreInfo(input: ProblemAnalysisInput): boolean {
  return input.problemText.trim().length < 25 && input.photos.length === 0;
}

export function createMockAiAnalyzer(): AiAnalyzer {
  return {
    promptVersion: "mock-1",

    async analyzeProblem(input: ProblemAnalysisInput): Promise<Result<AnalysisResult, AiError>> {
      const trade = guessTrade(input.problemText, input.declaredTrade);
      const urgent = /urgente|inund|humo|gas|chispa|sin luz|no puedo|peligro/i.test(
        input.problemText,
      );
      const sparse = needsMoreInfo(input);

      const result: AnalysisResult = analysisResultSchema.parse({
        plainSummary: sparse
          ? "Necesitamos un poco más de información para entender bien el problema."
          : `Parece un problema de ${trade}. Hemos resumido lo que nos has contado para que un técnico pueda valorarlo.`,
        technicalDescription: sparse
          ? "Información insuficiente para una descripción técnica."
          : `Incidencia declarada por el cliente relacionada con ${trade}. Texto aportado: "${input.problemText.slice(0, 400)}".`,
        probableProblem: sparse
          ? "Por determinar."
          : `Posible avería de ${trade} pendiente de confirmar en visita.`,
        possibleCauses: sparse
          ? []
          : ["Desgaste de una pieza", "Instalación antigua o mal ajustada"],
        orientativeSolution: sparse
          ? "Añade una descripción algo más larga y, si puedes, una foto general y otra de detalle."
          : "Un profesional revisará la zona, identificará la causa y propondrá la reparación adecuada. Esto es orientativo.",
        alternatives: [],
        recommendedTrade: sparse && input.clientChoseUnsure ? "no-se" : trade,
        urgency: urgent ? "ALTA" : "MEDIA",
        risks: urgent ? ["No manipules la instalación si hay riesgo eléctrico o de agua."] : [],
        immediateSafeMeasures: urgent
          ? ["Cierra la llave de paso o el diferencial si sabes hacerlo con seguridad."]
          : [],
        missingInfo: sparse ? ["Descripción más detallada", "Al menos una fotografía"] : [],
        confidence: sparse ? 20 : 62,
        requiresOnSiteInspection: true,
      });

      return ok(result);
    },

    async analyzeCoverage(input: CoverageAnalysisInput): Promise<Result<CoverageResult, AiError>> {
      const hasPages = input.policyPages.length > 0;
      return ok(
        coverageResultSchema.parse({
          verdict: hasPages ? "DUDOSA" : "INFORMACION_INSUFICIENTE",
          applicableClause: hasPages
            ? "Cláusula de daños por agua (pendiente de confirmar)."
            : undefined,
          limitsAndExcess: hasPages ? ["Franquicia orientativa por determinar"] : [],
          deadlines: hasPages
            ? ["Comunicación del siniestro en el plazo indicado en las condiciones"]
            : [],
          relevantExclusions: [],
          factsToProve: ["Origen del daño", "Fecha en que se detectó"],
          recommendedDocumentation: [
            "Fotografías del daño",
            "Factura de la reparación si ya se hizo",
          ],
          references: hasPages
            ? [
                {
                  document: input.policyPages[0].document,
                  page: input.policyPages[0].page,
                  quote: input.policyPages[0].text.slice(0, 180),
                },
              ]
            : [],
          openQuestions: hasPages
            ? ["¿La póliza incluye la garantía de daños por agua?"]
            : ["Falta el documento de condiciones."],
          confidence: hasPages ? 35 : 10,
        }),
      );
    },
  };
}
