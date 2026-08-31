# Deploy — Hostinger hPanel (Node.js hosting)

> Finalised in issue #19. What still needs the operator: hPanel access, where
> Postgres lives (hPanel managed vs external), and the real secret values. The
> steps below are complete and tested against a local production build.

## What runs

- A single Next.js 16 Node process (`npm run start`, listens on the port hPanel assigns via `PORT`).
  **Every route is server-rendered** (no static export — the CSP nonce needs a dynamic render, D-014).
- PostgreSQL 16 — hPanel's managed database or an external managed Postgres. `DATABASE_URL` points at it.
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
2. `npm ci` — the `prisma` CLI is a devDependency and IS needed for migrations; run `npm ci` (not `--omit=dev`) on the box that runs them, or run migrations from CI.
3. Create `.env` (table above). Double-check `APP_URL` before the build.
4. `npx prisma migrate deploy` — see **Safe migrations** below.
5. **Create the first admin** — do NOT run `prisma/seed.ts` in production (it seeds a known dev password). Insert one row into `AdminUser` with a scrypt hash produced by `src/lib/password.ts` (`hashPassword`), e.g. a one-off `npx tsx` script that prints the hash for a password you choose, then a single SQL `INSERT`.
6. `npm run build` (with `APP_URL` and any `NEXT_PUBLIC_*` set).
7. Start the app via hPanel's Node.js app manager.
8. Smoke: `curl -sSf https://<domain>/api/health` → `{"status":"ok","checks":{"database":true}}`; open `/`, `/solicitar` (the assistant must load past its spinner), `/servicios/fontaneria`, `/cobertura`.

## Redeploy

```
git pull origin main
npm ci
npx prisma migrate deploy          # safe: see below
npm run build                      # APP_URL must be in the environment
# restart the Node app (hPanel app manager or the process manager)
```

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
