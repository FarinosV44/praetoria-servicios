import type { AnalysisResult, CoverageResult } from "@/domain/analysis/schema";
import type { Result } from "@/lib/result";

/**
 * AiAnalyzer — the only seam between the product and an AI provider (issue #7).
 * Domain code depends on this interface, never on a concrete provider.
 */

export interface ProblemAnalysisInput {
  problemText: string;
  clientChoseUnsure: boolean;
  declaredTrade?: string;
  photos: { data: Uint8Array; contentType: string; hint?: string }[];
  municipality?: string;
  /** prior analysis + client clarification, when this is a re-analysis (issue #8) */
  priorResult?: AnalysisResult;
  clientClarification?: string;
  wrongSections?: string[];
}

export interface CoverageAnalysisInput {
  analysis: AnalysisResult;
  problemText: string;
  policyPages: { document: string; page: number; text: string }[];
}

export type AiError =
  | { kind: "timeout" }
  | { kind: "provider"; message: string }
  | { kind: "invalid_output"; message: string };

export interface AiAnalyzer {
  readonly promptVersion: string;
  analyzeProblem(input: ProblemAnalysisInput): Promise<Result<AnalysisResult, AiError>>;
  analyzeCoverage(input: CoverageAnalysisInput): Promise<Result<CoverageResult, AiError>>;
}

export { createMockAiAnalyzer } from "./mock";
