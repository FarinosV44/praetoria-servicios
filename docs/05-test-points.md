# 05 — Test points

> One row per test point. `Red first` records the failing-test observation for pure-logic slices (D-007).

| # | Sprint / slice | What was verified | Command(s) | Red first | Result | Date |
|---|---|---|---|---|---|---|
| TP-1 | Sprint 1 / S-003–S-006 pure logic | Request state machine (transitions, actor rules, reason-required, terminals), Money (integer cents, ES parsing, IVA bps, no float), Spanish phone normalisation, signed-link round-trip + tamper + expiry, coverage check | `npm test` | Partial — `money` format assertion written first and observed failing (`'1234,56 €'` vs `/1\.234,56/`); the assertion was over-strict about ICU grouping and was corrected (the requirement — decimal comma + € — was not relaxed). State-machine / phone / signed-link co-written with their tests for the scaffold; bug-fix reproduction-first rule still applies going forward. | ✅ 30/30 pass | 2026-08-29 |
| TP-2 | Sprint 1 / gate | Lint, typecheck, production build | `npm run lint && npm run typecheck && npx next build` | n/a | ✅ all pass; build emits `/`, `/api/health`, `/api/uploads/[...key]` | 2026-08-29 |
| TP-3 | Sprint 1 / DB + runtime | `prisma migrate dev` against live PostgreSQL (docker); `db:seed`; dev server; landing 200; `GET /api/health` → 200 `{status:ok, checks:{database:true}}` | `docker compose up -d && npx prisma migrate dev && npx tsx prisma/seed.ts && npm run dev && curl /api/health` | n/a | ✅ PASS (session 2). Migration `20260829203449_init` applied; seed created 1 admin + 4 requests; `/` returns 200 with the Praetoria landing; `/api/health` returns `database: true`. Fixed L-001 (corrupt migration SQL) and L-002 (blank env var) on the way. | 2026-08-29 |

## Unverified — needs a real environment
- (none currently — TP-3 passed)
