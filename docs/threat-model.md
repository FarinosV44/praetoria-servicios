# Threat model — Praetoria Servicios

> Maintained from Phase 2. Updated as controls are built (state per control) and as new surfaces appear.
> Profile: `references/security/web-app.md`.

## Assets

| Asset | Sensitivity | Where it lives |
|---|---|---|
| Home photos | High (images of people's homes, may reveal security details) | private blob store, signed URLs |
| Contact data (name, phone, email) | Medium-High (PII) | Postgres, separated from technical logs |
| Insurance policies (PDF/scans) | Very High (special-category-adjacent, financial, identity) | encrypted blob store, minimal access, signed URLs |
| Coverage analysis + legal drafts | High (legal exposure if wrong/leaked) | Postgres |
| Quotes / amounts | Medium (commercial) | Postgres |
| Admin credentials / session | Critical | Auth.js session, hashed password |
| Signed status-link tokens | High (grant per-request access) | HMAC-signed, not stored raw |

## Trust boundaries

Client browser ↔ Next.js server · Next.js server ↔ Postgres · Next.js server ↔ AI provider ·
Next.js server ↔ blob store · Next.js server ↔ email/WhatsApp/OCR providers · Admin browser ↔ admin routes.

## Controls (with delivery state)

| # | Control | State | Where |
|---|---|---|---|
| C1 | Secrets only in env, validated at boot | TO BUILD | `src/lib/env.ts` |
| C2 | Per-resource authorization (not just per-route) | TO BUILD | admin loaders, signed-link scope |
| C3 | Random non-sequential public identifiers | TO BUILD | `src/lib/id.ts` |
| C4 | Signed, expiring, revocable client links | TO BUILD | `src/lib/signed-link.ts` (#16) |
| C5 | Upload validation: magic-byte sniff, size, count, count/type limits | TO BUILD | upload endpoint (#6) |
| C6 | Private blob store, short-lived signed URLs, no public bucket | TO BUILD | `src/adapters/storage` (#6) |
| C7 | Rate limiting: analysis, uploads, submission, link issuance/lookup | TO BUILD | `src/lib/rate-limit.ts` (#17) |
| C8 | CSRF protection on all mutations | TO BUILD | server actions / route handlers |
| C9 | Input validation everywhere (Zod) | TO BUILD | `src/domain/**/schema.ts` |
| C10 | SSRF guard on server-side fetches | TO BUILD | fetch wrapper (#14, #15) |
| C11 | Security headers + secure cookies | TO BUILD | `next.config.ts` headers / `proxy.ts` |
| C12 | PII-redacting logger; no policy/photo content in logs | TO BUILD | `src/lib/logging.ts` (#17) |
| C13 | Configurable retention + verified deletion | TO BUILD | retention jobs (#17) |
| C14 | Admin export/delete with operations log | TO BUILD | admin (#17) |
| C15 | Granular, never-pre-checked consent, recorded | TO BUILD | `src/domain/consent` (#10, #14) |
| C16 | Analytics/logs carry no PII | TO BUILD | analytics wrapper (#18) |
| C17 | Dependency audit, no known criticals | TO BUILD | CI `npm audit` (#17, #19) |
| C18 | AI prompt refuses dangerous DIY instructions (gas/electric/structural) | TO BUILD | `src/domain/analysis` prompt (#7) |

## Not defended (deliberate omissions — v1)

| Omission | Why | Consequence |
|---|---|---|
| No client MFA | Clients have no accounts by design (EPIC) | Signed-link theft = access to one request; mitigated by expiry + revocation + extra verification on sensitive actions (#16) |
| No online payment security scope | No payments in v1 (EPIC) | n/a until payments exist |
| No WAF / DDoS appliance in-app | Deployment-platform concern (Vercel) | Volumetric attacks handled at the edge, not by the app |
| No end-to-end encryption of photos (encrypted at rest + in transit only) | Operational need for admin + AI to view them | A blob-store compromise with keys exposes images; mitigated by least-access + short-lived URLs |
| Full formal DPIA | Provisional legal texts marked for review, not blocking dev (#17) | Must be completed before real production launch — tracked as a release gate |
