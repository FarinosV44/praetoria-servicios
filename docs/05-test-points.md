# 05 — Test points

> One row per test point. `Red first` records the failing-test observation for pure-logic slices (D-007).

| # | Sprint / slice | What was verified | Command(s) | Red first | Result | Date |
|---|---|---|---|---|---|---|
| TP-1 | Sprint 1 / S-003–S-006 pure logic | Request state machine (transitions, actor rules, reason-required, terminals), Money (integer cents, ES parsing, IVA bps, no float), Spanish phone normalisation, signed-link round-trip + tamper + expiry, coverage check | `npm test` | Partial — `money` format assertion written first and observed failing (`'1234,56 €'` vs `/1\.234,56/`); the assertion was over-strict about ICU grouping and was corrected (the requirement — decimal comma + € — was not relaxed). State-machine / phone / signed-link co-written with their tests for the scaffold; bug-fix reproduction-first rule still applies going forward. | ✅ 30/30 pass | 2026-08-29 |
| TP-2 | Sprint 1 / gate | Lint, typecheck, production build | `npm run lint && npm run typecheck && npx next build` | n/a | ✅ all pass; build emits `/`, `/api/health`, `/api/uploads/[...key]` | 2026-08-29 |
| TP-3 | Sprint 1 / DB migration | `prisma migrate deploy` against a live PostgreSQL; healthcheck reports `database: true`; `db:seed` runs | `docker compose up -d && npm run db:migrate && npm run db:seed` | n/a | ⚠ unverified — Docker Desktop not running in this session (`PLATFORM-IMPOSSIBLE` / `NO-EXECUTION` for the daemon). Initial migration SQL is generated and committed (`prisma/migrations/20260829000000_init`). Must be run once on a machine with Docker. | 2026-08-29 |

## Unverified — needs a real environment
- **TP-3**: apply the initial migration against a live PostgreSQL and confirm `GET /api/health` returns 200 with `checks.database: true`, and `npm run db:seed` completes. Steps: start Docker Desktop, `docker compose up -d`, `npm run db:migrate`, `npm run db:seed`, `npm run dev`, open `/api/health`.
