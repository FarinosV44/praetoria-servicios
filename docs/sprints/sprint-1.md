---
schema: keel.sprint/1
sprint: 1
goal: Foundation — runnable, reproducible skeleton with isolated adapters (issue #2)
status: done
slices:
  - id: S-001
    title: Next.js 16 + TS strict + Tailwind v4 scaffold
    status: done
    hours: 0.5
    depends_on: []
    criteria: [AC-2-build]
  - id: S-002
    title: Keel scaffolding — state files, portability lock, automatic mode
    status: done
    hours: 0.5
    depends_on: [S-001]
    criteria: []
  - id: S-003
    title: env.ts (zod-validated), .env.example, lib helpers (id, money, result)
    status: done
    hours: 1
    depends_on: [S-002]
    criteria: [AC-2-secrets]
  - id: S-004
    title: Prisma + schema stub + db.ts + docker-compose Postgres
    status: done
    hours: 1
    depends_on: [S-003]
    criteria: [AC-2-migrations]
  - id: S-005
    title: Adapter interfaces + mock implementations + container.ts
    status: done
    hours: 1.5
    depends_on: [S-003]
    criteria: [AC-2-mockadapters]
  - id: S-006
    title: config/ (coverage, limits, trades, copy skeleton)
    status: done
    hours: 0.5
    depends_on: [S-002]
    criteria: []
  - id: S-007
    title: healthcheck route, temp landing, error-hides-secrets check
    status: done
    hours: 0.5
    depends_on: [S-004]
    criteria: [AC-2-health, AC-2-noleak]
  - id: S-008
    title: scripts (lint/typecheck/test/build), Vitest setup, CI workflow
    status: done
    hours: 1
    depends_on: [S-003]
    criteria: [AC-2-ci, AC-2-checks]
  - id: S-009
    title: README (install, migrate, run, deploy), docs/playground.md
    status: done
    hours: 0.5
    depends_on: [S-004, S-005, S-008]
    criteria: [AC-2-readme]
---

# Sprint 1 — Foundation (issue #2)

- Acceptance (issue #2 "Criterios de aceptación"):
  - A clean clone boots following only the README.
  - The database is created via migrations.
  - `lint`, `typecheck`, `test`, `build` all pass.
  - CI configured.
  - Temp landing page + healthcheck operational.
  - Server errors do not expose secrets or stack traces to the user.
- Notes: adapters ship with mock impls (D-008). No real provider keys required to run or test.
- Close-out (2026-08-29): Delivered — Next.js 16 scaffold; domain-oriented structure; `src/lib`
  (env/db/id/money/result/logging/phone/signed-link); Prisma schema covering the full issue-#9
  model + generated initial migration SQL; adapter interfaces + mock/dev impls for AI, storage,
  email, WhatsApp, OCR + composition root; `src/config` (trades, limits, coverage, copy); founding
  design system (tokens + Button/Field/Card/Alert/Spinner/EmptyState/Stepper); healthcheck +
  signed-download routes; temp landing; Vitest (30 tests green); GitHub Actions CI; README +
  playground doc. **Not verified this session:** applying the migration against a live PostgreSQL
  (Docker Desktop was not running) — TP-3, `docs/05-test-points.md`. Carried to next session /
  the user's machine.
- Moved to next sprint: nothing from Sprint 1 scope. Next: issue #9 refinement (persistence layer +
  transition-recording service on top of the schema) then issue #3 completion (Modal, Uploader,
  icon set, mascot) then issue #6 (photo capture/upload).
