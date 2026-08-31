import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Healthcheck (issue #2) + deploy diagnostics.
 *
 * Deliberately imports nothing at module scope that touches `env` or `db` — a
 * misconfigured env makes `src/lib/env.ts` throw on load, and this endpoint must
 * still answer so the problem is visible with one `curl` instead of host logs.
 * Everything is loaded lazily inside the handler and wrapped in try/catch.
 *
 * 200  → env valid, DB reachable, migrations applied
 * 503  → env valid but DB unreachable / not migrated  (see `detail`)
 * 500  → env invalid  (see `envErrors` — variable names + reasons, never values)
 */
export async function GET() {
  // 1. Environment — the #1 cause of "500 on every route".
  let envOk = false;
  let envErrors: string[] | undefined;
  try {
    const { envDiagnostics } = await import("@/lib/env");
    const d = envDiagnostics();
    if (d.ok) {
      envOk = true;
    } else {
      envErrors = d.fields;
    }
  } catch (e) {
    envErrors = [e instanceof Error ? e.message : String(e)];
  }

  if (!envOk) {
    return NextResponse.json(
      {
        status: "misconfigured",
        time: new Date().toISOString(),
        checks: { env: false },
        envErrors,
        hint: "Fix these environment variables in the host panel and redeploy. Only DATABASE_URL, and (in production) AUTH_SECRET + SIGNED_LINK_SECRET, are hard requirements; AUTH_SECRET / SIGNED_LINK_SECRET must be 16+ characters; APP_URL must be a full https:// URL.",
      },
      { status: 500 },
    );
  }

  // 2. Database + migrations.
  let dbReachable = false;
  let migrated = false;
  let detail: string | undefined;

  try {
    const { db } = await import("@/lib/db");
    await db.$queryRaw`SELECT 1`;
    dbReachable = true;
    try {
      const rows = await db.$queryRaw<{ n: bigint }[]>`
        SELECT count(*)::bigint AS n FROM "_prisma_migrations" WHERE finished_at IS NOT NULL
      `;
      migrated = Number(rows[0]?.n ?? 0) > 0;
      if (!migrated) detail = "database reachable but no migrations applied — run `prisma migrate deploy`";
    } catch {
      detail = "database reachable but `_prisma_migrations` is missing — run `prisma migrate deploy`";
    }
  } catch (e) {
    detail = e instanceof Error ? e.message.split("\n")[0] : "database unreachable";
  }

  const ok = dbReachable && migrated;
  return NextResponse.json(
    {
      status: ok ? "ok" : "degraded",
      time: new Date().toISOString(),
      checks: { env: true, database: dbReachable, migrations: migrated },
      ...(detail ? { detail } : {}),
    },
    { status: ok ? 200 : 503 },
  );
}
