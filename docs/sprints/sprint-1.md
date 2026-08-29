---
schema: keel.sprint/1
sprint: 1
goal: Foundation — runnable, reproducible skeleton with isolated adapters (issue #2)
status: in-progress
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
    status: not-started
    hours: 1
    depends_on: [S-002]
    criteria: [AC-2-secrets]
  - id: S-004
    title: Prisma + schema stub + db.ts + docker-compose Postgres
    status: not-started
    hours: 1
    depends_on: [S-003]
    criteria: [AC-2-migrations]
  - id: S-005
    title: Adapter interfaces + mock implementations + container.ts
    status: not-started
    hours: 1.5
    depends_on: [S-003]
    criteria: [AC-2-mockadapters]
  - id: S-006
    title: config/ (coverage, limits, trades, copy skeleton)
    status: not-started
    hours: 0.5
    depends_on: [S-002]
    criteria: []
  - id: S-007
    title: healthcheck route, temp landing, error-hides-secrets check
    status: not-started
    hours: 0.5
    depends_on: [S-004]
    criteria: [AC-2-health, AC-2-noleak]
  - id: S-008
    title: scripts (lint/typecheck/test/build), Vitest setup, CI workflow
    status: not-started
    hours: 1
    depends_on: [S-003]
    criteria: [AC-2-ci, AC-2-checks]
  - id: S-009
    title: README (install, migrate, run, deploy), docs/playground.md
    status: not-started
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
- Close-out: (pending)
