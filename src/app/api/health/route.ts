import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { env } from "@/lib/env";

export const dynamic = "force-dynamic";

/**
 * Healthcheck (issue #2). Reports app + database reachability + whether the
 * migrations have been applied, without leaking configuration. 200 when the DB
 * is reachable AND migrated, 503 otherwise — so a deploy that "came up" but
 * can't serve any DB-backed page has one clear place to look.
 */
export async function GET() {
  let dbReachable = false;
  let migrated = false;
  let detail: string | undefined;

  try {
    await db.$queryRaw`SELECT 1`;
    dbReachable = true;
  } catch (e) {
    detail = e instanceof Error ? e.message.split("\n")[0] : "database unreachable";
  }

  if (dbReachable) {
    try {
      // `_prisma_migrations` exists once `prisma migrate deploy` has run at least once.
      const rows = await db.$queryRaw<{ n: bigint }[]>`
        SELECT count(*)::bigint AS n FROM "_prisma_migrations" WHERE finished_at IS NOT NULL
      `;
      migrated = Number(rows[0]?.n ?? 0) > 0;
      if (!migrated) detail = "database reachable but no migrations applied — run `prisma migrate deploy`";
    } catch {
      detail = "database reachable but `_prisma_migrations` is missing — run `prisma migrate deploy`";
    }
  }

  const ok = dbReachable && migrated;
  return NextResponse.json(
    {
      status: ok ? "ok" : "degraded",
      time: new Date().toISOString(),
      checks: { database: dbReachable, migrations: migrated },
      env: env.NODE_ENV,
      ...(detail ? { detail } : {}),
    },
    { status: ok ? 200 : 503 },
  );
}
