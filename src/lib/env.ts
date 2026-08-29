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
    const require = (cond: boolean, path: string, message: string) => {
      if (!cond) ctx.addIssue({ code: z.ZodIssueCode.custom, path: [path], message });
    };
    if (val.NODE_ENV === "production") {
      require(!!val.AUTH_SECRET, "AUTH_SECRET", "AUTH_SECRET is required in production");
      require(!!val.SIGNED_LINK_SECRET, "SIGNED_LINK_SECRET", "SIGNED_LINK_SECRET is required in production");
    }
    if (val.AI_ADAPTER === "claude") {
      require(!!val.ANTHROPIC_API_KEY, "ANTHROPIC_API_KEY", "required when AI_ADAPTER=claude");
    }
    if (val.STORAGE_ADAPTER === "s3") {
      require(!!val.S3_BUCKET, "S3_BUCKET", "required when STORAGE_ADAPTER=s3");
      require(!!val.S3_ACCESS_KEY_ID, "S3_ACCESS_KEY_ID", "required when STORAGE_ADAPTER=s3");
      require(!!val.S3_SECRET_ACCESS_KEY, "S3_SECRET_ACCESS_KEY", "required when STORAGE_ADAPTER=s3");
    }
    if (val.EMAIL_ADAPTER === "smtp") {
      require(!!val.SMTP_URL, "SMTP_URL", "required when EMAIL_ADAPTER=smtp");
    }
    if (val.WHATSAPP_ADAPTER === "link") {
      require(!!val.WHATSAPP_BUSINESS_NUMBER, "WHATSAPP_BUSINESS_NUMBER", "required when WHATSAPP_ADAPTER=link");
    }
  });

export type Env = z.infer<typeof schema>;

function load(): Env {
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    // Log the field names only — never the values — then fail fast.
    const fields = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`);
    console.error("[env] Invalid environment configuration:\n  " + fields.join("\n  "));
    throw new Error("Invalid environment configuration. See logs for the offending variables.");
  }
  return parsed.data;
}

// Skip validation entirely during `next build`'s static analysis pass where env is absent.
const isBuildPhase = process.env.NEXT_PHASE === "phase-production-build";

export const env: Env = isBuildPhase
  ? ({
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
    } as Env)
  : load();

export const isProd = env.NODE_ENV === "production";
export const isTest = env.NODE_ENV === "test";
export const isDev = env.NODE_ENV === "development";
