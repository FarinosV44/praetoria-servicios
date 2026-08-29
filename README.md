# Praetoria Servicios

Mobile-first Spanish web app for the Valencia area: a resident describes a home problem with photos
and plain language, AI turns it into a technical brief and proposes the right trade, and an admin
responds with a quote and a timeframe within 24 working hours. An optional branch analyses a
home-insurance policy for orientative coverage and produces a reviewable legal draft.

Built with **Next.js 16** (App Router), **TypeScript** (strict), **Tailwind v4**, **PostgreSQL +
Prisma**. Every external provider (AI, storage, email, WhatsApp, OCR) is behind an adapter with a
mock/dev implementation, so the whole app runs with **no external accounts**.

## Requirements

- Node.js ≥ 20 (developed on 24)
- Docker (for the local PostgreSQL) — or any reachable PostgreSQL 16
- npm

## Getting started

```bash
git clone https://github.com/FarinosV44/praetoria-servicios.git
cd praetoria-servicios
npm install

cp .env.example .env
# The defaults work as-is for local development (mock AI, filesystem storage,
# console email, WhatsApp links). Fill AUTH_SECRET / SIGNED_LINK_SECRET with
#   openssl rand -base64 32

docker compose up -d          # starts PostgreSQL on :5432
npm run db:migrate            # creates the schema from prisma/migrations
npm run db:seed               # synthetic data: 1 admin + sample requests

npm run dev                   # http://localhost:3000
```

Seeded admin (development only): `admin@praetoria.local` / `praetoria-dev`.

## Scripts

| Script | Purpose |
|---|---|
| `npm run dev` | Next.js dev server |
| `npm run build` / `npm start` | production build / serve |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Vitest unit/integration suite |
| `npm run verify` | lint + typecheck + test + build (the CI gate) |
| `npm run db:migrate` | apply migrations in development |
| `npm run db:deploy` | apply migrations in production (`prisma migrate deploy`) |
| `npm run db:seed` | seed synthetic data (refuses `NODE_ENV=production`) |
| `npm run db:studio` | Prisma Studio |
| `npm run format` | Prettier |

## Configuration

All configuration is environment variables — see `.env.example` for the full list and
`src/lib/env.ts` for the validated schema. Nothing (provider keys, coverage area, limits,
recipients, deadlines) is hardcoded. Adapter selection:

| Variable | Values | Dev default |
|---|---|---|
| `AI_ADAPTER` | `mock`, `claude` | `mock` |
| `STORAGE_ADAPTER` | `memory`, `fs`, `s3` | `fs` |
| `EMAIL_ADAPTER` | `memory`, `console`, `smtp` | `console` |
| `WHATSAPP_ADAPTER` | `link`, `provider` | `link` |
| `OCR_ADAPTER` | `mock`, `tesseract`, `cloud` | `mock` |

Real providers (`claude`, `s3`, `smtp`, …) are wired in by their respective GitHub issues; selecting
one before it is implemented fails fast with a clear message rather than degrading silently.

## Architecture

`src/domain` holds pure business logic (no framework imports). `src/adapters` holds provider seams.
`src/server/container.ts` is the composition root — the only place env selectors become concrete
implementations. `src/app` routes stay thin. See `docs/03-technical-plan.md`.

## Deployment

Target: Vercel + a managed PostgreSQL (Neon/Supabase). Set the production env vars (including
`NODE_ENV=production`, real `AUTH_SECRET`, `SIGNED_LINK_SECRET`, and the chosen providers), run
`npm run db:deploy` on release, and deploy. `GET /api/health` reports app + database health.

## Project workflow

This repository follows the **Keel** workflow (`CLAUDE.md` / `AGENTS.md`). Living state is in
`docs/PROGRESS.md`, `docs/decisions.md`, `docs/issues.md`.
