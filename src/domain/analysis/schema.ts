import { z } from "zod";

/**
 * Structured AI analysis output (issue #7). The provider response is validated
 * against this schema; anything that does not conform is treated as a provider
 * error and offered for manual review. Provider "reasoning" is never stored.
 */

export const urgencyEnum = z.enum(["BAJA", "MEDIA", "ALTA", "EMERGENCIA"]);

export const analysisResultSchema = z.object({
  // Plain-language summary for the client.
  plainSummary: z.string().min(1).max(1200),
  // Technical description for quoting.
  technicalDescription: z.string().min(1).max(2000),
  probableProblem: z.string().min(1).max(800),
  possibleCauses: z.array(z.string().min(1).max(300)).max(6),
  // Orientative solution / alternatives — never presented as definitive.
  orientativeSolution: z.string().min(1).max(1500),
  alternatives: z.array(z.string().min(1).max(400)).max(4).default([]),
  recommendedTrade: z.string().min(1).max(40), // trade key or "no-se" if truly undetermined
  urgency: urgencyEnum,
  risks: z.array(z.string().min(1).max(300)).max(6).default([]),
  immediateSafeMeasures: z.array(z.string().min(1).max(300)).max(6).default([]),
  missingInfo: z.array(z.string().min(1).max(300)).max(6).default([]),
  confidence: z.number().int().min(0).max(100),
  requiresOnSiteInspection: z.boolean(),
});

export type AnalysisResult = z.infer<typeof analysisResultSchema>;

export const coverageVerdictEnum = z.enum([
  "COBERTURA_PROBABLE",
  "EXCLUSION_PROBABLE",
  "DUDOSA",
  "INFORMACION_INSUFICIENTE",
]);

export const pageReferenceSchema = z.object({
  document: z.string().min(1).max(120),
  page: z.number().int().positive(),
  quote: z.string().min(1).max(600),
});

export const coverageResultSchema = z.object({
  verdict: coverageVerdictEnum,
  applicableClause: z.string().max(1200).optional(),
  limitsAndExcess: z.array(z.string().min(1).max(400)).max(8).default([]),
  deadlines: z.array(z.string().min(1).max(300)).max(6).default([]),
  relevantExclusions: z.array(z.string().min(1).max(400)).max(8).default([]),
  factsToProve: z.array(z.string().min(1).max(300)).max(8).default([]),
  recommendedDocumentation: z.array(z.string().min(1).max(300)).max(8).default([]),
  // Every contractual assertion must carry a page reference (issue #15).
  references: z.array(pageReferenceSchema).default([]),
  openQuestions: z.array(z.string().min(1).max(300)).max(6).default([]),
  confidence: z.number().int().min(0).max(100),
});

export type CoverageResult = z.infer<typeof coverageResultSchema>;
