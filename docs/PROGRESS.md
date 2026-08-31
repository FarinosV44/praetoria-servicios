# PROGRESS — Praetoria Servicios

> Living state. Read this FIRST in every session. Keep current and compact.

## Project card
- Name / one-line purpose: Praetoria Servicios — mobile-first Spanish web app that turns a home problem explained with photos and plain language into a clear technical request, reviewed by AI and managed by an admin.
- Project type: web-app (Next.js full-stack) / secondary: none
- Stack & target platform(s): Next.js 16 (App Router) + React 19 + TypeScript strict + Tailwind v4; PostgreSQL + Prisma; Zod; decoupled adapters for AI / storage / email / WhatsApp / OCR. Target: modern browsers, mobile-first (320px+). See docs/03-technical-plan.md.
- License: UNLICENSED (private, proprietary) — see D-003
- Docs language: English (token economy). Product UI language: Spanish (es-ES).
- Security profile: references/security/web-app.md
- Accessibility: WCAG 2.2 AA floor (AAA where feasible), EN 301 549 / EAA (EU market) — references/accessibility.md
- i18n: single — product language Spanish (es-ES); copy centralised for future locales, not multi-language in v1 (D-006)
- Installed base: fresh v1
- Design system: founding — canonical, will live at src/ui/ + src/app/globals.css tokens (see issue #3)
- Keel portability: lock only (embedded skill copy not vendored — D-004)
- Assistant config: none (portability lock only)
- E2E: `npm run test:e2e` (Playwright; `scripts/e2e-run.mjs` wrapper → `docs/.keel/e2e-status.json`). desktop-chromium 32 + mobile-chrome (Pixel 5) 25 pass, 7 mobile admin-panel skipped. **Run one project at a time with `--workers=1`** — this machine OOMs both at once (CI runs both fine). Needs `npm run e2e:install` once. CI `e2e` job runs it on push to `main` / PRs.
- CI runs on: main (default) — GitHub Actions on push to main, tags, and PRs to main
- Keel baseline: v5.19.2
- Website intent: no (the product IS the website; marketing landing is issue #4, in-app)
- Client budget: no
- User guide: deferred to Phase 6
- Docs theme: n/a until Phase 6
- Test-first policy: pure-logic (default) — state machine, money, Zod schemas, phone normalisation, AI-output validation get their tests written and seen failing before code. Asked-once default accepted (D-007).
- Durability: git remote origin https://github.com/FarinosV44/praetoria-servicios.git
- Autonomy: automatic — Keel does every merge to develop and every push itself / issues: after-sprint / Issue sweep interval: 24h / Issue capture: on
- Branches: integration branch `develop` / `main`. develop→main merges (user-authorised, per sprint): … → Sprint 18 merge `1e0130b` (#23) → Sprint 19 merge (#24) → Sprint 20 merge `6377fe2` (#25) → Sprint 21 merge `3fa8bd7` (#26) → Sprint 22 merge `98b5c0a` (#20) → Sprint 23 merge (#27). No tag yet (tag at Phase 7 / first real deploy).
- Notify: none (user chose chat-only) — a block is visible only on the next chat open
- Chaining: off (user chose "MVP core first"; no chained-chat launch — hand-off file written at every sprint close)
- Chaining model: n/a
- Chain verified: n/a

## Phase status
| Phase | Status | Key artifacts |
|-------|--------|---------------|
| 1 Discovery | done (condensed — the 27 issues + EPIC are the discovery input) | docs/01-discovery.md, docs/issues.md |
| 2 Functional spec | done (condensed) | docs/02-functional-spec.md, docs/03-technical-plan.md |
| 3 Design handoff | deferred — founding design system built inline per issue #3 (D-005); no external Design tool in this engagement | — |
| 4 Faithful build | n/a (no external design handoff) | — |
| 5 Development | **COMPLETE** — all of #2–#29 built + verified. Growth backlog empty. | docs/sprints/, docs/05-test-points.md |
| 6 Documentation | pending | docs/architecture.md, docs/api/ |
| 7 Release | pending | docs/07-release.md |
| 8 Website | n/a | — |

## Current position
- Phase: 5 — Development is **COMPLETE**. Every issue #2–#29 is built, verified, merged to `main`, and commented on GitHub. The growth backlog (#20–#27) is empty. #1 (EPIC) stays open until the user closes the rest.
- User standing instruction (2026-08-31): "sigue hasta que te ordene lo contrario y siempre en main" — honoured through Sprint 23. There is no more backlog to build.
- Next action: **ask the user** whether to start Phase 6 (Documentation — `docs/architecture.md`, `docs/api/`, ER diagram, user guide) or Phase 7 (Release prep). Do NOT tag a release or start Phase 7 unprompted (Git flow rule). Before go-live still needs the user: definitive legal texts + full DPIA (release gate; `/legal/*` are provisional + noindex), and the real Hostinger deploy (`docs/deploy-hostinger.md` is final; needs operator hPanel access + real secrets; `APP_URL` + `NEXT_PUBLIC_*` at BUILD time), plus the guided assistive-tech pass (`docs/known-limitations.md`).
- Sprint 23 (#27 centro de control SEO local) closed 2026-08-31 — TP-24 green (389 vitest, +24; E2E desktop 32 / mobile 25, 7 skipped; `domain/seo/{metrics-csv,opportunities,linking-gaps,faq-suggestions}.ts` test-first; migration `20260831134657_seo_control_centre` — `SeoMetricImport`/`SeoMetricRow` + `Request.entryPath`; CSV-first import that PII-rejects queries; `seoService` overview/pagesWithTrafficNoRequests/draftFromQuery; `EntryTracker` first-touch cookie path-only; `/admin/seo` dashboard with período+fuente+tipo labels and explicit no-causality copy; D-018, C23). **Last growth issue — backlog now empty.**
- Sprint 22 (#20 landing de captación de profesionales) closed 2026-08-31 — TP-23 green (365 vitest, +18; E2E desktop 30 / mobile 24, 6 skipped; `domain/professionals/application.ts` test-first; migration `20260831131252_professional_applications` — `ProfessionalApplication` + `ProfessionalApplicationStatus` separate from the verified network, D-017; `applicationService` submit(honeypot+spam+30-day fingerprint dedup, silent no-op success)/setStatus/addNote/convertToProfessional→CANDIDATO; action with IP rate-limit 3/h; public `/trabaja-con-nosotros` form, footer-only link, no min-volume promise; `/admin/candidaturas` inbox; C22; L-006 recurrence caught by E2E + fixed).
- Sprint 21 (#26 reseñas verificadas + reputación local) closed 2026-08-31 — TP-22 green (347 vitest, +41; E2E desktop 28 / mobile 22, 6 skipped; `domain/reputation/{aggregate,pii,moderation,spam}.ts` test-first; migration `20260831083721_reviews_reputation` — `Review` extensions + `ReviewStatus` RETENIDA_PII/RETIRADA; `reviewService` moderate/applyRedaction/respond/withdraw/openIncidence/aggregateFor; honest-by-construction — no fabrication, no cherry-pick (`isPublishable` rating-blind, `listPublished` no rating filter), PII auto-hold + redaction gate, "verificada" defined not implied, consent+withdrawal traced, negative→incidence; public `ReviewsSection` renders nothing without real reviews; `withReviewData` JSON-LD only when count>0; `/admin/opiniones` moderation queue; D-016, C21).
- Sprint 20 (#25 arquitectura SEO local) closed 2026-08-31 — TP-21 green (306 vitest, +24; E2E desktop 26 / mobile 21, 5 skipped; `local-seo/local-page.ts` indexability guard test-first; `src/config/problems.ts` 15 curated problems test-first; `LocalPage` model + migration `20260831080332_local_seo_pages`; `localPageService` create/update/setStatus/setNoindex/getPublic/listIndexable; public `/problemas` (static, curated) + `/zonas` (admin-gated, D10 guard → noindex + sitemap exclusion when thin); `TrackedCta` → `landing_cta_click`; `sitemap.ts` force-dynamic; `/admin/zonas` list+editor; footer indexes both; a11y link-in-text-block fix; D-015).
- Sprint 19 (#24 CMS editorial) closed 2026-08-31 — TP-20 green (282 vitest, +21; 37 E2E; block-based content model test-first; Article/ArticleRevision/SlugRedirect + migration; contentService with human-review publish gate + 301 redirects + scheduled publish; /admin/contenido editor + preview + history/restore; public /guias + Article JSON-LD; sitemap auto-updates; L-006 deferred-updater bug fixed).
- Sprint 18 (#23 cierre de servicio + garantía + incidencias) closed 2026-08-31 — TP-19 green (261 vitest, +18; 34 E2E; incidence state machine test-first with reason+evidence to close; ServiceCompletion/Incidence/Review models; serviceClosureService + reviewService; /s/[token] PostService; /admin/incidencias; landing reviews section only-authorised; C20 threat model).
- Sprint 17 (#21 Carta de Confianza + transparencia) closed 2026-08-31 — TP-18 green (243 vitest, +6; 33 E2E pass; `src/config/trust-charter.ts` test-first — every commitment backed by a real function; `/confianza` page versioned + dated + seal; landing summary; `/s/[token]` pre-acceptance costs + commitments; `charterVersion` on the decision evidence; in-text links underlined for a11y).
- Sprint 16 (#22 verified professional network + assignment) closed 2026-08-31 — TP-17 green (237 vitest, +30; 29 E2E pass, 3 mobile admin skipped; domain state-machine/assignment/client-view test-first; `Professional`/`Assignment` schema + migration; `professionalService` + `assignmentService`; `/admin/profesionales` UI + `AssignPanel`; client `AssignedProfessional` on `/s/[token]`; cron purges rejected docs; C19 in threat model; login rate limit 8→20/5min).
- Sprint 15 (#19 E2E + observability + deploy docs) closed 2026-08-30 — TP-16 green (207 vitest; **30 E2E pass on desktop + Pixel 5 mobile**; axe 0 serious/critical on 5 pages × 2 viewports; `src/lib/observability.ts` PII-free error+AI-metric seams; `docs/{runbook,known-limitations}.md`; `deploy-hostinger.md` final; CI e2e job; L-005 a11y contrast fix). This completes the MVP core → EPIC #1's dependency (Keel never closes #1, the user does).
- Sprint 14 (#18 SEO + analytics + service pages; #29 CSP hydration fix) closed 2026-08-30 — TP-15 green (200 tests; analytics PII-strip + consent gate test-first; 11 real service pages D10; `/cobertura` + checker; robots/sitemap/manifest/icon; JSON-LD ×5 types; D-013 coverage = toda el área de Valencia; #29: per-request CSP nonce in `src/proxy.ts` + `force-dynamic` layout, browser-verified hydration).
- Sprint 13 (#17 security/privacy/retention) closed 2026-08-30 — TP-14 green (183 tests; security headers live-verified; SSRF guard; cross-resource authz + PII-redaction tests; `/api/cron/retention`; admin export/delete + ops-log; `docs/threat-model.md` all controls IN PLACE; `docs/deploy-hostinger.md`).
- Sprint 12 (#4 conversion landing D3/D9 + `/legal/*` provisional pages) closed 2026-08-30 — TP-13 green (lint/typecheck/build clean, 162 tests, browser drive of the landing + legal pages, all CTA hrefs correct).
- Sprint 11 (#15 coverage analysis + reviewable legal draft, D5) closed 2026-08-30 — TP-12 green (162 tests + browser drive: admin D5 panel with page refs + generated draft + mark-reviewed + revision history; client view hides the draft until reviewed).
- Sprint 10 (#14 insurance policy upload + OCR + tentative extraction) closed 2026-08-30 — TP-11 green (145 tests + curl + browser drive of `/s/[token]` consent+upload and the admin extraction panel with page refs).
- Sprint 9 (#16 signed client link `/s/[token]`) closed 2026-08-30 — TP-10 green (121 tests + browser drive: full quote view, phone-last-4 verify, accept recorded with evidence). Retro-wired #13 QUOTE_AVAILABLE + CONFIRMATION emails to carry the `/s/<token>` URL (applied at send time, never persisted).
- Sprint 8 (#13 comms) closed 2026-08-30 — TP-9 green (108 tests + browser drive). Keel updated v5.19.0→v5.19.2 (skill install + lock stamps + baseline); reconciliation delta was stamp-only + a keel-stop-hook note (no hook on this project) + a keel-verify `Not checked:` rule (no scripts/keel-verify on this project — pre-existing lightweight setup, D-004).

## Open items
- Unresolved user questions: none blocking. Anthropic API key + real provider keys will be needed before real-provider verification (all adapters have mock/dev impls so the MVP is not blocked — see D-008).
- Open Design Requests: none
- Unverified external steps/assets: real AI/storage/email providers not yet configured (dev adapters in use — MVP not blocked)
- Forge issues in progress: see docs/issues.md — #2–#19, #21–#24, #28, #29 resolved (awaiting user close); #20, #25–#27 (growth) open; building in dependency order
- Deploy note (#19): `APP_URL` and any `NEXT_PUBLIC_*` must be set at BUILD time — `/sitemap.xml`, `/robots.txt`, the analytics beacon URL are all baked. Full procedure in `docs/deploy-hostinger.md`; incident playbooks in `docs/runbook.md`; v1 boundaries in `docs/known-limitations.md`.
- Release gate before go-live: definitive legal texts + full DPIA (still provisional/noindex).

### Deferred items (consciously postponed work)
- Issues #20–#27 (professional intake, verified network, post-service/warranty, editorial CMS, SEO architecture, reviews, SEO control centre) — severity: growth features — review trigger: after issues #1–#19 complete (user decision, this session)
- Audio input in the assistant (issue #5) — UI prepared, capture not implemented — before release / when touching the assistant
- WhatsApp real provider API (issue #13) — link-generation MVP only — when a provider is chosen
- Benchmark #28 — D8: walk 5 live request forms + capture (no data submitted) — before closing #5's design
- Benchmark #28 — 100 individual reviews manual pass — by the 2027-03-01 review date
- ER diagram of the request model (issue #9) — Phase 6
- Scheduled jobs for production — `requestService.deleteExpiredDrafts()`, `quoteService.expireStale()`,
  `communicationService.sendPending()` (email queue drain + retry), and insurance-doc retention
  (`insuranceService.purge` on expiry) — wire a cron/runner in #17/#19
- Assistant "seguro" intent path — an in-wizard insurance upload step in `/solicitar` (issue #14). The
  `/s/[token]` insurance section + admin panel cover the AC; the in-assistant entry is a follow-up.
- ~~#13 QUOTE_AVAILABLE email retro-wire~~ done in Sprint 9 (URL applied at send time, never persisted)
- Analytics: `landing_cta_click` from the landing (server component) needs a small client wrapper to
  fire — deferred (low value: no ANALYTICS consent exists yet on a first landing visit). Real provider
  wiring (`NEXT_PUBLIC_ANALYTICS_URL` → Plausible/GA-style) is a deploy concern (#19).
- Marketing pages are now `force-dynamic` (D-014, issue #29) — no static prerender. Revisit with
  ISR/CDN or Next experimental SRI at deploy if page latency matters.

Last updated: 2026-08-31 — Phase 5; Sprint 19 (#24 CMS editorial) closed, merged to main; next: Sprint 20 = #25 (arquitectura SEO local)
