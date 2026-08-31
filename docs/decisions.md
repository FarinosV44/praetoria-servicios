# Decisions — Praetoria Servicios

> Append-only. A session NEVER re-opens a decision recorded here on its own initiative;
> only the user reverses a decision (append the reversal as a new entry).

## D-001 — Session setup (autonomy, notifications, issues, scope)
- Date / phase: 2026-08-29 / Phase 1
- Decision: Automatic mode (Keel commits + pushes to `develop` itself, never merges to `main`). Notifications: chat-only (no external channel). Forge issues: sweep at each sprint close + issue capture ON (a defect found during work becomes a GitHub issue before the fix). Sweep interval 24h. Scope: build the MVP core (issues #1–#19) first, then growth (issues #20–#27).
- Why: user answered the Keel session-start batch this way. Automatic mode keeps unattended work flowing; chat-only accepted with the stated cost (a block is invisible until the next chat open).
- Alternatives rejected: manual mode (constant permission dialogs); email notifications (user declined).
- Supersedes: none

## D-002 — Stack
- Date / phase: 2026-08-29 / Phase 2
- Decision: Next.js 16 (App Router, RSC) + React 19 + TypeScript strict. Tailwind v4 for styling. PostgreSQL + Prisma ORM with versioned migrations. Zod for shared validation schemas. Vitest for unit/integration tests, Playwright for E2E. npm as package manager (pnpm not installed on the dev machine). Local dev DB via docker-compose.
- Why: issue #2 mandates "Next.js estable con App Router, TypeScript estricto y Node LTS", Tailwind + accessible primitives, PostgreSQL + ORM + migrations, shared typed schemas, decoupled adapters. create-next-app scaffolded 16.3.3 / React 19.2.8 / Tailwind 4.
- Alternatives rejected: Drizzle (Prisma has more mature migration tooling for this team); Remix/SvelteKit (issue names Next.js).
- Supersedes: none

## D-003 — License
- Date / phase: 2026-08-29 / Phase 1
- Decision: Private / proprietary (`UNLICENSED` in package.json, no OSS license file).
- Why: commercial product for a single operator (Praetoria). No intent to distribute source. Not asked explicitly — default for a private commercial web app; reverse if the user wants otherwise.
- Alternatives rejected: OSS licenses (not applicable to a private SaaS).
- Supersedes: none

## D-004 — Keel portability: lock only, no embedded skill copy
- Date / phase: 2026-08-29 / Phase 1
- Decision: Carry the Keel lock block in CLAUDE.md + AGENTS.md, but do NOT vendor the full skill under `.claude/skills/keel/`.
- Why: keeps the repo lighter; the dev environment has the skill installed. Revisit if the project moves to an environment without Keel.
- Not checked: whether a future contributor's environment will have Keel installed — accepted risk, lock block tells them to install it.
- Supersedes: none

## D-005 — No external design handoff; founding design system built inline
- Date / phase: 2026-08-29 / Phase 2
- Decision: Skip Keel Phases 3–4 (external Design tool handoff). Build the founding design system (tokens + components, issue #3) directly in code as the first development work, then reuse it across landing, assistant and admin.
- Why: this engagement is "do all the issues" with no designer in the loop and no design files. Issue #3 fully specifies the design intent (personality, tokens, component list, a11y criteria). Building it in code and documenting it in `docs/design-system.md` satisfies the reuse-by-manifest and faithfulness principles without a round trip that has no counterparty.
- Alternatives rejected: invoking the `design` skill to produce a canvas (adds a handoff with no human reviewer; the issue's acceptance criteria are the contract).
- Supersedes: none

## D-006 — Single language (Spanish) in v1, copy centralised
- Date / phase: 2026-08-29 / Phase 1
- Decision: Product ships Spanish (es-ES) only in v1. All user-facing copy goes through a central `src/config/copy` module (not hardcoded in components) so a future locale is an addition, not a rewrite. Not multi-language-ready in the full i18n-framework sense (this is not WordPress/WooCommerce, where that is mandatory).
- Why: the EPIC and every issue specify a Valencia-area Spanish service. No second locale is in scope. Full i18n tooling (next-intl etc.) is overhead with no v1 payoff; centralised copy is the cheap hedge.
- Alternatives rejected: English base + i18n framework (contradicts the product's single-market Spanish nature; issues mandate specific Spanish copy).
- Supersedes: none

## D-007 — Test-first policy: pure-logic (default accepted)
- Date / phase: 2026-08-29 / Phase 2
- Decision: `pure-logic`. Tests written and seen failing before code for: request state machine + transitions, money calculations, Zod schemas, Spanish phone normalisation, AI/OCR structured-output validation, signed-link token logic. Not applied to markup, framework glue, adapter integration scaffolding.
- Why: Keel default; these are exactly the pure-function surfaces where a post-hoc test hides the bug. Bug fixes always start from a failing reproduction test regardless.
- Supersedes: none

## D-008 — Adapters ship with mock/dev implementations; real providers configured later
- Date / phase: 2026-08-29 / Phase 2
- Decision: Every external-provider adapter (AI analysis, blob storage, email, WhatsApp, OCR) is defined as a TypeScript interface with (a) a deterministic mock implementation for tests, (b) a local dev implementation where meaningful (filesystem storage, console email, link-only WhatsApp), and (c) a real implementation wired to env vars. The MVP is fully runnable and testable with dev/mock implementations; real keys are a deployment concern.
- Why: issue #2 ("modo de desarrollo con adaptadores simulados"), issue #7 ("adaptador simulado para desarrollo y tests"), issue #13 ("modo simulado"). No provider decision is baked into domain logic.
- Real-provider defaults (changeable via env, not code): AI = Anthropic Claude (vision-capable model); storage = S3-compatible; email = SMTP or Resend; OCR = pluggable (Tesseract or a cloud OCR); WhatsApp = pre-filled link + adapter seam for a future Business API provider.
- Supersedes: none

## D-009 — Public identifiers are non-sequential
- Date / phase: 2026-08-29 / Phase 2
- Decision: Every externally-exposed identifier (request reference shown to clients, admin URLs, signed status links) is a random, non-guessable token — never the database primary key or a sequential number. Internal PKs stay as-is.
- Why: issues #9, #11, #16 all require "identificador público no secuencial" and that "identificadores secuenciales no sirven para acceder".
- Supersedes: none

## D-012 — Admin auth: minimal signed-cookie session, not Auth.js
- Date / phase: 2026-08-29 / Phase 5 (issue #11)
- Decision: admin authentication is a minimal, dependency-free HMAC-signed httpOnly cookie session (`src/server/auth.ts`) with scrypt password hashing (`src/lib/password.ts`), instead of Auth.js / NextAuth v5.
- Why: NextAuth v5 is still beta and its Next.js 16 compatibility is unproven; the admin surface is a single credentials login for a small internal team with no social providers, no registration, no account recovery. A ~120-line session module is lower risk and fully under our control. The proxy does a cheap presence/expiry check; the real verification (HMAC + DB + per-resource) runs in the Node runtime in the layout and every server action.
- Alternatives rejected: NextAuth v5 (beta + compat risk for the payoff of features we don't need); Lucia (unmaintained as of 2025).
- Not checked: whether a future requirement (SSO, MFA, multiple providers) would justify a library — revisit then.
- Supersedes: the tentative "Auth.js (NextAuth v5)" line in docs/03-technical-plan.md

## D-011 — Benchmark deliverable (#28) written in Spanish
- Date / phase: 2026-08-29 / Phase 5
- Decision: `docs/benchmark-competencia.md` (issue #28) is written in Spanish, not English.
- Why: the client specified the exact filename and the full deliverable structure in Spanish in issue #28; it is a client-facing research artifact whose findings are converted into issue comments (which, for Spanish-authored issues, are answered in Spanish per Keel). The English-by-default rule yields here to an explicit client specification.
- Alternatives rejected: English doc + Spanish summary (double the surface, and the client asked for the doc itself).
- Supersedes: none (narrows D-006/token-economy for this one artifact)

## D-013 — Coverage is "toda el área de Valencia", with a confirmed-municipality core
- Date / phase: 2026-08-30 / Phase 5 (issue #18, Sprint 14)
- Decision: Praetoria da servicio en toda el área de Valencia (ciudad + municipios cercanos). The
  `COVERAGE` list in `src/config/coverage.ts` is now the **confirmed core** (municipios donde se
  trabaja de forma habitual, mostrados como ejemplos y con respuesta sin matices). `checkCoverage`
  additionally treats **any Valencia-province postal code (`46xxx`)** as within coverage
  (`matchedBy: "area"`), with exact availability confirmed at quote time. Sagunto/Puerto de Sagunto,
  El Puig, Puçol, Rafelbunyol and La Pobla de Farnals were added to the confirmed list first, then
  the operator chose the broader phrasing.
- Why: operator (business) decision, stated in conversation ("pon simplemente en toda el área de
  Valencia tanto ciudad como municipios cercanos"). It is the operator's real service commitment,
  so stating it is honest — issue #25 forbids *inventing* coverage, not defining a real service area.
- Honesty guardrail kept: outside `46xxx` → not covered; non-confirmed `46xxx` → "damos servicio,
  disponibilidad confirmada al presupuestar", never an unqualified promise. No per-municipality SEO
  pages were created (D10 still holds — only `/cobertura` and the per-trade `/servicios/[slug]`).
- Alternatives rejected: a long rigid municipality list (the operator explicitly asked for the
  simple phrasing); province-wide with no caveat (would over-promise for far towns like Requena/Gandia).
- Supersedes: narrows the "listed municipality only" reading of `src/config/coverage.ts`.

## D-014 — CSP nonce via proxy; every route force-dynamic (issue #29)
- Date / phase: 2026-08-30 / Phase 5 (Sprint 14, issue #29)
- Decision: the Content-Security-Policy moves from `next.config.ts` (static) to `src/proxy.ts`
  (per-request `nonce` + `'strict-dynamic'` on `script-src`, no `'unsafe-inline'` for scripts).
  `src/app/layout.tsx` sets `export const dynamic = "force-dynamic"`, making every route
  server-rendered per request.
- Why: the static strict CSP blocked Next 16's inline hydration scripts (L-004) — the whole app was
  non-interactive in a production build. The nonce only reaches inline scripts during a dynamic
  render, so static prerendering had to go. Alternatives: `script-src 'unsafe-inline'` (reverses
  #17's hardening, allows injected inline scripts to run) or `experimental.sri` (experimental,
  unclear coverage of the inline bootstrap). The nonce pattern is Next's own documented strict-CSP
  approach.
- Cost accepted: no static prerendering of the marketing pages (`/`, `/servicios/*`, `/cobertura`).
  For a low-traffic local-services MVP this is negligible; revisit with a CDN / ISR at deploy (#19)
  if needed.
- Not checked: whether Next's experimental SRI would let the marketing pages stay static under a
  strict CSP — deferred, not worth the experimental-flag risk now.
- Supersedes: the "CSP in next.config.ts headers()" approach from D-? / Sprint 13 (#17).

## D-015 — Local SEO: curated problems + admin-gated municipio pages (issue #25)
- Date / phase: 2026-08-31 / Phase 5 (Sprint 20, issue #25)
- Decision: two sources, two guarantees. (1) `/problemas/[slug]` is a **curated hand-written**
  catalogue in `src/config/problems.ts` — static, `dynamicParams=false`, every page carries real
  symptom/cause/safety content, so all are always indexable. (2) `/zonas/[municipio]` is
  **CMS-backed** (`LocalPage` model): a page exists only when an admin creates it and is indexed
  only when `isLocalPageIndexable` passes — covered municipality (confirmed list, not the wider
  "área de Valencia" postcode rule) + a non-empty coverage note + at least 2 of {typical services,
  response-time note, local FAQ, completed-jobs note, authorised-photo note} + published + not
  flagged noindex. Failing the guard → the page still renders for a human but emits
  `robots: noindex` and is left out of the sitemap. No `LocalPage` row → the route 404s.
  `sitemap.ts` becomes `force-dynamic` so admin changes take effect without a rebuild.
- Why: issue #25 / D10 — "no combinaciones automáticas fontanero × cada municipio con el mismo
  texto; una página local se indexa SOLO con información real y específica" and "el administrador
  controla la indexación sin editar código". A curated list is the honest way to have real problem
  content; a content-gated CMS model is the honest way to let the operator add municipio pages only
  where they have something true to say.
- Alternatives rejected: generating a page per (trade × municipality) with templated text (exactly
  what D10 forbids); driving municipio pages off the `Article` CMS with kind=PROBLEMA (no structured
  place for coverage/response-time/FAQ signals, and no indexability guard).
- Cost accepted: `sitemap.xml` is rendered per request (same trade-off as D-014 for the marketing
  pages; negligible at MVP traffic).
- Supersedes: narrows D-013's "within the área de Valencia" — that rule still governs the coverage
  checker and quoting, but a municipio SEO page needs a **confirmed** municipality, not just a 46xxx
  postcode.

## D-010 — Money is integer minor units
- Date / phase: 2026-08-29 / Phase 2
- Decision: All monetary amounts stored and computed as integer cents (EUR). No floating point anywhere in quote/budget math. A small `Money` helper owns arithmetic, tax and formatting.
- Why: issue #12 ("Los cálculos monetarios no usan coma flotante").
- Supersedes: none
