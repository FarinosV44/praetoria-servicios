import { z } from "zod";

/**
 * The single validated entry point for process.env.
 * Import `env` from here — never read process.env directly elsewhere.
 * Issue #2: "Toda clave y proveedor se configura por variables de entorno",
 * "Errores del servidor no exponen secretos ni trazas al usuario."
 */

const bool = z
  .string()
  .transform((v) => v === "1" || v.toLowerCase() === "true")
  .pipe(z.boolean());

const schema = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),

    // Public base URL of the app (used for signed links, canonical URLs, email).
    APP_URL: z.string().url().default("http://localhost:3000"),

    // Database
    DATABASE_URL: z.string().url().or(z.string().startsWith("postgres")),

    // Secrets
    AUTH_SECRET: z.string().min(16).optional(),
    SIGNED_LINK_SECRET: z.string().min(16).optional(),
    // Shared secret for the retention cron endpoint (issue #17).
    CRON_SECRET: z.string().min(16).optional(),

    // Adapter selection (see docs/03-technical-plan.md)
    AI_ADAPTER: z.enum(["mock", "claude"]).default("mock"),
    STORAGE_ADAPTER: z.enum(["memory", "fs", "s3"]).default("fs"),
    EMAIL_ADAPTER: z.enum(["memory", "console", "smtp"]).default("console"),
    WHATSAPP_ADAPTER: z.enum(["link", "provider"]).default("link"),
    OCR_ADAPTER: z.enum(["mock", "tesseract", "cloud"]).default("mock"),

    // AI provider (Anthropic Claude) — required only when AI_ADAPTER=claude
    ANTHROPIC_API_KEY: z.string().optional(),
    ANTHROPIC_MODEL: z.string().default("claude-sonnet-5"),

    // Storage (S3-compatible) — required only when STORAGE_ADAPTER=s3
    S3_ENDPOINT: z.string().url().optional(),
    S3_REGION: z.string().optional(),
    S3_BUCKET: z.string().optional(),
    S3_ACCESS_KEY_ID: z.string().optional(),
    S3_SECRET_ACCESS_KEY: z.string().optional(),
    STORAGE_FS_DIR: z.string().default(".storage"),

    // Email (SMTP) — required only when EMAIL_ADAPTER=smtp
    SMTP_URL: z.string().optional(),
    EMAIL_FROM: z.string().default("Praetoria Servicios <no-reply@praetoria.local>"),

    // WhatsApp business number for the pre-filled link (E.164 without +).
    WHATSAPP_BUSINESS_NUMBER: z.string().optional(),

    // Operational
    ADMIN_ALERT_EMAIL: z.string().optional(),
    RESPONSE_DEADLINE_HOURS: z.coerce.number().int().positive().default(24),
    DEBUG_LOGS: bool.default(false),
  })
  .superRefine((val, ctx) => {
    // FATAL — the app genuinely cannot run without these. Everything else is a
    // feature-level gap: warn (see `warnGaps` below) and let the app boot, so a
    // missing WhatsApp number or SMTP URL never takes the whole site down.
    const require = (cond: boolean, path: string, message: string) => {
      if (!cond) ctx.addIssue({ code: z.ZodIssueCode.custom, path: [path], message });
    };
    if (val.NODE_ENV === "production") {
      require(!!val.AUTH_SECRET, "AUTH_SECRET", "AUTH_SECRET is required in production (32+ random chars)");
      require(
        !!val.SIGNED_LINK_SECRET,
        "SIGNED_LINK_SECRET",
        "SIGNED_LINK_SECRET is required in production (32+ random chars)",
      );
    }
  });

