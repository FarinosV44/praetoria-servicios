import { defineConfig, devices } from "@playwright/test";

/**
 * E2E config (issue #19). Two projects: a desktop Chromium and a realistic
 * mobile viewport (Pixel 5) — the critical path is asserted on both (AC-19-mobile).
 *
 * The suite expects a PRODUCTION build already running (or startable) at
 * `E2E_BASE_URL` (default http://localhost:3000). It also needs the app's env
 * (`DATABASE_URL`, `SIGNED_LINK_SECRET`, `AUTH_SECRET`) and a seeded database
 * (`npm run db:seed`) — synthetic fixtures only.
 *
 * First-time setup: `npx playwright install chromium` (downloads the browser).
 */

const baseURL = process.env.E2E_BASE_URL ?? "http://localhost:3000";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [["github"], ["list"]] : "list",
  timeout: 30_000,
  expect: { timeout: 7_500 },
  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "desktop-chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile-chrome", use: { ...devices["Pixel 5"] } },
  ],
  webServer: process.env.E2E_NO_SERVER
    ? undefined
    : {
        command: "npm run start",
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 60_000,
      },
});
