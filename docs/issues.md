# Issues — Praetoria Servicios

> Living log of forge issues (GitHub: FarinosV44/praetoria-servicios). Inventory first, one entry per issue worked.
> Updated the moment an issue is triaged, worked, or closed.
> Last inbound sweep: 2026-08-30 (Sprint 15) — no new external issues or comments; open-issue activity is our own beat-1 comments awaiting user close. MVP core (#2–#19, #28, #29) resolved; growth #20–#27 next.

## Build order (dependency-sorted)

MVP core (this engagement): #2 ✅ → #9 ✅ → **#28 (benchmark — user instruction, do now)** → #3 → #6 → #10 → #5 → #7 → #8 → #11 → #12 → #13 → #16 → #14 → #15 → #4 → #17 → #18 → #19 → (#1 EPIC closes when all land).
Growth (after core): #22 → #21 → #23 → #24 → #25 → #26 → #20 → #27.

Note: #28 must run before #3/#4/#5/#21/#22/#25/#26 are considered closed (issue #28 "Orden").

Rationale: data model (#9) and design tokens (#3) underpin everything. Photos (#6) and contact/consent (#10) feed the assistant (#5). AI analysis (#7) then user validation (#8). Admin (#11) then quotes (#12) then comms (#13) then client status link (#16). Insurance (#14→#15) is an optional branch. Landing (#4) can be built once components + flow entry points exist. Security review (#17), SEO/analytics (#18) and E2E/deploy (#19) are cross-cutting closers.

## Inventory
| # | Title | Type | Priority | Status | Entry |
|---|-------|------|----------|--------|-------|
| 1 | [EPIC] MVP funcional de Praetoria Servicios | epic | — | open | — |
| 2 | Inicializar arquitectura, stack y entorno reproducible | task | high | resolved — awaiting user close | E-001 |
| 3 | Identidad visual y sistema de diseño premium mobile-first | task | high | resolved (Sprint 3); a11y automated pass at #19 — awaiting user close | E-004 |
| 28 | Benchmark de competencia, reseñas y foros antes de cerrar el producto | research | high | resolved — awaiting user close | E-003 |
| 4 | Landing comercial orientada a conversión | feature | med | resolved (Sprint 12) — awaiting user close | E-013 |
| 5 | Asistente visual para iniciar una solicitud doméstica | feature | high | resolved (Sprint 5) — awaiting user close | E-006 |
| 6 | Captura, subida y gestión segura de fotografías | feature | high | resolved (Sprint 4) — awaiting user close | E-005 |
| 7 | Análisis multimodal del problema mediante IA | feature | high | resolved (Sprint 5) — awaiting user close | E-006 |
| 8 | Validación, corrección y nuevo análisis por el usuario | feature | high | resolved (Sprint 5) — awaiting user close | E-006 |
| 9 | Modelar solicitudes, estados y trazabilidad de negocio | task | high | resolved (Sprint 2) — awaiting user close; ER diagram deferred to Phase 6 | E-002 |
| 10 | Captar contacto, consentimiento y preferencia de comunicación | feature | high | resolved (Sprint 5) — awaiting user close | E-006 |
| 11 | Autenticación y panel administrativo de solicitudes | feature | high | resolved (Sprint 6) — awaiting user close | E-007 |
| 12 | Gestionar presupuestos y plazos desde administración | feature | high | resolved (Sprint 7) — awaiting user close | E-008 |
| 13 | Comunicaciones por email y WhatsApp sin bloquear el MVP | feature | med | resolved (Sprint 8) — awaiting user close | E-009 |
| 14 | Subir y procesar una póliza de seguro de hogar | feature | med | resolved (Sprint 10) — awaiting user close | E-011 |
| 15 | Analizar cobertura y generar borrador jurídico revisable | feature | med | resolved (Sprint 11) — awaiting user close | E-012 |
| 16 | Consulta segura del estado y respuesta del cliente | feature | high | resolved (Sprint 9) — awaiting user close | E-010 |
| 17 | Seguridad, privacidad, retención y protección contra abuso | task | high | resolved (Sprint 13) — awaiting user close | E-014 |
| 18 | SEO local, analítica de conversión y páginas de servicio | feature | med | resolved (Sprint 14) — awaiting user close | E-015 |
| 19 | Pruebas E2E, observabilidad, accesibilidad y despliegue | task | high | resolved (Sprint 15) — awaiting user close | E-017 |
| 29 | El CSP estricto (#17) rompe la hidratación de React en toda la app | bug | high | resolved (Sprint 14) — awaiting user close | E-016 |
| 20 | Página de captación de profesionales | feature | low | open | — |
| 21 | Carta de Confianza Praetoria y transparencia | feature | med | open | — |
| 22 | Verificar y gestionar la red de profesionales | feature | med | open | — |
| 23 | Cierre de servicio, garantía e incidencias post-trabajo | feature | med | open | — |
| 24 | CMS editorial completo para publicaciones y guías | feature | med | open | — |
| 25 | Arquitectura SEO de servicios, problemas y municipios | feature | med | open | — |
| 26 | Reseñas verificadas y reputación local | feature | med | open | — |
| 27 | Centro de control SEO local y oportunidades de contenido | feature | low | open | — |

## Entries (one per issue worked)

### E-017 — #19 Pruebas E2E, observabilidad, accesibilidad y despliegue
- Link: https://github.com/FarinosV44/praetoria-servicios/issues/19   Status: resolved 2026-08-30 (Sprint 15) — awaiting user close. Closing this is the EPIC #1 dependency (Keel never closes #1).
- Diagnosis: n/a (task). AC from the issue.
- Resolution: `src/lib/observability.ts` (`reportError`, `timeAiCall`/`recordAiCall` — PII-free, test-first) wired into the AI services + the cron route; `src/app/global-error.tsx`. Playwright E2E: `playwright.config.ts` (desktop-chromium + Pixel 5 mobile), `scripts/e2e-run.mjs` (atomic `docs/.keel/e2e-status.json`), `tests/e2e/{smoke,assistant,authz,a11y}.spec.ts` — 30 tests. Founding-token contrast fix (L-005): `--c-text-faint`, `--c-brand`. CI `e2e` job. Docs: `deploy-hostinger.md` finalised, new `runbook.md`, new `known-limitations.md`.
- Commits: (Sprint 15 commit).
- Verification: TP-16 — 207 vitest, 30 E2E green on both viewports, axe 0 serious/critical × 5 pages × 2 viewports, `/api/health` 200, `e2e-status.json` result:pass.
- Pending: the guided assistive-tech pass + the manual device checklist (run against the preview env before go-live); flows 3/5/6 as E2E once a real AI provider is wired (integration-covered now). The actual Hostinger deploy needs operator hPanel access.

### E-016 — #29 El CSP estricto (#17) rompe la hidratación de React
- Link: https://github.com/FarinosV44/praetoria-servicios/issues/29   Status: resolved 2026-08-30 (Sprint 14) — awaiting user close
- Diagnosis: `next.config.ts` CSP `script-src 'self'` (no nonce, no `'unsafe-inline'`) blocks Next 16's
  inline hydration scripts → React #412 on every page, `/solicitar` stuck on the spinner, all client
  interactivity dead. The `next.config.ts` comment assumed Next auto-applies nonces; nothing generated one.
- Resolution: per-request nonce in `src/proxy.ts` (`script-src 'self' 'nonce-…' 'strict-dynamic'`,
  `x-nonce`); CSP removed from `next.config.ts`; `export const dynamic = "force-dynamic"` in
  `src/app/layout.tsx` (a static page bakes nonce-less inline scripts at build time). D-014, L-004.
- Commits: (Sprint 14 commit) `src/proxy.ts`, `src/proxy.test.ts`, `next.config.ts`, `src/app/layout.tsx`,
  `docs/threat-model.md` C11.
- Verification: `src/proxy.test.ts` (6, failing reproduction written first). Browser drive: assistant
  hydrates and advances to triage, `/cobertura` checker works, console clean. `curl -D -` shows the
  nonce'd CSP + `x-nonce`.
- Pending: none. Found by the assistant during Sprint 14 (issue capture ON).

### E-015 — #18 SEO local, analítica de conversión y páginas de servicio
- Link: https://github.com/FarinosV44/praetoria-servicios/issues/18   Status: resolved 2026-08-30 (Sprint 14) — awaiting user close
- Diagnosis: n/a (feature). AC from the issue's "Criterios de aceptación".
- Resolution: `src/lib/analytics.ts` (PII-strip allowlist, consent gate, 16-event list, provider seam);
  ANALYTICS consent wired end-to-end (schema → `ContactStep` checkbox, never pre-checked → 4th `Consent`
  row → `track` on submit + funnel events); `robots.ts` / `sitemap.ts` / `manifest.ts` / `icon.tsx`;
  `src/lib/seo.ts` + `JsonLd` (Organization / WebSite / FAQPage / Service / BreadcrumbList);
  `/servicios` + `/servicios/[slug]` from `src/config/service-content.ts` (real per-trade prose, D10);
  `/cobertura` + `CoverageChecker` (no PII); footer/nav links. D-013 (coverage = toda el área de Valencia).
- Commits: (Sprint 14 commit).
- Verification: TP-15 — 200 tests, lint/typecheck/build clean, curl of all SEO endpoints, JSON-LD
  validated by hand, browser drive of a service page + `/cobertura` checker.
- Pending: real analytics provider wiring (env `NEXT_PUBLIC_ANALYTICS_URL`) is a deploy concern;
  `landing_cta_click` from the (server) landing needs a client wrapper — deferred, low value pre-consent.

### E-014 — #17 Seguridad, privacidad, retención y protección contra abuso
- Link: https://github.com/FarinosV44/praetoria-servicios/issues/17   Status: resolved 2026-08-30 (Sprint 13) — awaiting user close
- Diagnosis: n/a (transversal hardening)
- Resolution: `next.config.ts` security headers (CSP/HSTS/nosniff/X-Frame-DENY/Referrer/Permissions/
  COOP, `poweredByHeader:false`); `src/lib/safe-fetch.ts` SSRF guard (no call sites in v1, ready for
  the first real provider); `src/server/security.test.ts` (cross-resource authz, CSRF/origin,
  PII-redaction — `src/lib/logging.ts` gained test hooks); retention:
  `LIMITS.insuranceDocs.retentionDaysAfterClose`, `insuranceService.purgeExpired`,
  `POST /api/cron/retention` (Bearer `CRON_SECRET`); `adminService.exportRequest` +
  `adminService.deleteRequest` (ops-log first, cascade + blob purge) + `DangerZone.tsx`;
  `docs/threat-model.md` all controls → IN PLACE with evidence + expanded Not-defended;
  `docs/deploy-hostinger.md`. `npm audit` run — remaining high/critical are dev-only.
- Changes: commit "feat(#17): security headers, SSRF guard, retention cron, admin export/delete" on `develop`.
- Verification: TP-14 — 183 tests green (22 new); lint/typecheck/build clean; headers + cron-auth
  verified live with curl.
- Acceptance criteria: nopublic ✅, authz ✅, audit ✅ (dev-only remain), deletion ✅, logs ✅, headers ✅.
- Replies: beat 1 comment on GitHub #17. Beat 2 (deploy) is the pending Hostinger step.
- Closed by: still open — the user closes.
- Lesson: CRON_SECRET as a hard prod-boot requirement 500'd the app when unset — reverted to a soft
  check (401 at the endpoint).
- Pending: definitive legal texts + full DPIA (release gate); wire `safeFetch` into the first real
  provider; move the rate-limit store to Redis if the app scales out.

### E-013 — #4 Landing comercial orientada a conversión
- Link: https://github.com/FarinosV44/praetoria-servicios/issues/4   Status: resolved 2026-08-30 (Sprint 12) — awaiting user close
- Diagnosis: n/a (feature)
- Resolution: rebuilt `src/app/page.tsx` as a static RSC landing + `src/app/page.module.css`, all
  copy through `src/config/copy` (`COPY.landing`, `COPY.legal` — D-006). Sections: hero (2 CTAs
  within one screen) · cómo funciona (4 steps) · 11 visual categories (`src/config/trades.ts` +
  `TRADE_ICONS`) · "No necesitas saber qué profesional necesitas" · "Qué hacemos distinto" (D3
  single-interlocutor) · D9 contrast table (web tradicional/marketplace/Praetoria) + the recommended
  message · "Por qué puedes confiar" (→#21) · data-protection block · **visual quote example** with
  scope/total/plazo/garantía, labelled "Ejemplo ilustrativo" · insurance block ("podría estar
  cubierto", never "no pagarás") · coverage from `src/config/coverage.ts` · realistic FAQ (incl. no
  24/7) · urgency block (112, no 24/7 promise) · footer with legal links. OG/Twitter/canonical
  metadata. `/legal/privacidad` + `/legal/aviso-legal` — shared `LegalDoc` renderer, provisional
  pending-review banner (issue #17), `noindex`. Zero invented figures/reviews/years.
- Changes: commit "feat(#4): conversion landing + provisional legal pages" on `develop`.
- Verification: TP-13 — lint/typecheck/`npx next build` clean (`/` + `/legal/*` prerendered static);
  162 tests green (static markup — no new tests, per the test-automation not-applied list); browser
  drive of the landing + `/legal/privacidad`, all CTA hrefs verified 200 and correct.
- Acceptance criteria: onescreen ✅ (CSS/structure check — see note), cta ✅, nofiller ✅, cwv ✅
  (static), seo ✅, design ✅.
- Replies: beat 1 — completion comment to post on GitHub #4. Beat 2 (deploy) folds into the single
  end-of-backlog Hostinger deploy.
- Closed by: still open — the user closes.
- Lesson: none (browser `resize_window` didn't change the screenshot viewport — mobile layout
  checked from the CSS).
- Pending: the definitive legal texts (#17); a hero image / OG image asset (no designer in this
  engagement — the OG card is text-only for now).

### E-012 — #15 Analizar cobertura y generar borrador jurídico revisable
- Link: https://github.com/FarinosV44/praetoria-servicios/issues/15   Status: resolved 2026-08-30 (Sprint 11) — awaiting user close
- Diagnosis: n/a (feature)
- Resolution: `src/domain/insurance/coverage.ts` (pure — `buildCoverageBreakdown` = the D5
  three-way split *cláusula de póliza · norma/proceso · valoración*, page refs kept on the clause;
  `needsPolicyDocument`; `buildDraft` = HECHOS/PETICIÓN/FUNDAMENTO CONTRACTUAL/ANEXOS with the page
  reference in the fundamento and a prudent footer; `STANDARD_CAVEATS` = never promises coverage, no
  invented articles, the "falta de mantenimiento" pattern; `PROCESS_STEPS` = perito → tercer perito
  → Defensor del Asegurado → DGSFP → vía judicial). `src/server/services/coverage.ts` — `analyze`
  (active analysis + `insuranceService.getPolicyPages` → `adapters.ai.analyzeCoverage` → validate →
  `CoverageAnalysis` with `draftText`, `BORRADOR_PENDIENTE_REVISION`), `getForRequest`,
  `markReviewed` (records `reviewedByAdminId` + `reviewedAt` + a `CoverageDraftRevision`),
  `reviseDraft` (keeps the prior text as a revision). `src/server/actions/coverage.ts`. Admin
  `CoveragePanel` on the request detail (run, D5 split, page refs, draft labelled, mark reviewed,
  edit, revision history). `/s/[token]` `CoverageClientView` (verdict + facts + docs + process +
  caveats always; the draft only once REVISADO_PRAETORIA). No migration (`CoverageAnalysis` /
  `CoverageDraftRevision` shipped with #9; `coverageResultSchema` shipped with #7).
- Changes: commit "feat(#15): coverage analysis + reviewable legal draft" on `develop`.
- Verification: TP-12 — 11 pure + 6 integration tests (162 total green); lint/typecheck/build clean;
  browser drive of the admin panel (mark reviewed → status flip + revision history) and the client
  view (draft hidden before review, shown after).
- Acceptance criteria: pageref ✅, needdoc ✅, draftparts ✅, limits ✅, humanreview ✅.
- Replies: beat 1 — completion comment to post on GitHub #15. Beat 2 (deploy) folds into the single
  end-of-backlog Hostinger deploy.
- Closed by: still open — the user closes.
- Lesson: none (a browser-harness quirk with the admin login `type` action is noted in the sprint
  file for the next session).
- Pending: the real AI coverage provider (mock covers dev/test); an in-assistant entry to trigger
  the coverage analysis (the admin runs it now).

### E-011 — #14 Subir y procesar una póliza de seguro de hogar
- Link: https://github.com/FarinosV44/praetoria-servicios/issues/14   Status: resolved 2026-08-30 (Sprint 10) — awaiting user close
- Diagnosis: n/a (feature)
- Resolution: `src/domain/insurance/` (pure — doc-kind taxonomy, `policyExtractionSchema` with
  `{doc,page}` refs, `extractPolicyFields` parser, `extractionStatusFor`, `missingDocKinds` /
  `missingSummary`, `validateInsuranceDoc` with PDF magic-byte sniff). `src/server/services/
  insurance.ts` — `ensureCase` (1:1 with request), `recordConsent` (`INSURANCE_DOC_ANALYSIS` +
  `InsuranceCase.consentGiven`), `addDocument` (consent gate → `BlobStore.put({sensitive:true})` →
  `InsuranceDocument`), `analyze` (OCR per doc, `ocrUsed`/`pageCount`, tentative extraction, status,
  missing note), `getCase` (signed URLs admin-only), `deleteDocument` (verified — `storage.exists`
  check → `delete_unverified`), `purge` (retention). `POST /api/insurance/documents` (signed link
  token or admin session; origin check + rate limit). `src/server/actions/insurance.ts`.
  `/s/[token]` `InsuranceSection` (consent → which-docs-help → upload → status + missing summary).
  Admin `InsurancePanel` on the request detail (extraction with page refs, temporary view links,
  delete + purge). No migration (`InsuranceCase`/`InsuranceDocument` shipped with #9).
- Changes: commit "feat(#14): insurance policy upload + OCR + extraction" on `develop`.
- Verification: TP-11 — 18 pure + 6 integration tests (145 total green); lint/typecheck/build clean;
  curl (201/422/403) + browser drive of the client consent+upload flow and the admin extraction
  panel (garantías/franquicias/exclusiones with page refs).
- Acceptance criteria: private ✅, ocrmark ✅, pageref ✅, partial ✅, linkpolicy ✅, consent ✅.
- Replies: beat 1 — completion comment to post on GitHub #14. Beat 2 (deploy) folds into the single
  end-of-backlog Hostinger deploy.
- Closed by: still open — the user closes.
- Lesson: none (an env note on `Origin === APP_URL` for `/api/*` POSTs went to `docs/playground.md`).
- Pending: the in-assistant "seguro" upload step (`/solicitar`); the OCR real provider (mock covers
  dev/test); coverage analysis + the legal draft are issue #15 (next sprint).

### E-010 — #16 Consulta segura del estado y respuesta del cliente
- Link: https://github.com/FarinosV44/praetoria-servicios/issues/16   Status: resolved 2026-08-30 (Sprint 9) — awaiting user close
- Diagnosis: n/a (feature)
- Resolution: `src/domain/requests/client-view.ts` (pure — every `RequestStatus` → comprehensible
  label/description/tone, `canDecideQuote`/`canAddInfo`), `src/lib/phone.ts` `phoneLast4Matches`.
  `src/server/services/clientLink.ts` — `issue` (stores only the SHA-256 hash), `resolve`
  (HMAC verify → hash match → not revoked → not expired), `revokeAll`, `regenerate` (reference +
  phone last-4), `getClientView` (per-request only), `addClientInfo` (ClientCorrection; re-queues on
  REQUIERE_INFORMACION), `decideQuote` (phone last-4 → `quoteService.recordDecision` with evidence).
  `src/server/actions/clientLink.ts` (rate-limited `linkLookup`/`linkIssue`). `/s/[token]` page +
  `ClientStatusView` + `RecoverAccess`. `/api/uploads` accepts a link `token`; `PhotoUpload` gained
  `linkToken`. Wired: link issued on submit + on quote send; CONFIRMATION and QUOTE_AVAILABLE emails
  carry the `/s/<token>` URL (applied at send time, never persisted — L-003 principle). No migration
  (`ClientLink` shipped with #9; `lib/signed-link.ts` shipped with #2 groundwork).
- Changes: commit "feat(#16): signed client status link + response" on `develop`.
- Verification: TP-10 — 13 pure + 6 integration tests (121 total green); lint/typecheck/build clean;
  browser drive of `/s/[token]` (full D4 quote view, wrong-code rejected, correct-code accepted →
  DB `ACEPTADA`/`ACEPTADO` + evidence `{via:signed-link,quoteVersion:1,ip}`).
- Acceptance criteria: nosequential ✅, noleak ✅, verify ✅, evidence ✅, nointernal ✅.
- Replies: beat 1 — completion comment to post on GitHub #16. Beat 2 (deploy) folds into the single
  end-of-backlog Hostinger deploy.
- Closed by: still open — the user closes.
- Lesson: none (an env note on `SIGNED_LINK_SECRET` went to `docs/playground.md`).
- Pending: a scheduled runner for `clientLink` expiry cleanup is optional (#17/#19).

### E-009 — #13 Comunicaciones por email y WhatsApp
- Link: https://github.com/FarinosV44/praetoria-servicios/issues/13   Status: resolved 2026-08-30 (Sprint 8) — awaiting user close
- Diagnosis: n/a (feature)
- Resolution: `src/domain/communications/` (pure — `templates.ts` renders CONFIRMATION /
  INFO_REQUEST / QUOTE_AVAILABLE / GENERIC to `{subject,text,html}` from `src/config/copy.comms`
  with a configurable brand name and HTML escaping; `schema.ts` — `canSend` purpose/consent gate,
  `channelForContact`, `idempotencyKey`). `src/server/services/communications.ts` — `enqueue`
  (idempotent per request+kind; EMAIL→PENDING, WHATSAPP→LINK_PREPARED, consent + reachability
  guards), `sendPending({max})` email queue with bounded retries (`LIMITS.communications.maxAttempts`),
  `retry`, `whatsappLink` (deep link from the persisted body — no secret), `listForRequest`, and
  `notify` (best-effort enqueue+flush for flow wiring). Wired: `finishRequestAction`→CONFIRMATION,
  `adminService.requestMoreInfo`→INFO_REQUEST, `quoteService.markSent`→QUOTE_AVAILABLE. Admin:
  `src/server/actions/communications.ts` + `CommsPanel.tsx` on the request detail (status chips,
  "Procesar cola de envíos", "Generar enlace de WhatsApp"). No migration (the `Communication` model
  shipped with #9).
- Changes: commit "feat(#13): email + WhatsApp communications" on `develop`.
- Verification: TP-9 — 14 pure + 6 integration tests (108 total green); lint/typecheck/build clean;
  browser drive of the admin INFO_REQUEST → CommsPanel → WhatsApp link path.
- Acceptance criteria: nolost ✅, status ✅, simmode ✅, nomarketing ✅; **expire ⚠ delegated to #16**
  (the private client link and its expiry are issue #16; QUOTE_AVAILABLE carries the URL slot).
- Replies: beat 1 — completion comment to post on GitHub #13 with this sweep. Beat 2 (deploy) folds
  into the single end-of-backlog Hostinger deploy per the user's standing instruction.
- Closed by: still open — the user closes.
- Lesson: L-003 (WhatsApp link re-rendered without the admin message) — fixed in-sprint.
- Pending: a scheduled `sendPending()` runner at #17/#19. (The `/s/<token>` URL retro-wire into
  QUOTE_AVAILABLE + CONFIRMATION was done in Sprint 9 / #16.)

### E-001 — #2 Inicializar arquitectura, stack y entorno reproducible
- Link: https://github.com/FarinosV44/praetoria-servicios/issues/2   Status: resolved 2026-08-29 — commented (beat 1); awaiting the user to close
- Diagnosis: n/a (greenfield task, not a bug)
- Resolution: Next.js 16 App Router + TS strict + Tailwind v4. Domain-oriented structure
  (`src/domain`, `src/adapters`, `src/lib`, `src/server`, `src/ui`, `src/config`). Prisma schema
  (full issue-#9 model) + generated initial migration. `docker-compose.yml` (Postgres 16). Zod
  everywhere; `src/lib/env.ts` validates process.env and never logs values. Adapter interfaces +
  mock/dev impls for AI / storage / email / WhatsApp / OCR + `src/server/container.ts` composition
  root. `.env.example` complete, no secrets. README (install/migrate/run/deploy). GitHub Actions CI
  (lint + typecheck + test + build + `npm audit`). Healthcheck `GET /api/health`. Temp landing.
  Founding design system (issue #3 partial).
- Changes: commits on `develop` — "chore: project scaffold + Keel foundation", "feat(#2): foundation".
- Verification: `npm run lint`, `npm run typecheck`, `npm test` (30 pass), `npx next build` — all green (TP-1, TP-2). TP-3 (session 2): migration applied against live PostgreSQL, seed OK, dev server up, `/` 200, `/api/health` → `{status:ok, checks:{database:true}}`. All issue-#2 acceptance criteria met.
- Replies: beat 1 — completion comment posted 2026-08-29 (see GitHub #2). No deploy stands between this and the user; they can close it directly.
- Deploy: n/a (infrastructure task, verified locally)
- Closed by: still open — the user closes it
- Inbound: none since the last sweep
- Lesson: L-001 (corrupt migration SQL), L-002 (blank env var) — both fixed
- Pending: user to close #2.

### E-002 — #9 Modelar solicitudes, estados y trazabilidad de negocio
- Link: https://github.com/FarinosV44/praetoria-servicios/issues/9   Status: resolved 2026-08-29 (Sprint 2) — awaiting user close
- Diagnosis: n/a (greenfield)
- Resolution: Prisma schema (committed in #2) covers every entity. Sprint 2 added the persistence
  layer: `src/domain/requests/schema.ts` (Zod), `src/domain/requests/draft.ts` (pure expiry),
  `src/server/services/requests.ts` (`RequestService`: create draft, fetch, describeProblem +
  coverage, attachContact + 3 granular consents + phone normalisation, `applyTransition`
  transactional writing an immutable `StatusEvent`, idempotent `submit`, `deleteExpiredDrafts`),
  `src/server/actions/requests.ts` (thin actions). Server-validated transitions via the
  state machine; non-sequential public reference; PII in its own `Contact` table.
- Changes: commit "feat(#9): request persistence layer" on `develop`.
- Verification: TP-4 — 5 pure + 9 integration tests against `praetoria_test`, all green (44 total).
- Replies: none yet — will comment (beat 1) with the sweep.
- Deploy: n/a
- Closed by: still open — user closes
- Inbound: none
- Lesson: none
- Pending: ER diagram of the model (Phase 6). Draft-expiry needs a scheduled job to actually run
  `deleteExpiredDrafts` in production (wire in issue #17 or #19).

### E-007 — #11 Admin auth + panel
- Link: /issues/11   Status: resolved 2026-08-29 (Sprint 6) — awaiting user close
- Resolution: `lib/password.ts` (scrypt), `server/auth.ts` (HMAC signed-cookie session, D-012 —
  not Auth.js), `src/proxy.ts` guard + `(panel)/layout.tsx` + `requireSession()` per action,
  `server/services/admin.ts` (list/filters/search, detail w/ signed photo URLs, classify, status via
  state machine, more-info, KPIs, `AdminActionLog`), `/admin/{login,inbox,solicitudes/[ref]}`.
- Verification: TP-7 — 10 tests + browser walkthrough (unauth→login; status change PS-W25F-TAYZ→
  EN_REVISION with ADMIN StatusEvent + action-log row). 76 total green.
- Closed by: still open — user closes.
- Pending: real admin user management UI (create/disable other admins) — deferred to growth/ops.

### E-006 — #5 #7 #8 #10 Client assistant flow
- Links: /issues/5 /7 /8 /10   Status: resolved 2026-08-29 (Sprint 5) — awaiting user close
- Resolution: 9-step assistant (`src/app/solicitar`): intent (3 entries + "no sé", benchmark D1) →
  safety triage (`domain/assistant/triage.ts`, D2) → category → photos (#6 component) → explanation
  + location + coverage → AI analysis (`server/services/analysis.ts`, mock adapter, schema-validated
  versioned `AnalysisVersion`, one active, history preserved) → validation/correction/re-analysis
  (#8, cap 3) → contact + granular never-prechecked consent + privacy link (#10) → done with
  non-sequential reference. localStorage draft recovery. Rate-limited actions.
- Changes: commit "feat(#5 #7 #8 #10): client assistant flow end to end".
- Verification: TP-6 — 8 new tests (67 total green) + full browser walkthrough to "Solicitud
  recibida" PS-2PTJ-46H9; DB VALIDADA_CLIENTE, AI-classified trade, normalised phone, 3 consents,
  immutable status history, no console errors.
- Replies: none yet.
- Closed by: still open — user closes.
- Pending: real Claude adapter (issue #7 note — needs ANTHROPIC_API_KEY; mock covers dev/test).
  Audio input UI (issue #5 deferred). Email/WhatsApp confirmation send is issue #13.

### E-005 — #6 Captura, subida y gestión segura de fotografías
- Link: https://github.com/FarinosV44/praetoria-servicios/issues/6   Status: resolved 2026-08-29 (Sprint 4) — awaiting user close
- Resolution: `domain/photos/validation.ts` (magic-byte type sniff; rejects executables),
  `lib/rate-limit.ts` + `lib/http.ts`, `server/services/photos.ts` (key-only storage, signed URLs,
  soft-delete + blob delete, `deleteAllForRequest` wired into draft expiry), `POST /api/uploads`
  (origin check + rate limit + one file), `ui/patterns/{image-client.ts,PhotoUpload.tsx}`
  (EXIF orientation + downscale + per-file progress/retry).
- Verification: TP-5 — 17 unit + 5 photo integration tests; live curl (201 / 422 / 403 / signed 200 /
  tampered 403); file lands in private `.storage/`, not `public/`.
- Replies: none yet.
- Closed by: still open — user closes.

### E-004 — #3 Identidad visual y sistema de diseño
- Link: https://github.com/FarinosV44/praetoria-servicios/issues/3   Status: resolved 2026-08-29 (Sprint 3) — awaiting user close
- Resolution: founding in-code design system. `src/ui/tokens.css` (colour/type/space/radius/shadow/
  motion + dark + reduced-motion). Components: Button, Field, Card, Alert, Spinner, EmptyState,
  Stepper, Modal (focus trap), Icon (20 inline-SVG icons — 12 trades + 8 states), Mascot (4 moods),
  SafetyAlert (D2), IntentCards (D1), Uploader shell. `/estilo` catalogue (noindex).
  `docs/design-system.md`. Nunito via next/font (no layout shift).
- Changes: commit "feat(#3): complete founding design system + benchmark D1/D2".
- Verification: lint + typecheck + build + 44 tests green; `/` and `/estilo` return 200.
- Replies: none yet.
- Closed by: still open — user closes
- Pending: automated WCAG AA / axe pass belongs to issue #19; issue #3 otherwise complete.

### E-003 — #28 Benchmark de competencia
- Link: https://github.com/FarinosV44/praetoria-servicios/issues/28   Status: resolved 2026-08-29 (session 2) — awaiting user close
- Diagnosis: n/a (research task)
- Resolution: `docs/benchmark-competencia.md` written (Spanish per D-011): 11 platforms/operators +
  4 local Valencia companies + 2 informal channels; comparison tables; 13 friction patterns with
  source/date/evidence level; 5 strengths to match; positioning statement; copy/improve/avoid/
  differentiate matrix; **12 concrete product decisions (D1–D12)** folded into
  `docs/02-functional-spec.md` ("Benchmark decisions"). Findings + impact commented on #3, #4, #5,
  #12, #15, #21, #22, #23, #25, #26. No new issues created (all work fits #1–#27).
- Changes: commit "docs(#28): competitive benchmark + product decisions" on `develop`.
- Verification vs acceptance criteria: ≥10 competitors ✅ (incl. 4 local + 2 channels); ≥5 request
  flows ⚠️ reconstructed from public docs (live click-through of 5 forms = D8, before closing #5);
  ≥100 reviews ⚠️ Trustpilot aggregate distributions (>13k reviews, 3 platforms) + ~30 dated
  individual + OCU complaints + forums (100-review manual pass scheduled for the review date);
  ≥10 decisions ✅ (12); affected issues commented ✅; no unverified claims ✅; future review date
  ✅ (2027-03-01).
- Replies: findings comments posted 2026-08-29 on #3 #4 #5 #12 #15 #21 #22 #23 #25 #26.
- Deploy: n/a
- Closed by: still open — user closes
- Inbound: none
- Lesson: none
- Pending: D8 (walk 5 live forms + capture) and the 100-review manual pass, both before/at the
  2027-03-01 review; tracked in PROGRESS deferred items.
