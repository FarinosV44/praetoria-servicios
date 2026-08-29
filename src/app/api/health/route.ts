import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { env } from "@/lib/env";

export const dynamic = "force-dynamic";

/**
 * Healthcheck (issue #2). Reports app + database reachability without leaking
 * configuration. Returns 200 when healthy, 503 otherwise.
 */
export async function GET() {
  let dbOk = false;
  try {
    await db.$queryRaw`SELECT 1`;
    dbOk = true;
  } catch {
    dbOk = false;
  }

  const body = {
    status: dbOk ? "ok" : "degraded",
    time: new Date().toISOString(),
    checks: { database: dbOk },
    env: env.NODE_ENV,
  };
  return NextResponse.json(body, { status: dbOk ? 200 : 503 });
}
