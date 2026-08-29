import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

const r = (p: string) => fileURLToPath(new URL(p, import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@": r("./src"),
      "server-only": r("./src/test/server-only-stub.ts"),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    // Integration tests share the single `praetoria_test` database and TRUNCATE
    // between tests — they must not run in parallel with each other.
    fileParallelism: false,
    env: {
      NODE_ENV: "test",
      // CI sets DATABASE_URL (to its own already-migrated DB); locally we use a
      // dedicated praetoria_test database.
      DATABASE_URL:
        process.env.DATABASE_URL ??
        "postgresql://praetoria:praetoria@localhost:5432/praetoria_test?schema=public",
      APP_URL: "http://localhost:3000",
      AUTH_SECRET: "test-auth-secret-0123456789",
      SIGNED_LINK_SECRET: "test-signed-link-secret-0123456789",
      WHATSAPP_BUSINESS_NUMBER: "34600000000",
      AI_ADAPTER: "mock",
      STORAGE_ADAPTER: "memory",
      EMAIL_ADAPTER: "memory",
      WHATSAPP_ADAPTER: "link",
      OCR_ADAPTER: "mock",
    },
  },
});
