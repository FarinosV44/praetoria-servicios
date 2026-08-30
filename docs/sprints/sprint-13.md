---
schema: keel.sprint/1
sprint: 13
goal: Security / privacy / retention transversal review (issue #17)
status: done
slices:
  - id: S-063
    title: security headers (next.config.ts) + secure-cookie confirm
    status: done
    hours: 1
    depends_on: []
    criteria: [AC-17-headers]
  - id: S-064
    title: SSRF guard src/lib/safe-fetch.ts (test-first)
    status: done
    hours: 1
    depends_on: []
    criteria: [AC-17-ssrf]
  - id: S-065
    title: cross-resource authz tests + CSRF/origin tests + PII-redaction test
    status: done
    hours: 1.5
    depends_on: []
    criteria: [AC-17-authz, AC-17-logs]
  - id: S-066
    title: retention — insuranceService.purgeExpired + POST /api/cron/retention
    status: done
    hours: 1
    depends_on: []
    criteria: [AC-17-deletion]
  - id: S-067
    title: admin export + hard-delete of a request with an ops-log entry
    status: done
    hours: 1.5
    depends_on: []
    criteria: [AC-17-deletion]
  - id: S-068
    title: docs/threat-model.md — flip built controls to IN PLACE with evidence; expand Not-defended
    status: done
    hours: 1
    depends_on: [S-063, S-064, S-065, S-066, S-067]
    criteria: [AC-17-threatmodel]
  - id: S-069
    title: npm audit + docs/deploy-hostinger.md (cron, backups, headers)
    status: done
    hours: 0.5
    depends_on: []
    criteria: [AC-17-audit]
---

# Sprint 13 — Security / privacy / retention (issue #17)

## Acceptance criteria (issue #17)
- [x] AC-17-nopublic — no public buckets/files: `BlobStore` is private, download only through the
  signed `/api/uploads/[...key]` route; insurance docs `sensitive: true`. (Already true; confirmed.)
- [x] AC-17-authz — cross-resource authorization tests: `src/server/security.test.ts` (a signed link
  resolves only to its own request; a token-scoped upload only touches that request; an insurance
  doc lands on its own case; a revoked/raw-id token is refused).
- [x] AC-17-audit — dependencies audited: `npm audit` run, `npm audit fix` applied; the remaining
  high/critical are **dev-only** (vitest/vite/esbuild test runner, prisma CLI → @prisma/config →
  deepmerge-ts) — none in the production runtime tree. Recorded in `docs/threat-model.md`
  Not-defended with the reasoning + the vitest-4 upgrade follow-up. CI already runs `npm audit`.
- [x] AC-17-deletion — deletion procedure tested: `src/server/services/retention.test.ts`
  (`insuranceService.purgeExpired` purges closed-long-ago cases and keeps recent ones;
  `adminService.deleteRequest` hard-deletes the request + blobs and keeps a detached ops-log entry;
  export produces a bundle + a `request_exported` log).
- [x] AC-17-logs — logs useful without policy/photo content: `src/lib/logging.ts` redaction pinned
  by `src/server/security.test.ts` (phone/email/name/description/policy text never emitted, nested
  objects walked, safe fields survive).
- [x] AC-17-headers — security headers + secure cookies: `next.config.ts` `headers()` (CSP, HSTS 2y
  preload, nosniff, X-Frame-Options DENY, Referrer-Policy, Permissions-Policy, COOP,
  `poweredByHeader: false`); cookie already `httpOnly` + `secure`(prod) + `sameSite: lax`. Verified
  live with `curl -D -`.

## What was built
- **`next.config.ts`** — the full security-header set on `/:path*`.
- **`src/lib/safe-fetch.ts`** (+ 10 tests) — `assertSafeUrl` / `safeFetch`: blocks non-http(s),
  credentials-in-URL, private / loopback / link-local / CGNAT / test-net IPs (v4 + v6 incl.
  IPv4-mapped), `localhost` / `.internal` by name, and re-checks every redirect hop. **No call sites
  in v1** (all adapters mock/dev) — ready for the first real provider or policy-URL fetch. C10.
- **`src/server/security.test.ts`** (7) — cross-resource authz, CSRF/origin (`isSameOrigin`),
  PII redaction. `src/lib/logging.ts` gained `redactForTest` / `maskStringForTest`.
- **Retention** — `LIMITS.insuranceDocs.retentionDaysAfterClose = 90`;
  `insuranceService.purgeExpired(now)`; **`POST /api/cron/retention`** (Bearer `CRON_SECRET`,
  timing-safe compare, 401 without it) runs `deleteExpiredDrafts` + `expireStale` +
  `communicationService.sendPending` + `purgeExpired`. `src/server/services/retention.test.ts` (5).
- **Admin export / delete** — `adminService.exportRequest` (JSON bundle + `request_exported` log),
  `adminService.deleteRequest` (ops-log FIRST, then cascade delete + blob purge, `requestId`
  detached on the surviving log rows). `DangerZone.tsx` on the request detail: export → client-side
  JSON download; delete → confirm modal with a mandatory reason → redirect to `/admin`.
- **`docs/threat-model.md`** — every built control flipped to `IN PLACE` with its file + test as
  evidence; Not-defended expanded (admin MFA, single-instance rate-limit store, dev-only audit
  findings, no in-app backup automation, DPIA/legal texts as a release gate).
- **`docs/deploy-hostinger.md`** — env vars, first deploy + redeploy, the cron line, backups
  (Postgres + the blob dir), health endpoint, header-stripping caveat for a fronting proxy.

## Verification (TP-14)
- 183 tests green (22 new: safe-fetch 10, security 7, retention 5); lint / typecheck / `npx next
  build` clean. Live: `curl -D -` shows all headers on `/`; `POST /api/cron/retention` without
  Authorization → 401, `/` and `/api/health` still 200. `npm audit` recorded.

## Lessons
- Making `CRON_SECRET` a hard boot requirement in production 500'd the whole app when unset —
  reverted: the endpoint just refuses every call (401) without it. Fail-safe, not fail-closed on
  boot, for a non-core feature.

## Close-out
`develop` merged to `main` this session on the user's explicit instruction ("subelo a main ya …
subirlo todo a main") — 16 issues, `--no-ff`, pushed. See `docs/PROGRESS.md`.
