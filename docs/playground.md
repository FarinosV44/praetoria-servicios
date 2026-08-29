# Playground — how to try Praetoria Servicios locally

A disposable local environment for exercising the real flows. All credentials here are local and
throwaway — never production secrets.

## Stand it up

```bash
docker compose up -d          # PostgreSQL on localhost:5432
cp .env.example .env          # defaults are fine for local
npm run db:migrate
npm run db:seed
npm run dev
```

Open http://localhost:3000.

## Accounts

| Where | User | Password |
|---|---|---|
| Admin panel (`/admin`, available from issue #11) | `admin@praetoria.local` | `praetoria-dev` |

Clients have no accounts — they use the assistant and a signed status link.

## What works today (updated as issues land)

- `/` — temporary landing with the real CTAs
- `GET /api/health` — app + database healthcheck
- Design system primitives (`src/ui`)
- Domain logic: request state machine, money, Spanish phone, signed links, coverage check (unit-tested)

## Adapters in the playground

Mock/dev by default: AI analysis returns deterministic canned results, storage writes to `.storage/`,
email is logged to the console, WhatsApp produces a `wa.me` link. Nothing calls the internet.

To try the real Anthropic analysis: set `AI_ADAPTER=claude` and `ANTHROPIC_API_KEY=...` in `.env`
(available once issue #7's Claude adapter lands).

## Reset

```bash
docker compose down -v        # wipes the database volume
rm -rf .storage               # wipes local uploads
```
