# 03 — Technical plan

## Stack (D-002)

| Concern | Choice |
|---|---|
| Framework | Next.js 16 (App Router, React Server Components), React 19 |
| Language | TypeScript, `strict: true` |
| Styling | Tailwind CSS v4 (CSS-first config in `globals.css`), design tokens as CSS custom properties |
| UI primitives | Radix UI primitives (accessible unstyled) + local `src/ui` components |
| DB | PostgreSQL 16, Prisma ORM, versioned SQL migrations (`prisma/migrations`) |
| Validation | Zod — schemas shared between client, server actions and API routes (`src/domain/**/schema.ts`) |
| Auth (admin) | Auth.js (NextAuth v5) — credentials provider, DB session, seeded admin user; roles later |
| Unit/integration tests | Vitest + `@testing-library/react` |
| E2E | Playwright (added at issue #19) |
| Lint / format | ESLint (flat config, `eslint-config-next`) + Prettier |
| Local dev infra | docker-compose: Postgres (+ MinIO later for S3 parity if needed) |
| CI | GitHub Actions: install → lint → typecheck → test → build, on push to `main`, tags, PRs to `main` |
| Deploy target | Vercel + managed Postgres (Neon/Supabase) — reproducible; all config via env. Documented in README. |

Node: whatever the dev machine runs (currently v24); `package.json` `engines` pins `>=20`.

## Architecture — domain-oriented, adapter-isolated

```
src/
  app/                         # Next.js routes only (thin — delegate to domain/server)
    (marketing)/               # landing, service pages, legal, coverage
    solicitar/                 # F2 assistant wizard
    s/[token]/                 # F8 client signed status link
    admin/                     # F5–F7, F10 admin panel (auth-gated via layout + proxy)
    api/
      health/                  # healthcheck
      analysis/                # AI analysis trigger (if not a server action)
      uploads/                 # signed upload endpoints
    layout.tsx, page.tsx, globals.css
  domain/                      # PURE business logic — no next/*, no db client imports at module top
    requests/                  # Solicitud: types, state-machine, reference generation, validation
    analysis/                  # AnalysisResult schema, prompt versioning, insufficient-info logic
    quotes/                    # Presupuesto: line items, Money, tax, versioning, status
    insurance/                 # Policy metadata, coverage verdicts, legal-draft assembly
    communications/            # Message types, template rendering, channel selection
    coverage/                  # geographic coverage check (municipio / código postal)
    professionals/             # (growth #22) professional records + verification states
    consent/                   # consent records + types
  adapters/                    # pluggable providers — interface + mock + dev + real
    ai/                        # AiAnalyzer  (mock | claude)
    storage/                   # BlobStore   (memory | fs | s3)
    email/                     # Mailer      (memory | console | smtp/resend)
    whatsapp/                  # WhatsappSender (link | provider)
    ocr/                       # OcrEngine   (mock | tesseract | cloud)
  lib/                         # framework-agnostic helpers
    env.ts                     # zod-validated process.env, single import point
    db.ts                      # Prisma client singleton
    id.ts                      # random public references / tokens (nanoid-based)
    money.ts                   # integer-cents arithmetic, EUR formatting
    result.ts                  # Result<T,E> helper
    rate-limit.ts              # (#17) token-bucket, adapter-backed
    signed-link.ts             # (#16) HMAC-signed, expiring, revocable tokens
    logging.ts                 # (#17) PII-redacting logger
  server/                      # server-only glue
    container.ts               # builds the adapter set from env (the composition root)
    auth.ts                    # Auth.js config
    actions/                   # server actions grouped by flow
  ui/                          # the founding design system (#3)
    tokens.css                 # color/type/space/radius/shadow/motion tokens
    primitives/                # Button, Field, Card, Stepper, Alert, Modal, Uploader, Spinner, EmptyState
    icons/                     # trade + state icons (consistent set)
    mascot/                    # emotional character (SVG)
  config/                      # runtime configuration (not secrets)
    coverage.ts                # served municipalities + postcodes (editable)
    limits.ts                  # file count/size, re-analysis cap, draft TTL
    copy/                      # centralised Spanish UI strings (D-006)
    trades.ts                  # the trade catalogue (fontanería, electricidad, …)
prisma/
  schema.prisma
  migrations/
  seed.ts                      # synthetic data only (#19)
docs/
scripts/
  keel-verify                  # project conformance checks
```

**Rules that keep the isolation real:**
- `src/domain/**` and `src/lib/**` never import from `next/*`, `src/app/**`, or `src/adapters/**/{real impls}`. Domain depends on adapter *interfaces* only.
- The composition root (`src/server/container.ts`) is the ONLY place that decides which adapter implementation is used, from `src/lib/env.ts`.
- Route handlers and pages are thin: parse input (Zod) → call a server action / domain function → render. No business rules in `app/`.

## Adapter interfaces (issue #2, #7, #13, #14, #6)

| Interface | Methods (sketch) | mock | dev | real |
|---|---|---|---|---|
| `AiAnalyzer` | `analyzeProblem(input): Promise<AnalysisResult>`, `analyzeCoverage(input): Promise<CoverageResult>` | deterministic canned results keyed by input hash | — | Anthropic Claude (vision) |
| `BlobStore` | `put`, `getSignedUrl`, `delete`, `deleteByPrefix` | in-memory | filesystem under `.storage/` | S3-compatible |
| `Mailer` | `send(message): Promise<DeliveryReceipt>` | in-memory outbox | console log | SMTP / Resend |
| `WhatsappSender` | `prepare(message): { url } `, `send?(message)` | records call | link only | Business API provider |
| `OcrEngine` | `extract(file): Promise<{ pages: PageText[] }>` | canned text | — | Tesseract / cloud OCR |

`NODE_ENV=test` → all mock. `NODE_ENV=development` → dev where it exists, else mock, unless a real key is present. `NODE_ENV=production` → real; missing required key fails fast at boot (`env.ts`).

## Testing & playground

- **Playground:** `docker compose up` (Postgres) + `npm run dev` with dev/mock adapters + `npm run seed` (synthetic requests across every state). Try-it details go in `docs/playground.md` at the scaffold.
- **Test-first (D-007, `pure-logic`):** state machine, `money.ts`, Zod schemas, phone normalisation, `signed-link.ts`, AI/OCR output validation — failing test first.
- **Assistant-driven verification:** Playwright drives the assistant and admin flows headless at each test point; results in `docs/05-test-points.md`.
- Bug fixes always begin with a failing reproduction test.

## Security posture (issue #17, `references/security/web-app.md`) — built in from commit 1

- Secrets only in env, validated by `env.ts`; never in the repo.
- Authorization per *resource*, not just per route (admin detail checks the record; signed links scope to one request).
- CSRF protection on mutations; strict input validation (Zod) everywhere; SSRF guard on any server-side fetch (policy URLs etc.); upload validation (magic-byte sniff, not just extension).
- Rate limiting on: analysis, uploads, submission, signed-link issuance/lookup.
- Security headers (CSP, HSTS, X-Content-Type-Options, Referrer-Policy), secure + httpOnly + sameSite cookies.
- PII-redacting logger; no policy/photo content in logs.
- Configurable retention for drafts, photos, policies; verified deletion; admin export/delete with an operations log.
- `docs/threat-model.md` maintained from Phase 2 onward.

## Code map — target tree markers

`[E]` exists on disk · `[A]` added this session · `[G]` generated. Everything below is `[A]` unless noted.

- `[E]` `src/app/{layout.tsx,page.tsx,globals.css}`, `package.json`, `tsconfig.json`, `eslint.config.mjs`, `next.config.ts`, `postcss.config.mjs`
- `[A]` this session (Sprint 1): `src/lib/env.ts`, `src/lib/db.ts`, `src/lib/id.ts`, `src/lib/money.ts`, `src/lib/result.ts`, `src/adapters/*/index.ts` (interface + mock), `src/server/container.ts`, `src/config/{coverage.ts,limits.ts,trades.ts}`, `prisma/schema.prisma`, `docker-compose.yml`, `.env.example`, `src/app/api/health/route.ts`, `.github/workflows/ci.yml`, `docs/threat-model.md`, `docs/playground.md`
- everything else: created by its issue's slice, not before.
- `[E]` Sprint 14–16 additions: `src/lib/{analytics,seo,observability}.ts`, `src/ui/JsonLd.tsx`,
  `src/app/{robots,sitemap,manifest,icon,global-error}.*`, `src/app/servicios/`, `src/app/cobertura/`,
  `src/config/service-content.ts`, `src/proxy.ts` (CSP nonce), `tests/e2e/`, `playwright.config.ts`,
  `scripts/e2e-run.mjs`, `src/domain/professionals/`, `src/server/services/{professionals,assignment}.ts`,
  `src/server/actions/professionals.ts`, `src/app/admin/(panel)/profesionales/`,
  `src/app/admin/(panel)/solicitudes/[ref]/AssignPanel.tsx`, `src/app/s/[token]/AssignedProfessional.tsx`.
- `[E]` Sprint 17–20 additions: `src/config/{trust-charter.ts,content.ts,problems.ts}`,
  `src/app/confianza/`, `src/domain/{service-closure,content,local-seo}/`,
  `src/server/services/{serviceClosure,reviews,content,localPage}.ts`,
  `src/server/actions/{content,localPage}.ts`, `src/app/s/[token]/PostService.tsx`,
  `src/app/admin/(panel)/{incidencias,contenido,zonas}/`, `src/ui/content/BlockRenderer.tsx`,
  `src/ui/patterns/TrackedCta.tsx`, `src/app/{guias,problemas,zonas}/`.
- `[E]` Sprint 21 additions (#26): `src/domain/reputation/{aggregate,pii,moderation,spam}.ts`,
  `src/config/reputation.ts`, `src/server/actions/reviews.ts`, `src/ui/reputation/`,
  `src/app/admin/(panel)/opiniones/`. `src/lib/seo.ts::withReviewData`. `Review` model extended +
  `ReviewStatus` gains `RETENIDA_PII`/`RETIRADA`.
