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
- E2E: absent (will be added at issue #19 — `npm run test:e2e`, Playwright)
- CI runs on: main (default) — GitHub Actions on push to main, tags, and PRs to main
- Keel baseline: v5.19.0
- Website intent: no (the product IS the website; marketing landing is issue #4, in-app)
- Client budget: no
- User guide: deferred to Phase 6
- Docs theme: n/a until Phase 6
- Test-first policy: pure-logic (default) — state machine, money, Zod schemas, phone normalisation, AI-output validation get their tests written and seen failing before code. Asked-once default accepted (D-007).
- Durability: git remote origin https://github.com/FarinosV44/praetoria-servicios.git
- Autonomy: automatic — Keel does every merge to develop and every push itself / issues: after-sprint / Issue sweep interval: 24h / Issue capture: on
- Branches: integration branch `develop` / current work branch: develop / `main` at 372ef4d — user asked to merge develop→main on 2026-08-29 (session 2); done via `--no-ff`, pushed. No tag (not requested).
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
| 5 Development | in progress | docs/sprints/, docs/05-test-points.md |
| 6 Documentation | pending | docs/architecture.md, docs/api/ |
| 7 Release | pending | docs/07-release.md |
| 8 Website | n/a | — |

## Current position
- Phase: 5 — Development.  Done+verified: #2, #3, #5, #6, #7, #8, #9, #10, #28 (9 issues). All awaiting user close on GitHub.
- User instruction (2026-08-29): do every remaining issue, then push to main, then Hostinger redeploy (hPanel Node.js hosting — access details still needed at deploy time: git-pull+restart or webhook, and where Postgres lives).
- Next action: Sprint 6 — #11 (admin auth + inbox: Auth.js credentials, seeded admin, `/admin` list with filters in URL, `/admin/solicitudes/[ref]` detail with private photos via signed URLs, classification/priority/notes/status edit, admin action log, KPIs). Then #12 (quotes — apply benchmark D4 line items) → #13 (email + WhatsApp comms, mock/link adapters) → #16 (signed client status link) → #14 (insurance upload) → #15 (coverage analysis + legal draft, apply D5) → #4 (landing, apply D3/D9) → #17 (security/privacy/retention review) → #18 (SEO + analytics + service pages) → #19 (E2E + observability + deploy). Then growth #20–#27. Then merge develop→main + Hostinger deploy.

## Open items
- Unresolved user questions: none blocking. Anthropic API key + real provider keys will be needed before real-provider verification (all adapters have mock/dev impls so the MVP is not blocked — see D-008).
- Open Design Requests: none
- Unverified external steps/assets: real AI/storage/email providers not yet configured (dev adapters in use — MVP not blocked)
- Forge issues in progress: see docs/issues.md — all 27 open; building in dependency order

### Deferred items (consciously postponed work)
- Issues #20–#27 (professional intake, verified network, post-service/warranty, editorial CMS, SEO architecture, reviews, SEO control centre) — severity: growth features — review trigger: after issues #1–#19 complete (user decision, this session)
- Audio input in the assistant (issue #5) — UI prepared, capture not implemented — before release / when touching the assistant
- WhatsApp real provider API (issue #13) — link-generation MVP only — when a provider is chosen
- Benchmark #28 — D8: walk 5 live request forms + capture (no data submitted) — before closing #5's design
- Benchmark #28 — 100 individual reviews manual pass — by the 2027-03-01 review date
- ER diagram of the request model (issue #9) — Phase 6
- Scheduled job to run `requestService.deleteExpiredDrafts()` in production — wire in #17/#19

Last updated: 2026-08-29 — Phase 5; 9 issues done (#2 #3 #5 #6 #7 #8 #9 #10 #28); next: Sprint 6 (#11 admin)
