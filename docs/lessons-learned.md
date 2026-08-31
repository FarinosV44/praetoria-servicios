# Lessons Learned — Praetoria Servicios

> Append-only. Symptom → cause → fix. Never trim.

## L-001 — Prisma deprecation warning corrupted the generated migration SQL
- Symptom: `prisma migrate deploy` failed with `syntax error at or near "warn"` (SQLSTATE 42601); the DB marked the migration failed.
- Cause: the initial migration was generated with `npx prisma migrate diff ... --script > migration.sql`. Prisma printed the `package.json#prisma` deprecation notice to **stdout**, so its first two lines were written into the `.sql` file.
- Fix: removed the `package.json#prisma` key, added `prisma.config.ts` (with `import "dotenv/config"` because a config file disables Prisma's automatic `.env` loading), reset the dev DB (`docker compose down -v`), and regenerated the migration with `prisma migrate dev --name init` against the live database (which writes a clean `.sql`).
- Where: Sprint 1 / `prisma/migrations`, session 2.
- What failed first: `prisma migrate diff --from-empty --to-schema-datamodel --script` redirected to a file — never trust its stdout to be pure SQL.
- Check added: none mechanical yet — but every migration `.sql` should start with a `--` comment or a SQL keyword; consider a `scripts/keel-verify` check that greps migration files for non-SQL leading lines.
- Rule for next time: generate migrations with `prisma migrate dev` against the docker DB, not by redirecting `migrate diff --script`. If a script must be captured, pipe through `grep -vE '^(warn|info|For more)'` or inspect the head before committing.

## L-003 — WhatsApp link re-rendered the template and dropped the admin's message
- Symptom: the "Generar enlace de WhatsApp" button on a `INFO_REQUEST` communication opened a
  pre-filled WhatsApp message with an empty gap where the admin's question should be.
- Cause: `communicationService.whatsappLink` called `renderTemplate(kind, { clientName, reference })`
  — it did not pass `message`, because the admin text is not one of its arguments. The full rendered
  body (with the message) was already persisted on the row as `bodyPreview` at enqueue time.
- Fix: `whatsappLink` now uses `row.bodyPreview` as the deep-link text (falling back to a
  message-less render only if the row somehow has no body). Regression covered by the integration
  test "WhatsApp is prepared as a link … and carries the admin message".
- Where: `src/server/services/communications.ts`, Sprint 8 (issue #13).
- What failed first: caught by the in-sprint browser drive, not by a unit test — the unit tests
  exercised `renderTemplate` directly (which is correct) and the service's email path (which stores
  and re-reads the body). The WhatsApp path re-rendered instead of re-reading.
- Check added: the integration assertion above; no mechanical `keel-verify` check (this is a
  "use the stored artifact, don't recompute it" bug, not a doc/consistency drift).
- Rule for next time: when a value was rendered and persisted once, later steps read the persisted
  copy — they never re-run the renderer with a subset of the original inputs.

## L-008 — `env.ts` fail-fast was too aggressive → a fresh deploy 500'd on every route
- Symptom: the Hostinger deployment (app on Hostinger, DB on Supabase) returned "Internal Server
  Error" on **every** URL, including `/api/health` — which by its own logic can only return 200/503.
- Cause: `src/lib/env.ts` runs `load()` at module evaluation and THREW on any failed check. The
  `superRefine` made `WHATSAPP_BUSINESS_NUMBER` a hard requirement whenever `WHATSAPP_ADAPTER=link`
  (the default), plus SMTP/S3/Claude vars for their adapters. A deploy that set `DATABASE_URL` +
  the secrets but not the WhatsApp number → `env.ts` throws at import → every module that imports
  `env` (i.e. all of them) fails to load → 500 everywhere, with no useful page-level error.
- Fix: only `DATABASE_URL` (always) and `AUTH_SECRET` + `SIGNED_LINK_SECRET` (production) stay
  FATAL. Every adapter-config gap moved to `warnGaps()` — a one-line `[env]` `console.warn` at boot,
  app still starts, that feature degrades (`src/adapters/whatsapp` already returned `null` without a
  number). The FATAL message now names the offending vars and says which three are actually
  required. Verified: prod env with only the 3 required vars boots (with warnings); missing a
  secret still fails fast with a clear message.
- Also: `/api/health` now reports `checks.migrations` (does `_prisma_migrations` have a finished
  row) + a `detail` string — so "DB unreachable" vs "DB reachable but not migrated" is one curl
  away. `docs/deploy-hostinger.md` gained a Supabase connection-string table (direct/session for
  migrations, transaction pooler for runtime) and an ISE troubleshooting section.
- Rule for next time: a boot-time config validator should throw ONLY for config without which the
  process genuinely cannot serve a single request. Anything feature-scoped is a warning + a
  degraded feature, never a dead site.

## L-007 — Public marketing pages 500'd wholesale when Postgres was unreachable
- Symptom: user reported "internal server error y no me deja ver nada" — every public page
  (`/`, `/servicios/*`, `/zonas`, `/guias`) returned a 500. Confirmed by pointing `DATABASE_URL`
  at a closed port: `PrismaClientInitializationError` ("Can't reach database server").
- Cause: server components did an unguarded `await someService.<dbCall>()` for an OPTIONAL section
  (the landing "reviews" block, a service page's ratings, the guides list). When the query threw,
  the exception bubbled to the route and Next returned a 500 for the whole page — a public
  marketing page taken down by a section that should just be hidden. The `entry` point was Sprint 18
  (landing reviews) and it spread with every DB-backed section added since (#25, #26).
- Fix: `src/lib/safe.ts` — `safe(fn, fallback, label)` runs the query, and on failure logs
  (`log.error`) and returns the fallback. Applied to the optional DB reads in `src/app/page.tsx`,
  `src/app/servicios/[slug]/page.tsx`, `src/ui/reputation/ReviewsSection.tsx`, `src/app/zonas/page.tsx`,
  `src/app/zonas/[municipio]/page.tsx` (→ `notFound()` on failure), `src/app/guias/page.tsx`,
  `src/app/guias/[slug]/page.tsx`. Verified: with the DB down every public route now returns 200
  (degraded), not 500.
- What failed first: `safe.test.ts` (the reproduction — a rejecting `fn` must yield the fallback,
  not throw). The end-to-end proof is a dev server with `DATABASE_URL` on a dead port hitting each
  route.
- Rule for next time: a server component that renders a public page must wrap every OPTIONAL
  DB/IO read in `safe(...)`. Only the data the page genuinely cannot exist without (e.g. the article
  on `/guias/[slug]` — which still degrades to `notFound()`, never a 500) may be allowed to fail.
- Note: `src/lib/env.ts` throws at module load on an invalid `.env`, which also 500s every page —
  that one is intentional (fail-fast on misconfiguration). If a user reports "everything 500s",
  check BOTH: is Postgres up (`docker compose up -d`), and is `.env` valid.

## L-006 — Reading `e.currentTarget` inside a deferred `setState` updater crashes the component
- Symptom: the editorial CMS editor (`ArticleEditor`) rendered fine on a normal load but crashed to
  the global-error boundary under fast form input during the E2E (`locator.fill` on several fields
  in quick succession right after navigation).
- Cause: `const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.currentTarget.value }))`. React
  nullifies `event.currentTarget` after the handler returns; the `setF` updater runs LATER (render
  phase), so `e.currentTarget` is `null` → `null.value` throws inside the updater → React unwinds to
  the nearest error boundary.
- Fix: capture the value synchronously — `const v = e.currentTarget.value; setF((p) => ({ ...p, [k]: v }))`.
- Where: `src/app/admin/(panel)/contenido/[id]/ArticleEditor.tsx`, Sprint 19.
- What failed first: caught by the E2E (`professionals.spec.ts` CMS test), not a unit test — the
  bug only manifests when the updater is deferred AND the event object is reused, which fast
  successive fills trigger reliably and a single manual edit does not.
- Check added: the E2E now does the full create→fill-body→fill-author→save walk (previously it was
  trimmed to dodge the flake); no mechanical `keel-verify` check (no scripts/keel-verify, D-004).
- Rule for next time: never reference `e`/`e.currentTarget`/`e.target` inside a `setState` updater
  callback or any other deferred closure — read the primitive value out first. This applies to
  `.checked` on checkboxes just as much as `.value` on inputs.
- RECURRENCE (Sprint 22, `ApplicationForm.tsx`): reintroduced as
  `onChange={(e) => setTrades((prev) => e.currentTarget.checked ? ... : ...)}` on the trade
  checkboxes — same crash, again caught by the new E2E form-submit test, not by lint or unit tests.
  When writing ANY checkbox/select/input `onChange` that calls a functional `setState`, the first
  line of the handler must be `const v = e.currentTarget.value` / `const checked = e.currentTarget.checked`.

## L-005 — Design-system colour tokens failed WCAG AA contrast (caught by the #19 axe audit)
- Symptom: the automated accessibility pass (axe-core, issue #19) reported 23 `color-contrast`
  violations on the landing and 1–3 on every new page.
- Cause: two founding tokens (`src/ui/tokens.css`, issue #3) were below the AA 4.5:1 threshold:
  `--c-text-faint` (`#8a8172` = 3.6:1 on `--c-bg`) and white-on-`--c-brand` (`#c05f3c` = 4.24:1).
  Used everywhere — every muted caption and every primary button.
- Fix: darkened `--c-text-faint` → `#6b6353` (4.75:1 even on `--c-brand-soft`) and `--c-brand` →
  `#b0522f` (white-on-brand 5.1:1, brand-as-bold-text 4.75:1), plus `--c-text-faint` in dark mode
  for headroom, and the manifest/icon/global-error hexes to match. Also added `tabindex="0"` +
  `role="group"` to the landing's horizontally-scrollable contrast table (`scrollable-region-focusable`,
  only fired on the mobile viewport).
- Where: `src/ui/tokens.css`, `src/app/{manifest.ts,icon.tsx,global-error.tsx,page.tsx}` — Sprint 15.
- What failed first: the design system's stated a11y criteria (issue #3) were never checked with a
  tool — WCAG AA was assumed, not measured. The landing (#4) shipped the same way.
- Check added: `tests/e2e/a11y.spec.ts` — axe with the WCAG 2.0/2.1/2.2 A+AA tags on `/`, `/solicitar`,
  `/servicios`, `/servicios/[slug]`, `/cobertura`, on both viewports; fails on any serious/critical
  violation. Runs in CI.
- Rule for next time: any new colour pairing (token, or a one-off) is checked against 4.5:1 (3:1 for
  large text) before it ships. The axe e2e pass is the backstop; it is not the first line.

## L-004 — Strict `script-src 'self'` CSP with no nonce breaks Next 16 hydration site-wide
- Symptom: `next build` + `next start`, every page throws `Minified React error #412` in the
  console; `/solicitar` never leaves the loading spinner (the assistant never hydrates); the admin
  panel and all client interactivity are dead. Static pages with no client component (`/legal/*`)
  throw it too.
- Cause: Sprint 13 (#17) added `Content-Security-Policy: … script-src 'self' …` in `next.config.ts`
  with no `nonce` and no `'unsafe-inline'`. Next 16 App Router emits inline `<script>` tags for the
  RSC hydration payload (`self.__next_f.push(...)`). The browser blocks them → React cannot hydrate.
  `next.config.ts` even carried a comment saying "scripts use nonces via Next" — but nothing
  generated a nonce (no `proxy.ts`/middleware doing it), so no nonce was ever applied.
- Fix: per-request nonce generated in `src/proxy.ts` (`script-src 'self' 'nonce-…' 'strict-dynamic'`,
  exposed as `x-nonce`); CSP moved out of `next.config.ts`; `export const dynamic = "force-dynamic"`
  in `src/app/layout.tsx` because a statically prerendered page bakes its inline scripts at build
  time with no nonce (Next only injects the nonce during a dynamic render). `src/proxy.test.ts` (6)
  pins the mechanism, written failing first (issue #29).
- Where: `src/proxy.ts`, `next.config.ts`, `src/app/layout.tsx` — Sprint 14, session 4.
- What failed first: Sprint 13's verification was `curl -D -` (headers) + a visual check of static
  pages that need no JS. Neither exercises hydration.
- Check added: `src/proxy.test.ts` (nonce present in CSP + `x-nonce`, unique per request, never a
  bare `script-src 'self'`). No mechanical `keel-verify` on this project (D-004).
- Rule for next time: any change to the CSP (or any security header that can affect script/style
  loading) requires a browser drive of an interactive page — the assistant, not just the landing —
  and a read of the console for hydration errors. `curl` proves the header, never the page.

## L-002 — Empty-string env vars fail Zod `.optional()` URL fields
- Symptom: dev server 500 on every route: `[env] Invalid environment configuration: S3_ENDPOINT: Invalid URL`, even though S3 is unused.
- Cause: `.env.example` ships `S3_ENDPOINT=` (blank). `z.string().url().optional()` accepts `undefined`, not `""` — a blank env var is a present, invalid value.
- Fix: `load()` maps every `""` env value to `undefined` before `schema.safeParse`.
- Where: `src/lib/env.ts`, session 2.
- Check added: covered by the env schema itself now; a future env-var added as blank in `.env.example` is handled automatically.
- Rule for next time: when adding an optional env var with a format constraint (`.url()`, `.email()`), the blank-to-undefined normalisation in `load()` already covers it — do not add `.or(z.literal(""))` per field.
