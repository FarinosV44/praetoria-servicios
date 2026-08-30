#!/usr/bin/env node
/**
 * Runs the Playwright E2E suite and writes docs/.keel/e2e-status.json ATOMICALLY
 * (issue #19 / Keel end-to-end verification contract). Never hand-edit that file.
 *
 * `result` enum: pass | fail | error | cancelled
 *   - error  = the suite could not RUN (missing browser, server down) — NOT a failure
 *
 * Pass extra args straight through, e.g.:
 *   node scripts/e2e-run.mjs --project=mobile-chrome
 */
import { spawnSync, execSync } from "node:child_process";
import { mkdirSync, writeFileSync, renameSync, appendFileSync } from "node:fs";
import { dirname, join } from "node:path";

const OUT_DIR = join("docs", ".keel");
const STATUS = join(OUT_DIR, "e2e-status.json");
const HISTORY = join(OUT_DIR, "e2e-history.jsonl");

function head() {
  try {
    return execSync("git rev-parse HEAD", { encoding: "utf8" }).trim();
  } catch {
    return "unknown";
  }
}

const args = process.argv.slice(2);
const run = spawnSync("npx", ["playwright", "test", ...args], {
  stdio: "inherit",
  shell: process.platform === "win32",
});

let result;
if (run.status === 0) result = "pass";
else if (run.status === null) result = "cancelled";
// Playwright exits 1 on test failure; anything else (127 missing bin, spawn error) is "error"
else if (run.status === 1) result = "fail";
else result = "error";

const record = {
  commit: head(),
  result,
  exitCode: run.status,
  timestamp: new Date().toISOString(),
};

mkdirSync(OUT_DIR, { recursive: true });
const tmp = join(dirname(STATUS), `.e2e-status.${process.pid}.tmp`);
writeFileSync(tmp, JSON.stringify(record, null, 2) + "\n");
renameSync(tmp, STATUS);
appendFileSync(HISTORY, JSON.stringify(record) + "\n");

console.log(`\n[e2e-run] result=${result} commit=${record.commit.slice(0, 8)} → ${STATUS}`);
process.exit(run.status ?? 1);
