import { env } from "./env";

/**
 * PII-redacting logger. Issue #17: "Redacción de PII en logs y observabilidad",
 * "Logs útiles sin contenido de pólizas ni fotos."
 *
 * Never pass raw request descriptions, contact details, file contents or
 * policy text to the logger. Structured fields are shallow-scanned and
 * suspicious values are masked as a defence in depth.
 */

const SENSITIVE_KEY =
  /(phone|tel|mobile|email|mail|name|nombre|address|direccion|password|token|secret|apikey|api_key|authorization|dni|nif|iban|policy|poliza|description|descripcion|content|body|photo|foto|image|imagen)/i;

const EMAIL_RE = /[\w.+-]+@[\w-]+\.[\w.-]+/g;
const PHONE_RE = /(?:\+?\d[\d\s().-]{7,}\d)/g;

function maskString(s: string): string {
  return s.replace(EMAIL_RE, "[email]").replace(PHONE_RE, "[phone]");
}

function redact(value: unknown, keyHint?: string): unknown {
  if (value == null) return value;
  if (typeof value === "string") {
    if (keyHint && SENSITIVE_KEY.test(keyHint)) return "[redacted]";
    return maskString(value);
  }
  if (typeof value === "number" || typeof value === "boolean") return value;
  if (Array.isArray(value)) return value.map((v) => redact(v));
  if (typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = SENSITIVE_KEY.test(k) ? "[redacted]" : redact(v, k);
    }
    return out;
  }
  return "[unloggable]";
}

type Level = "debug" | "info" | "warn" | "error";

function emit(level: Level, message: string, fields?: Record<string, unknown>) {
  if (level === "debug" && !env.DEBUG_LOGS) return;
  // Keep the test runner's output clean — errors still surface.
  if (env.NODE_ENV === "test" && level !== "error" && !env.DEBUG_LOGS) return;
  const line = {
    t: new Date().toISOString(),
    level,
    msg: maskString(message),
    ...(fields ? (redact(fields) as Record<string, unknown>) : {}),
  };
  const sink = level === "error" ? console.error : level === "warn" ? console.warn : console.log;
  sink(JSON.stringify(line));
}

export const log = {
  debug: (m: string, f?: Record<string, unknown>) => emit("debug", m, f),
  info: (m: string, f?: Record<string, unknown>) => emit("info", m, f),
  warn: (m: string, f?: Record<string, unknown>) => emit("warn", m, f),
  error: (m: string, f?: Record<string, unknown>) => emit("error", m, f),
};