/** Non-fatal configuration gaps — logged once at boot, never block startup. */
function warnGaps(val: Env): void {
  const gap = (cond: boolean, msg: string) => {
    if (cond) console.warn(`[env] ${msg}`);
  };
  gap(
    val.WHATSAPP_ADAPTER === "link" && !val.WHATSAPP_BUSINESS_NUMBER,
    "WHATSAPP_BUSINESS_NUMBER not set — WhatsApp links are disabled (the app still runs).",
  );
  gap(
    val.AI_ADAPTER === "claude",
    "AI_ADAPTER=claude is not wired yet (src/server/container.ts) — the assistant will fail. Use AI_ADAPTER=mock.",
  );
  gap(
    val.EMAIL_ADAPTER === "smtp" && !val.SMTP_URL,
    "EMAIL_ADAPTER=smtp but SMTP_URL not set — email sending is disabled.",
  );
  gap(
    val.STORAGE_ADAPTER === "s3" && (!val.S3_BUCKET || !val.S3_ACCESS_KEY_ID || !val.S3_SECRET_ACCESS_KEY),
    "STORAGE_ADAPTER=s3 but the S3_* vars are incomplete — uploads will fail.",
  );
  gap(
    val.NODE_ENV === "production" && !val.CRON_SECRET,
    "CRON_SECRET not set — POST /api/cron/retention refuses every call (fail-safe).",
  );
}

export type Env = z.infer<typeof schema>;

function load(): Env {
  // Treat an empty-string env var as "not set" — otherwise `.optional()` URL
  // fields fail on the blank placeholders shipped in .env.example.
  const raw = Object.fromEntries(
    Object.entries(process.env).map(([k, v]) => [k, v === "" ? undefined : v]),
  );
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    // Log the field names only — never the values — then fail fast.
    const fields = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`);
    console.error(
      "[env] FATAL: invalid environment configuration — the app cannot start:\n  " +
        fields.join("\n  ") +
        "\n  (only DATABASE_URL, and AUTH_SECRET + SIGNED_LINK_SECRET in production, are hard requirements.)",
    );
    throw new Error("Invalid environment configuration. See logs for the offending variables.");
  }
  warnGaps(parsed.data);
  return parsed.data;
}

/**
 * Non-throwing env check for the health endpoint — reports WHICH variables are
 * wrong (names + zod messages, never values) so a broken deploy is diagnosable
 * with one `curl /api/health` instead of digging through host logs.
 */
export function envDiagnostics():
  | { ok: true }
  | { ok: false; fields: string[] } {
  const raw = Object.fromEntries(
    Object.entries(process.env).map(([k, v]) => [k, v === "" ? undefined : v]),
  );
  const parsed = schema.safeParse(raw);
  if (parsed.success) return { ok: true };
  return { ok: false, fields: parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`) };
}

// Skip validation entirely during `next build`'s static analysis pass where env is absent.
const isBuildPhase = process.env.NEXT_PHASE === "phase-production-build";

const BUILD_STUB: Env = {
  NODE_ENV: "production",
  APP_URL: "http://localhost:3000",
  DATABASE_URL: "postgres://build",
  AI_ADAPTER: "mock",
  STORAGE_ADAPTER: "fs",
  EMAIL_ADAPTER: "console",
  WHATSAPP_ADAPTER: "link",
  OCR_ADAPTER: "mock",
  ANTHROPIC_MODEL: "claude-sonnet-5",
  STORAGE_FS_DIR: ".storage",
  EMAIL_FROM: "build@local",
  RESPONSE_DEADLINE_HOURS: 24,
  DEBUG_LOGS: false,
} as Env;

let _cache: Env | undefined;
function resolved(): Env {
  if (!_cache) _cache = isBuildPhase ? BUILD_STUB : load();
  return _cache;
}

/**
 * Lazy so that merely importing `env` (e.g. from the health endpoint) never
 * triggers `load()` / its throw — only actual property access does. Keeps
 * `import { env } from "@/lib/env"; env.APP_URL` working everywhere unchanged.
 */
export const env: Env = new Proxy({} as Env, {
  get: (_t, prop) => resolved()[prop as keyof Env],
  has: (_t, prop) => prop in resolved(),
  ownKeys: () => Reflect.ownKeys(resolved()),
  getOwnPropertyDescriptor: (_t, prop) =>
    Object.getOwnPropertyDescriptor(resolved(), prop) ?? {
      configurable: true,
      enumerable: true,
      value: resolved()[prop as keyof Env],
    },
});

export const isProd = () => env.NODE_ENV === "production";
export const isTest = () => env.NODE_ENV === "test";
export const isDev = () => env.NODE_ENV === "development";
