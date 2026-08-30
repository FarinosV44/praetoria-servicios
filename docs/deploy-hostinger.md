# Deploy — Hostinger hPanel (Node.js hosting)

> Provisional. Finalised in issue #19 (E2E + observability + deploy). The exact
> access method (git-pull + restart vs deploy webhook) and where Postgres lives
> are still to be confirmed with the operator.

## What runs

- A single Next.js 16 Node process (`npm run start`, listens on the port hPanel assigns via `PORT`).
- PostgreSQL 16 — either hPanel's managed database or an external managed Postgres. `DATABASE_URL` points at it.
- No separate worker: the retention/queue job is an HTTP endpoint hit by hPanel's cron.

## First deploy

1. **Push `main`** (this repo). On the server, clone or pull `main`.
2. `npm ci` (production install is fine; `prisma` CLI is a devDependency and IS needed for migrations — use `npm ci` without `--omit=dev` on the box that runs migrations, or run migrations from CI).
3. Create `.env` from `.env.example` and set:
   - `NODE_ENV=production`
   - `APP_URL=https://<your-domain>` (used for canonical URLs, signed-link URLs and the CSRF Origin check — must match exactly)
   - `DATABASE_URL=postgresql://…`
   - `AUTH_SECRET=` (32+ random chars — `openssl rand -base64 32`)
   - `SIGNED_LINK_SECRET=` (32+ random chars, different from AUTH_SECRET)
   - `CRON_SECRET=` (32+ random chars — enables `/api/cron/retention`)
   - `EMAIL_ADAPTER=smtp` + `SMTP_URL=…` + `EMAIL_FROM="Praetoria Servicios <no-reply@your-domain>"` (or leave `console` until email is wired)
   - `WHATSAPP_BUSINESS_NUMBER=` (E.164 without `+`)
   - `STORAGE_ADAPTER=fs` + `STORAGE_FS_DIR=/home/<user>/praetoria-storage` (a path OUTSIDE the web root and OUTSIDE the repo) — or `s3` with the S3_* vars
   - `AI_ADAPTER=mock` until an Anthropic key is added (`AI_ADAPTER=claude` + `ANTHROPIC_API_KEY=…`)
   - `OCR_ADAPTER=mock` until a real OCR is chosen
4. `npx prisma migrate deploy`
5. `npx tsx prisma/seed.ts` creates a dev admin — **do not run in production**. Instead create the
   first admin with a one-off script or SQL insert using `src/lib/password.ts`'s scrypt format.
6. `npm run build`
7. Start the app (hPanel's Node.js app manager, or `npm run start` under a process manager).

## Redeploy

- git pull `main` → `npm ci` → `npx prisma migrate deploy` → `npm run build` → restart the Node app.
- If hPanel offers a deploy webhook, point it at this sequence.

## Cron — retention + email queue

Add an hPanel cron job (every 10-15 min is plenty):

```
*/15 * * * * curl -fsS -X POST -H "Authorization: Bearer $CRON_SECRET" https://<your-domain>/api/cron/retention >/dev/null 2>&1
```

It: deletes stale unsent drafts (+ photo blobs), expires stale quotes, drains the pending email
queue with bounded retries, and purges insurance cases whose request closed > 90 days ago
(`LIMITS.insuranceDocs.retentionDaysAfterClose`). Idempotent — safe to run often.

## Backups

Hostinger managed Postgres: enable automatic daily snapshots in hPanel. If self-managed, a nightly
`pg_dump` to off-box storage. The blob directory (`STORAGE_FS_DIR`) must be backed up too — it holds
photos and (encrypted) insurance documents. Test a restore before go-live (release gate, #19).

## Security headers

Served by the app (`next.config.ts`). If a reverse proxy / CDN sits in front, make sure it does not
strip `Content-Security-Policy`, `Strict-Transport-Security`, etc., and that it forwards the real
`Origin`/`Host` so the CSRF check keeps working.

## Health

`GET /api/health` → `{ status: "ok", checks: { database: true } }`. Wire hPanel's uptime monitor (or
an external one) to it.
