---
schema: keel.sprint/1
sprint: 15
goal: E2E + observability + accessibility audit + deploy/runbook docs (issue #19) — closes the MVP core
status: done
slices:
  - id: S-079
    title: "src/lib/observability.ts — reportError + recordAiCall/timeAiCall (PII-free, test-first)"
    status: done
    hours: 1.5
    depends_on: []
    criteria: [AC-19-alerts]
  - id: S-080
    title: wire timeAiCall into analysis/coverage services; reportError into the cron route; global-error boundary
    status: done
    hours: 1
    depends_on: [S-079]
    criteria: [AC-19-alerts]
  - id: S-081
    title: "Playwright scaffold — playwright.config.ts, scripts/e2e-run.mjs (atomic e2e-status.json), npm scripts, .gitignore"
    status: done
    hours: 1.5
    depends_on: []
    criteria: [AC-19-ci]
  - id: S-082
    title: "E2E specs — smoke/SEO, assistant flow 1 + flow 2, admin+authz+expired links, axe a11y audit (both viewports)"
    status: done
    hours: 3
    depends_on: [S-081]
    criteria: [AC-19-mobile, AC-19-noconsole, AC-19-a11y]
  - id: S-083
    title: "a11y fixes — darken --c-text-faint & --c-brand to WCAG AA; tabindex on the scrollable table (L-005)"
    status: done
    hours: 1
    depends_on: [S-082]
    criteria: [AC-19-a11y]
  - id: S-084
    title: "CI — add the e2e job (postgres service, seed, build, playwright install, test:e2e, report artifact)"
    status: done
    hours: 0.5
    depends_on: [S-082]
    criteria: [AC-19-ci]
  - id: S-085
    title: "docs — finalise deploy-hostinger.md; new runbook.md; new known-limitations.md"
    status: done
    hours: 2
    depends_on: []
    criteria: [AC-19-deploydoc, AC-19-limitations]
  - id: S-086
    title: verify — lint/typecheck/build, 207 vitest, 30 e2e both projects
    status: done
    hours: 0.5
    depends_on: [S-079, S-080, S-081, S-082, S-083, S-084, S-085]
    criteria: [AC-19-ci, AC-19-mobile, AC-19-noconsole, AC-19-a11y]
---

# Sprint 15 — E2E + observability + deploy docs (issue #19)

This is the last core issue. Its completion satisfies the EPIC #1 — but **Keel never closes #1, the
user does**, once every issue is verified and closed on the forge.

## Acceptance criteria (issue #19)
- [x] AC-19-ci — CI green: existing `verify` job (lint/typecheck/test/build/audit) + new `e2e` job
  (postgres, seed, build, `playwright install`, `npm run test:e2e`, report artifact). Locally: 207
  vitest + 30 e2e all pass.
- [x] AC-19-mobile — critical path on a realistic mobile viewport: `tests/e2e/assistant.spec.ts`
  flow 1 runs on the `mobile-chrome` project (Pixel 5 device descriptor) as well as desktop.
- [x] AC-19-noconsole — `collectConsoleErrors` asserts zero meaningful console errors on the landing,
  a service page, and the full assistant flow. (This is also the regression guard for #29.)
- [x] AC-19-a11y — automated axe audit (`tests/e2e/a11y.spec.ts`, WCAG 2.0/2.1/2.2 A+AA) on 5 pages
  × 2 viewports, fails on serious/critical. Fixed the founding contrast bugs it caught (L-005).
  The guided assistive-tech pass stays a user loop (`references/accessibility.md`).
- [x] AC-19-alerts — `/api/health` verified (200/503, DB check, no config leak). Observability:
  `src/lib/observability.ts` — `reportError` (PII-redacted via the logger), `timeAiCall` wrapping
  both AI calls (`ai.call` metric: operation/outcome/durationMs/promptVersion, +tokens/cost when a
  real provider returns them). Cron route wrapped in try/catch → structured error + 500. Alert
  *wiring* is an operator step, documented in the runbook + deploy doc.
- [x] AC-19-deploydoc — `docs/deploy-hostinger.md` finalised (env table with the build-time
  `APP_URL` warning, preview/prod envs, safe additive migrations, CSP-in-proxy caveat for a fronting
  CDN, health & alerts). `docs/runbook.md` new (incident playbooks + rollback).
- [x] AC-19-limitations — `docs/known-limitations.md` (mock providers, functional boundaries,
  force-dynamic rendering, testing coverage, the manual device checklist, the #20–#27 backlog).

## What was built
- **`src/lib/observability.ts`** (+7 tests, test-first) — `reportError`, `buildAiMetric` (clamped,
  numbers/enums only), `recordAiCall`, `timeAiCall`. Wired into `analysisService.analyze`,
  `coverageService`, `POST /api/cron/retention`. **`src/app/global-error.tsx`** — root error boundary.
- **`playwright.config.ts`** — `desktop-chromium` + `mobile-chrome` projects, `webServer` runs
  `npm run start`, `E2E_NO_SERVER` opt-out. **`scripts/e2e-run.mjs`** — runs the suite, writes
  `docs/.keel/e2e-status.json` atomically (closed `result` enum) + appends `e2e-history.jsonl`.
  npm scripts `test:e2e` / `test:e2e:ui` / `e2e:install`.
- **`tests/e2e/`** — `_helpers.ts` (console-error collector, `runAssistantHappyPath`), `smoke.spec.ts`,
  `assistant.spec.ts` (flows 1 + 2), `authz.spec.ts` (admin redirect, wrong password, tampered token,
  seeded-admin sign-in), `a11y.spec.ts` (axe × 5 pages).
- **a11y fix (L-005)** — `--c-text-faint` `#8a8172`→`#6b6353`, `--c-brand` `#c05f3c`→`#b0522f`
  (+ dark `--c-text-faint`), manifest/icon/global-error hexes to match, `tabIndex`/`role="group"` on
  the landing contrast table. Landing: 23 axe violations → 0.
- **CI** — new `e2e` job. **`.github/workflows/ci.yml`**.
- **docs** — `deploy-hostinger.md` (rewritten), `runbook.md` (new), `known-limitations.md` (new).

## Verification (TP-16)
- 207 vitest (was 200; +7 observability) — lint / typecheck / `npx next build` clean.
- **30 E2E pass** on desktop-chromium **and** mobile-chrome (Pixel 5), against a real
  `npm run start` production build with a seeded database. `docs/.keel/e2e-status.json` → `result: pass`.
- axe: 0 serious/critical on `/`, `/solicitar`, `/servicios`, `/servicios/fontaneria`, `/cobertura`,
  both viewports.
- `/api/health` → 200 with the DB check.

## Lessons
- **L-005** — founding colour tokens were below WCAG AA and had never been measured. Fixed; the axe
  e2e pass is now the backstop.

## Close-out
`develop` → `main` merge (user-authorised per sprint, `--no-ff`, push). Beat-1 comment on #19.
MVP core (#2–#19, #28, #29) is complete and verified. Remaining before go-live: the definitive legal
texts + DPIA (release gate), and the actual Hostinger deploy (needs operator hPanel access). Then the
growth backlog #20–#27.
