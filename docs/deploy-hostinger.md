# Deploy — Hostinger hPanel (Node.js hosting)

> What still needs the operator: hPanel access, the Supabase connection strings, and the real
> secret values.

## Recommended path — build in CI, upload the bundle (no build on the host)

Hostinger's git-connected app deploy ("hbuilds") runs **`next build` directly**, which in Next 16
defaults to **Turbopack**. On Hostinger's small build container Turbopack's PostCSS/Tailwind step
crashes in a retry loop → `ERROR: Failed to build the application` (stack full of repeated
`turbopack:///[turbopack-node]/transforms/postcss.ts` frames). The **webpack** build
(`npm run build` → `next build --webpack`, with `experimental.webpackMemoryOptimizations`) does not
hit this.

**If Hostinger lets you set a custom Build command:** set it to `npm run build` and redeploy. Done.

**If it doesn't (or still fails):** build off-Hostinger and upload the result:

1. **GitHub → Actions → "Deploy bundle" → Run workflow.** Enter `APP_URL` =
   `https://<your-domain>` (exact, no trailing slash). It builds the standalone server and uploads
   **`deploy-bundle`** (a `.tgz`) as an artifact — download it from the finished run.
2. **Run the migrations once** against the Supabase **Direct / Session pooler** string (port 5432,
   *not* the 6543 pooler): from your machine or a CI step,
   `DATABASE_URL="postgresql://postgres.<ref>:<pwd>@aws-0-<region>.pooler.supabase.com:5432/postgres" npx prisma migrate deploy`
3. **Create the first admin** — one `INSERT` into `AdminUser` (Supabase SQL editor) with a scrypt
   hash from `src/lib/password.ts#hashPassword`. Do **not** run `prisma/seed.ts` in production.
4. **On Hostinger:** extract the tarball into the app root. Set the env vars (table below). Set the
   **startup file / command to `server.js`** (or `node server.js`), Node **≥ 20**. Start the app.
5. **Verify:** `curl https://<domain>/api/health` → `{"checks":{"database":true,"migrations":true}}`.

`server.js` is a plain HTTP server that listens on `$PORT` — it works under Passenger and under
hPanel's Node app manager. It carries only the traced runtime dependencies, so there is no
`npm install` on the host and the memory footprint is small.

### Redeploying
Re-run the workflow, download the new bundle, replace the app folder's contents (keep the env
vars), restart. Run `prisma migrate deploy` again only if the release added a migration.

---

## Alternative — build on the host (only if the box has enough RAM)

- A single Next.js 16 Node process. **Every route is server-rendered** (the CSP nonce needs a
  dynamic render, D-014). Everything `next build` needs (`typescript`, `@types/*`, `tailwindcss`,
  `@tailwindcss/postcss`, `prisma`) is in `dependencies`, so a production-only install still builds;
  `postinstall` runs `prisma generate`.
- PostgreSQL — Supabase (or hPanel managed). `DATABASE_URL` points at it.
- No separate worker: the retention/queue job is an HTTP endpoint hit by hPanel's cron.

## Environments

| Env | Branch | `APP_URL` | Database | Purpose |
|---|---|---|---|---|
| **production** | `main` | `https://<domain>` | production Postgres | live |
| **preview** (optional but recommended) | `develop` | `https://preview.<domain>` or a subdomain | a **separate** Postgres (never the prod one) | run the E2E suite + a manual pass before promoting to `main` |

A preview env is a second hPanel Node app pointed at the `develop` branch with its own `.env`
(its own `APP_URL`, its own `DATABASE_URL`, `AI_ADAPTER=mock`). The E2E suite runs against it:
`E2E_BASE_URL=https://preview.<domain> E2E_NO_SERVER=1 npm run test:e2e`.

## Environment variables

Create `.env` from `.env.example`:

| Var | Value | Notes |
|---|---|---|
| `NODE_ENV` | `production` | |
| `APP_URL` | `https://<domain>` | **Must be set at BUILD time, not just runtime** — `sitemap.xml`, `robots.txt` and canonical URLs are generated from it. A wrong/absent value at build ships a sitemap pointing at `localhost`. Also used for the CSRF Origin check — must match exactly (scheme + host, no trailing slash). |
| `DATABASE_URL` | `postgresql://…` | |
| `AUTH_SECRET` | 32+ random chars | `openssl rand -base64 32` |
| `SIGNED_LINK_SECRET` | 32+ random chars | different from `AUTH_SECRET` |
| `CRON_SECRET` | 32+ random chars | enables `POST /api/cron/retention`; without it the endpoint 401s every call (fail-safe) |
| `EMAIL_ADAPTER` | `smtp` | + `SMTP_URL=…`, `EMAIL_FROM="Praetoria Servicios <no-reply@<domain>>"`. Leave `console` until email is wired. |
| `WHATSAPP_BUSINESS_NUMBER` | E.164 without `+` | |
| `STORAGE_ADAPTER` | `fs` | + `STORAGE_FS_DIR=/home/<user>/praetoria-storage` — a path **outside** the web root and the repo. Or `s3` with the `S3_*` vars. |
| `AI_ADAPTER` | `mock` | → `claude` + `ANTHROPIC_API_KEY=…` when a key is added |
| `OCR_ADAPTER` | `mock` | until a real OCR is chosen |
| `NEXT_PUBLIC_ANALYTICS_URL` | *(optional)* | a Plausible/GA-style collector endpoint; when set, consented analytics events are `sendBeacon`-ed there. Unset → events only hit the server log. This is a `NEXT_PUBLIC_` var so it is **baked at build time**. |
| `DEBUG_LOGS` | `0` in production | flip to `1` temporarily to capture verbose logs for a support case (`docs/runbook.md`) |

