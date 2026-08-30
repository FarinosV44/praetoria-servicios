import { log } from "./logging";

/**
 * Observability (issue #19): error reporting + AI latency/cost metrics.
 *
 * Everything here goes through `src/lib/logging.ts`, whose `redact` walks the
 * fields and masks anything PII-shaped — so error context and metrics are safe
 * to emit even if a caller passes something it shouldn't. The AI metric shape is
 * numbers + enums only: it carries no problem text, no photos, no contact data.
 *
 * Sinks are seams: today everything is a structured log line (picked up by the
 * host's log drain). A real error tracker / metrics backend is wired by reading
 * `ERROR_SINK_URL` / `METRICS_SINK_URL` here — never by importing a vendor SDK
 * into domain code.
 */

export interface ErrorContext {
  /** where it happened, e.g. "api/cron/retention", "analysisService.analyze" */
  component: string;
  /** what was being attempted */
  action?: string;
  /** a public request reference is fine; never an internal id or PII */
  requestRef?: string;
  [key: string]: unknown;
}

/** Report an unexpected error. Redaction is applied by the logger. */
export function reportError(error: unknown, context: ErrorContext): void {
  const e = error instanceof Error ? error : new Error(String(error));
  log.error("unhandled error", {
    ...context,
    // "errType" not "errorName" — the logger redacts any field key containing "name"
    errType: e.name,
    errMessage: e.message,
    // first few stack frames only — enough to locate, small enough to read
    stack: e.stack?.split("\n").slice(0, 4).join(" | "),
  });
}

export type AiOperation = "analyzeProblem" | "analyzeCoverage";
export type AiOutcome = "ok" | "timeout" | "provider" | "invalid_output" | "exception";

export interface AiCallMetric {
  operation: AiOperation;
  outcome: AiOutcome;
  durationMs: number;
  promptVersion: string;
  /** provider usage, when a real provider returns it; undefined for the mock */
  inputTokens?: number;
  outputTokens?: number;
  costMicros?: number;
}

const MAX_DURATION_MS = 1000 * 120;

/** Shape a raw metric into the safe, clamped record that gets emitted. */
export function buildAiMetric(m: AiCallMetric): Record<string, string | number> {
  const out: Record<string, string | number> = {
    operation: m.operation,
    outcome: m.outcome,
    promptVersion: m.promptVersion,
    durationMs: Math.min(Math.max(Math.round(m.durationMs), 0), MAX_DURATION_MS),
  };
  for (const key of ["inputTokens", "outputTokens", "costMicros"] as const) {
    const v = m[key];
    if (typeof v === "number" && Number.isFinite(v) && v >= 0) out[key] = Math.round(v);
  }
  return out;
}

/** Record one AI provider call. No PII — numbers and enums only. */
export function recordAiCall(m: AiCallMetric): void {
  log.info("ai.call", buildAiMetric(m));
}

interface ResultLike {
  ok: boolean;
  error?: { kind?: string };
}

/**
 * Time an AI call and record its metric. Passes the Result straight through, so
 * call sites are unchanged apart from the wrapper.
 */
export async function timeAiCall<T extends ResultLike>(
  operation: AiOperation,
  promptVersion: string,
  fn: () => Promise<T>,
): Promise<T> {
  const start = Date.now();
  try {
    const res = await fn();
    const outcome: AiOutcome = res.ok ? "ok" : ((res.error?.kind as AiOutcome) ?? "provider");
    recordAiCall({ operation, outcome, promptVersion, durationMs: Date.now() - start });
    return res;
  } catch (e) {
    recordAiCall({ operation, outcome: "exception", promptVersion, durationMs: Date.now() - start });
    reportError(e, { component: `ai.${operation}` });
    throw e;
  }
}
