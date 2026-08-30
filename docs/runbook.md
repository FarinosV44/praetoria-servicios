# Runbook — Praetoria Servicios

Incident response for the production deployment. Pair with `docs/deploy-hostinger.md` (deploy
mechanics) and `docs/threat-model.md` (what is and isn't defended).

## At a glance

| Symptom | First check | Section |
|---|---|---|
| Site down / 5xx everywhere | `GET /api/health` | [The app is down](#the-app-is-down) |
| `/api/health` → 503 | database reachability | [Database](#database-unreachable) |
| Assistant stuck on the spinner | browser console for CSP / hydration errors | [Hydration / CSP](#hydration--csp) |
| Emails not arriving | the cron job + the pending queue | [Email queue](#email-queue-stuck) |
| A client can't open their status link | link expiry / revocation | [Signed links](#a-signed-link-does-not-open) |
| Admin locked out | session cookie / `AUTH_SECRET` | [Admin access](#admin-cannot-log-in) |
| Disk filling up | blob dir + logs | [Disk](#disk-filling-up) |
| Slow / costly AI calls | the `ai.call` metric log | [AI latency & cost](#ai-latency--cost) |

## Logs

The app logs **single-line JSON** to stdout. Fields are PII-redacted (`src/lib/logging.ts`): phone,
email, name, address, problem text, policy text and photo references are never emitted.

- Where: hPanel Node app-manager log, or the process manager's log (`~/.pm2/logs/*` etc.).
- Verbose mode: set `DEBUG_LOGS=1` in `.env` and restart — captures `debug` lines. **Turn it back
  off** afterwards (it is noisier, not less safe).
- Useful greps:
  - `grep '"level":"error"'` — everything unexpected. `reportError` writes `"msg":"unhandled error"` with `component`, `errType`, `errMessage` and a 4-frame stack.
  - `grep '"msg":"ai.call"'` — one line per AI provider call: `operation`, `outcome`, `durationMs`, `promptVersion` (+ `inputTokens`/`outputTokens`/`costMicros` when a real provider returns usage).
  - `grep '"msg":"retention job ran"'` — the cron heartbeat with its counts.
  - `grep '"msg":"analysis provider error"'` — the AI adapter failed and the request fell back to human review.

Ask a user to reproduce with the browser console open and paste the `[global-error]` /
`[analytics]` lines — those are the client-side surface.

## The app is down

1. `curl -sS -D - https://<domain>/api/health` — no response → the Node process is not running or
   the port is wrong.
2. Check the app-manager: is the process up? Restart it. Read the last ~50 log lines for the crash.
3. Common causes:
   - **Missing production build** — `next start` prints "Could not find a production build". Run `npm run build` then restart.
   - **Bad env** — `[env] Invalid environment configuration: …` on boot. Fix the named var in `.env`. (A blank optional URL var counts as invalid — L-002.)
   - **`AUTH_SECRET` / `SIGNED_LINK_SECRET` too short** — must be ≥ 16 chars.
4. If the last deploy caused it → [Rollback](#rollback).

## Database unreachable

- `/api/health` → 503 `{checks:{database:false}}`.
- Check `DATABASE_URL`, the Postgres host status in hPanel, and the connection limit (Prisma pools;
  a runaway or a second instance can exhaust it).
- The app does not crash on a DB blip — pages that need the DB error, `/` and static content still
  serve. It recovers on its own when the DB returns.
- **Never** rotate `SIGNED_LINK_SECRET` / `AUTH_SECRET` to "fix" a DB problem — it invalidates every
  live client link and admin session and fixes nothing here.

## Hydration / CSP

Symptom: pages render but nothing is interactive; `/solicitar` never leaves the spinner; console
shows `Minified React error #412` on every page.

- Cause is almost always the CSP nonce not reaching the inline scripts (issue #29 / L-004).
- Check `curl -sS -D - https://<domain>/ | grep -i content-security-policy` — `script-src` must
  contain `'nonce-…'` and `'strict-dynamic'`, and the response must carry an `x-nonce` header.
- If a CDN / proxy is in front: it is stripping the header or **caching the HTML** (one viewer's
  nonce served to everyone). Disable HTML caching; cache only `/_next/static/*`.
- `src/proxy.ts` owns the CSP. `src/proxy.test.ts` pins the mechanism — run it if in doubt.

## Email queue stuck

- Communications are enqueued, not sent inline. The cron drains them (`communicationService.sendPending`).
- Check the cron is actually firing: `grep '"msg":"retention job ran"'` — the `emailsSent` /
  `emailsFailed` counts are in the line. No lines → the hPanel cron is not running or the
  `CRON_SECRET` is wrong (endpoint returns 401 silently).
- A message that failed all retries stays `FAILED` with the request untouched (AC-13-nolost) — it is
  not lost, it needs a manual re-send from the admin panel or a fix to `SMTP_URL`.
- Manually kick the job: `curl -fsS -X POST -H "Authorization: Bearer <CRON_SECRET>" https://<domain>/api/cron/retention`.

## A signed link does not open

- `/s/<token>` shows "ha caducado" / "ya no es válido" / "no hemos podido abrir".
- Links expire (`ClientLink.expiresAt`) and can be revoked by an admin. Expired/revoked is working
  as designed — the admin regenerates the link (needs the client's phone last-4).
- "No hemos podido abrir" for a link that should be valid → check `SIGNED_LINK_SECRET` has not
  changed since the link was issued. If it was rotated, every prior link is dead; issue new ones.

## Admin cannot log in

- Wrong password → the login page says so and stays put (verified by E2E).
- Correct password, immediate bounce back to login → `AUTH_SECRET` changed (invalidates sessions) or
  the cookie is being stripped (proxy / `Secure` on plain HTTP).
- Lost the only admin password → create a new admin row with a fresh scrypt hash
  (`src/lib/password.ts`), same procedure as the first-admin step in the deploy doc.
- **PATH note:** if `git`/`gh` credential prompts loop on the box, check `/usr/bin` is on `PATH`
  before touching any token (keychain lookups fail silently otherwise).

## Disk filling up

- **Blob directory** (`STORAGE_FS_DIR`): photos + encrypted insurance docs. The cron purges
  insurance docs 90 days after the request closes and deletes photos of stale unsent drafts. If it
  is not running, nothing is cleaned — fix the cron first.
- **Logs**: rotate them (app-manager setting or `logrotate`). `DEBUG_LOGS=1` left on will fill a
  disk faster than anything else.

## AI latency & cost

- Every provider call logs `"msg":"ai.call"` with `durationMs` and `outcome`.
- `outcome:"timeout"` / `outcome:"provider"` / `outcome:"exception"` → the request degraded to human
  review (the client sees a calm "lo revisa una persona" message, never an error).
- With a real provider (`AI_ADAPTER=claude`), `inputTokens`/`outputTokens`/`costMicros` land in the
  same line — sum `costMicros` over a day for the spend. A sudden climb in `durationMs` or token
  counts usually means an oversized photo or a prompt-injection attempt in the problem text
  (the output is still schema-validated before it is stored).

## Rollback

1. Stop the current app.
2. Check out the previous release: `git checkout <previous-tag-or-commit>` (or switch the
   release symlink / directory).
3. `npm ci && npm run build` for that revision.
4. **Database:** if the bad release ran a migration, restore the pre-deploy snapshot. If it only
   added nullable columns / new tables, the old code ignores them — no DB rollback needed. This is
   why migrations ship additively (see the deploy doc's "Safe migrations").
5. Start the app. `curl /api/health`. Walk `/solicitar` once.
6. Record what happened in `docs/lessons-learned.md` and open a forge issue.

## Escalation

- Data loss, a suspected breach, payment/live-customer impact → stop, do not "patch quietly"
  (`docs/threat-model.md`), and get the operator on the line.
- Three failed fix attempts at the same thing → stop and write down what was tried before the next
  attempt (standing three-attempt rule).