## Supabase as the database

Supabase gives **two** connection strings — use the right one for each job:

| Use | Which string | Port | Notes |
|---|---|---|---|
| **`prisma migrate deploy`** (and `prisma db push`) | **Direct connection** (Project Settings → Database → *Connection string* → **Direct**) or the **Session pooler** | 5432 | Migrations run DDL in transactions and use prepared statements — the *transaction* pooler breaks both. If your host has no IPv6, the Direct string won't resolve → use the **Session pooler** (IPv4). |
| **The app at runtime** (`DATABASE_URL`) | **Transaction pooler** | 6543 | Add `?pgbouncer=true&connection_limit=1` to the URL. A long-lived Node process can also use the Direct/Session string, but the pooler is safer on shared hosting. |

- URL-encode the password if it contains `@ : / ?` etc. (`%40`, `%3A`, …).
- Append `sslmode=require` if the host doesn't add it.
- **Run the migration from your machine or CI, once**, pointing `DATABASE_URL` at the *direct/session*
  string:
  `DATABASE_URL="postgresql://postgres.<ref>:<pwd>@aws-0-<region>.pooler.supabase.com:5432/postgres" npx prisma migrate deploy`
  Then set the Hostinger app's `DATABASE_URL` to the *transaction pooler* string for runtime.
- Create the first admin with a SQL `INSERT` in the Supabase SQL editor (hash from `src/lib/password.ts`).

## Troubleshooting — "Internal Server Error" on every page (incl. `/api/health`)

`/api/health` catches DB errors and returns 200/503 — it never 500s from its own logic. **A 500 on
`/api/health` means a module failed to load before the handler ran**, which is almost always the env
check. Check, in order:

1. **`/api/health`** once the app boots — `{"checks":{"database":true,"migrations":true}}` is
   healthy. `database:false` → the `DATABASE_URL` string is wrong / unreachable (see Supabase table
   above). `migrations:false` → the string works but `prisma migrate deploy` was never run against
   this DB.
2. **The app log at startup.** `[env] FATAL: invalid environment configuration` lists exactly which
   vars are missing. Only **three** are hard requirements: `DATABASE_URL`, and — because
   `NODE_ENV=production` — `AUTH_SECRET` and `SIGNED_LINK_SECRET` (32+ chars each, different values).
   Everything else (`WHATSAPP_BUSINESS_NUMBER`, `SMTP_URL`, `S3_*`, `CRON_SECRET`) is a `[env]`
   **warning** — the app boots without it and that feature is just disabled.
3. **`NODE_ENV`** must be exactly `production`. If it's unset, the secrets aren't required but other
   behaviour differs; if it's a typo, zod rejects it → FATAL.
4. **The start command** — it must be `npm run start` (which runs `next start`), not `next build`,
   and the build must have completed (`.next/BUILD_ID` present). A half-built `.next` 500s everything.
5. **Node version** — Next 16 needs Node ≥ 20. Check hPanel's Node selector.

## First deploy

1. **Push `main`.** On the server, clone or pull `main`.
2. `npm ci` (or `npm install`). Everything the build needs — `next`, `typescript`, `@types/*`,
   `tailwindcss`, `@tailwindcss/postcss`, `prisma` — is in `dependencies`, so a production-only
   install (`--omit=dev`, or `NODE_ENV=production` at install time, which Hostinger sets) still
   builds. `postinstall` runs `prisma generate` automatically.
3. Create `.env` (table above). Double-check `APP_URL` before the build.
4. `npx prisma migrate deploy` — see **Safe migrations** below.
5. **Create the first admin** — do NOT run `prisma/seed.ts` in production (it seeds a known dev password). Insert one row into `AdminUser` with a scrypt hash produced by `src/lib/password.ts` (`hashPassword`), e.g. a one-off `npx tsx` script that prints the hash for a password you choose, then a single SQL `INSERT`.
6. `npm run build` (with `APP_URL` and any `NEXT_PUBLIC_*` set).
7. Start the app via hPanel's Node.js app manager.
8. Smoke: `curl -sSf https://<domain>/api/health` → `{"status":"ok","checks":{"database":true,"migrations":true}}`; open `/`, `/solicitar` (the assistant must load past its spinner), `/servicios/fontaneria`, `/cobertura`.

### The minimum set of environment variables

Set these by hand in hPanel's Node app → Environment variables, then redeploy:

