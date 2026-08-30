# Threat model — Praetoria Servicios

> Maintained from Phase 2. Updated as controls are built (state per control) and as new surfaces appear.
> Profile: `references/security/web-app.md`. Last reviewed: 2026-08-30 (issue #17 sprint).

## Assets

| Asset | Sensitivity | Where it lives |
|---|---|---|
| Home photos | High (images of people's homes, may reveal security details) | private blob store, signed URLs |
| Contact data (name, phone, email) | Medium-High (PII) | Postgres, separated from technical logs |
| Insurance policies (PDF/scans) | Very High (special-category-adjacent, financial, identity) | encrypted-at-rest blob store, minimal access, signed URLs |
| Coverage analysis + legal drafts | High (legal exposure if wrong/leaked) | Postgres |
| Quotes / amounts | Medium (commercial) | Postgres |
| Admin credentials / session | Critical | HMAC signed-cookie session (D-012), scrypt password hash |
| Signed status-link tokens | High (grant per-request access) | HMAC-signed, only the SHA-256 hash stored |

## Trust boundaries

Client browser ↔ Next.js server · Next.js server ↔ Postgres · Next.js server ↔ AI provider ·
Next.js server ↔ blob store · Next.js server ↔ email/WhatsApp/OCR providers · Admin browser ↔ admin routes ·
Cron runner ↔ `/api/cron/retention`.

## Controls (with delivery state)

| # | Control | State | Where / evidence |
|---|---|---|---|
| C1 | Secrets only in env, validated at boot, never logged | IN PLACE | `src/lib/env.ts` (Zod, blank→undefined, field-names-only error); prod requires `AUTH_SECRET` + `SIGNED_LINK_SECRET` |
| C2 | Per-resource authorization (not just per-route) | IN PLACE | `src/proxy.ts` (cheap gate) + `(panel)/layout.tsx` + `requireSession()` in every admin action; signed link resolves 1:1 to its request. Tests: `src/server/security.test.ts` (cross-resource), `src/server/services/clientLink.test.ts` |
| C3 | Random non-sequential public identifiers | IN PLACE | `src/lib/id.ts` (nanoid, unambiguous alphabet); `Request.reference`, admin URLs by reference, tokens |
| C4 | Signed, expiring, revocable client links; hash-only storage | IN PLACE | `src/lib/signed-link.ts` + `src/server/services/clientLink.ts`; tests in `clientLink.test.ts` |
| C5 | Upload validation: magic-byte sniff, size, count, type | IN PLACE | `src/domain/photos/validation.ts`, `src/domain/insurance/validation.ts` (PDF `%PDF` + image magic bytes); `POST /api/uploads`, `POST /api/insurance/documents` |
| C6 | Private blob store, short-lived signed URLs, no public bucket | IN PLACE | `src/adapters/storage/{fs,memory,index}.ts` — files under `STORAGE_FS_DIR` outside `public/`, download via signed `/api/uploads/[...key]`; `sensitive: true` for insurance docs |
| C7 | Rate limiting: analysis, uploads, submission, link issuance/lookup, login | IN PLACE | `src/lib/rate-limit.ts` (`RATE_LIMITS`), applied in the assistant actions, `/api/uploads`, `/api/insurance/documents`, `clientLink` actions, `signIn` |
| C8 | CSRF protection on all mutations | IN PLACE | Server actions: Next built-in. Route handlers: `isSameOrigin` (Origin/Referer vs `APP_URL`) on `/api/uploads`, `/api/insurance/documents`. Test: `src/server/security.test.ts` |
| C9 | Input validation everywhere (Zod) | IN PLACE | `src/domain/**/schema.ts`, every server action parses before use |
| C10 | SSRF guard on server-side fetches | IN PLACE (guard built; no call sites yet) | `src/lib/safe-fetch.ts` (`assertSafeUrl` / `safeFetch` — blocks private/loopback/link-local/CGNAT/test-nets, non-http(s), credentials-in-URL, `localhost`/`.internal`, re-checks each redirect). Test: `src/lib/safe-fetch.test.ts` (10). v1 has zero server-side external fetch (all adapters mock/dev) — wire `safeFetch` into the first real provider or policy-URL fetch. |
| C11 | Security headers + secure cookies | IN PLACE | `next.config.ts` `headers()`: CSP (`default-src 'self'`, `frame-ancestors 'none'`, `object-src 'none'`), HSTS (2y, preload), `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy`, COOP; `poweredByHeader: false`. Cookie: `httpOnly` + `secure` (prod) + `sameSite: lax` in `src/server/auth.ts`. Verified with `curl -D -`. |
| C12 | PII-redacting logger; no policy/photo content in logs | IN PLACE | `src/lib/logging.ts` — sensitive keys `[redacted]`, emails/phones in free text masked, debug/info suppressed in test. Test: `src/server/security.test.ts` (redaction) |
| C13 | Configurable retention + verified deletion | IN PLACE | `requestService.deleteExpiredDrafts`, `quoteService.expireStale`, `photoService.deleteAllForRequest`, `insuranceService.deleteDocument` (verifies the blob is gone → `delete_unverified`) + `insuranceService.purgeExpired`. Runner: `POST /api/cron/retention`. Tests: `src/server/services/retention.test.ts` |
| C14 | Admin export/delete with operations log | IN PLACE | `adminService.exportRequest` (JSON bundle + `request_exported` log) + `adminService.deleteRequest` (cascade + blob purge + `request_deleted` log written FIRST, `requestId` detached after). UI: `DangerZone.tsx`. Tests: `retention.test.ts` |
| C15 | Granular, never-pre-checked consent, recorded | IN PLACE | `src/domain/requests/schema.ts` (`consentInputSchema` — `requestHandling` literal-true, others default false), `Consent` rows per type incl. `INSURANCE_DOC_ANALYSIS` |
| C16 | Analytics/logs carry no PII | PARTIAL | logger done (C12); the analytics helper is issue #18 |
| C17 | Dependency audit, no known criticals in the runtime | IN PLACE (see Not-defended) | CI runs `npm audit`; `npm audit fix` applied. Remaining high/critical are dev-only (see below) |
| C18 | AI prompt refuses dangerous DIY instructions (gas/electric/structural) | IN PLACE | `src/domain/assistant/triage.ts` (safety triage before analysis, D2) + `immediateSafeMeasures` in the analysis schema; the mock adapter models it, the real prompt inherits it |

## Not defended (deliberate omissions — v1)

| Omission | Why | Consequence |
|---|---|---|
| No client MFA | Clients have no accounts by design (EPIC) | Signed-link theft = access to one request; mitigated by expiry + revocation + last-4-phone check on accept/reject/regenerate (#16) |
| No admin MFA | Single small internal team, minimal session (D-012); library-based MFA rejected for the payoff | Admin credential theft = full panel access; mitigated by scrypt hashing, rate-limited login, 8h session, per-action re-check. Revisit if the team grows or SSO is wanted. |
| No online payment security scope | No payments in v1 (EPIC) | n/a until payments exist |
| No WAF / DDoS appliance in-app | Deployment-platform concern (Hostinger / a CDN in front) | Volumetric attacks handled at the edge, not by the app |
| Single-instance in-memory rate-limit store | v1 is one Node process on hPanel | Rate limits reset on restart and are per-instance; move to Redis behind the same interface if the app scales out (`src/lib/rate-limit.ts` comment notes this) |
| No end-to-end encryption of photos/docs (encrypted at rest + in transit only) | Operational need for admin + AI to view them | A blob-store compromise with keys exposes files; mitigated by least-access + short-lived URLs + retention purge |
| `npm audit`: dev-only high/critical remain | `vitest`/`vite`/`esbuild` (test runner), `@vitest/coverage-v8`, `prisma` CLI → `@prisma/config` → `deepmerge-ts` (migration tooling). None are in the production runtime dependency tree (`@prisma/client` is; the `prisma` CLI is not deployed). The `deepmerge-ts` stack-exhaustion needs an attacker-supplied recursive object into a merge — not reachable from `prisma migrate deploy` on our own schema. | Tracked follow-up: vitest 4 major upgrade (test-config work); watch for a `@prisma/config` patch. The production server ships none of these. |
| Full formal DPIA + definitive legal texts | Provisional texts marked "pendiente de revisión jurídica" on `/legal/*` with a visible banner + `noindex` (#4); not blocking dev (#17) | Must be completed before real production launch — release gate (#19 / Phase 7) |
| No backup/restore automation in-app | Postgres backups are a hosting concern (hPanel / managed Postgres) | Documented in `docs/deploy-hostinger.md`; the operator configures DB snapshots |
