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

## L-002 — Empty-string env vars fail Zod `.optional()` URL fields
- Symptom: dev server 500 on every route: `[env] Invalid environment configuration: S3_ENDPOINT: Invalid URL`, even though S3 is unused.
- Cause: `.env.example` ships `S3_ENDPOINT=` (blank). `z.string().url().optional()` accepts `undefined`, not `""` — a blank env var is a present, invalid value.
- Fix: `load()` maps every `""` env value to `undefined` before `schema.safeParse`.
- Where: `src/lib/env.ts`, session 2.
- Check added: covered by the env schema itself now; a future env-var added as blank in `.env.example` is handled automatically.
- Rule for next time: when adding an optional env var with a format constraint (`.url()`, `.email()`), the blank-to-undefined normalisation in `load()` already covers it — do not add `.or(z.literal(""))` per field.