| Variable | Required? | Value |
|---|---|---|
| `NODE_ENV` | **yes** | `production` |
| `DATABASE_URL` | **yes** | Supabase **transaction pooler** string (port 6543) + `?pgbouncer=true&connection_limit=1`, password URL-encoded |
| `AUTH_SECRET` | **yes** | 32+ random chars (`openssl rand -base64 32`) |
| `SIGNED_LINK_SECRET` | **yes** | 32+ random chars, **different** from `AUTH_SECRET` |
| `APP_URL` | **yes** | `https://<your-domain>` — exact, no trailing slash. Must be present when `npm run build` runs. |
| `CRON_SECRET` | recommended | 32+ random chars — enables `POST /api/cron/retention`; without it that endpoint 401s (the site still works) |
| `WHATSAPP_BUSINESS_NUMBER` | optional | E.164 without `+` (e.g. `34600111222`). Absent → the WhatsApp buttons are hidden; nothing else changes. |
| `AI_ADAPTER` | optional | leave unset (defaults to `mock`). `claude` is **not wired yet** — setting it breaks the assistant. |
| everything else (`SMTP_*`, `S3_*`, `EMAIL_*`, `OCR_*`, `STORAGE_*`) | optional | leave unset. The app boots and logs a one-line `[env]` warning for each; that feature is simply disabled. Uploads use the local filesystem (`.storage/`) by default. |

Only the five **yes** rows are enforced at boot. Miss one → the app logs
`[env] FATAL: invalid environment configuration` and every route 500s until it's fixed.

## Redeploy

```
git pull origin main
npm ci                             # postinstall runs `prisma generate`
npx prisma migrate deploy          # safe: see below. Use the DIRECT/SESSION Supabase string here.
npm run build                      # APP_URL must be in the environment
# restart the Node app (hPanel app manager or the process manager)
```

If `npm run build` OOMs on shared hosting (the process is killed with no error), build once
locally or in CI and upload the `.next` directory alongside the code, then only `npm ci --omit=dev`
+ `prisma migrate deploy` + restart on the server.

If hPanel offers a deploy webhook, point it at this sequence. Keep the previous release directory
(or a git tag) for the rollback path in `docs/runbook.md`.

## Safe migrations

- `prisma migrate deploy` only applies committed migrations forward; it never resets or drops.
- Review each migration's SQL before deploy. For a column drop / type change, ship it in two
  releases (add-nullable → backfill → switch reads → drop) so a mid-deploy rollback never hits a
  schema the old code can't read.
- Take a database snapshot (below) immediately before `migrate deploy` on production.
- Migrations run once, from one place — never from two app instances at the same time.

## Cron — retention + email queue

hPanel cron, every 10–15 min:

```
*/15 * * * * curl -fsS -X POST -H "Authorization: Bearer $CRON_SECRET" https://<domain>/api/cron/retention >/dev/null 2>&1
```

Deletes stale unsent drafts (+ photo blobs), expires stale quotes, drains the pending email queue
with bounded retries, purges insurance cases whose request closed > 90 days ago
(`LIMITS.insuranceDocs.retentionDaysAfterClose`). Idempotent. Wraps its body in a try/catch that
emits a structured `unhandled error` log (issue #19) and returns 500 without a stack trace.

## Backups

- **Postgres:** hPanel managed → enable automatic daily snapshots. Self-managed → nightly `pg_dump`
  to off-box storage.
- **Blob directory** (`STORAGE_FS_DIR`): back it up too — it holds photos and encrypted insurance
  documents. A DB backup without the blobs is not a restore.
- **Test a restore before go-live** (release gate) — restore both into the preview env and run the
  E2E suite against it.

## Security headers

- **CSP** is set per-request in `src/proxy.ts` (a fresh nonce per response; `script-src` has no
  `'unsafe-inline'`). The other headers (HSTS 2y preload, `X-Content-Type-Options`,
  `X-Frame-Options: DENY`, `Referrer-Policy`, `Permissions-Policy`, COOP) are static in
  `next.config.ts`. `poweredByHeader` is off.
- If a reverse proxy / CDN sits in front: it must **not** strip `Content-Security-Policy`,
  `Strict-Transport-Security`, or the `x-nonce` response header, and it must forward the real
  `Origin` / `Host` (the CSRF check and `APP_URL` comparison depend on it). Caching a page with its
  per-request nonce across users breaks hydration — cache assets, not HTML, or disable HTML caching.

## Health & alerts

- `GET /api/health` → 200 `{status:"ok",checks:{database:true,migrations:true}}`; 503 (with a `detail`
  string) when the DB is unreachable OR reachable-but-not-migrated.
  Wire hPanel's uptime monitor (or an external one like UptimeRobot) to it with a 1–5 min interval
  and alert on two consecutive failures.
- Error + AI-latency logs go to stdout as single-line JSON (`level`, `msg`, redacted fields). Point
  hPanel's log drain at them, or tail `~/.pm2/logs` / the app-manager log. `docs/runbook.md` has the
  grep patterns.
- A real error tracker (Sentry-style) is wired by adding an `ERROR_SINK_URL` and a `fetch` in
  `src/lib/observability.ts#reportError` — deferred until traffic justifies it.
