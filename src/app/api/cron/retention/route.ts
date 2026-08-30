import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { env } from "@/lib/env";
import { log } from "@/lib/logging";
import { reportError } from "@/lib/observability";
import { requestService } from "@/server/services/requests";
import { quoteService } from "@/server/services/quotes";
import { communicationService } from "@/server/services/communications";
import { insuranceService } from "@/server/services/insurance";
import { professionalService } from "@/server/services/professionals";
import { contentService } from "@/server/services/content";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Retention + queue job (issue #17). Run on a schedule (hPanel cron):
 *   curl -fsS -X POST -H "Authorization: Bearer $CRON_SECRET" https://<host>/api/cron/retention
 *
 * - deletes stale, never-submitted drafts (+ their photo blobs)
 * - expires sent quotes past their validity
 * - drains the pending email queue with bounded retries
 * - purges insurance cases whose request closed long ago
 *
 * Idempotent: safe to run more often than needed.
 */
function authorized(req: Request): boolean {
  const expected = env.CRON_SECRET;
  if (!expected) return false;
  const header = req.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  const a = Buffer.from(token);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const started = Date.now();
  try {
    const result = {
      expiredDrafts: await requestService.deleteExpiredDrafts(),
      expiredQuotes: await quoteService.expireStale(),
      emailsSent: 0,
      emailsFailed: 0,
      insuranceCasesPurged: await insuranceService.purgeExpired(),
      professionalDocsPurged: await professionalService.purgeRejectedDocuments(),
      articlesPublished: await contentService.publishDue(),
    };
    const queue = await communicationService.sendPending();
    result.emailsSent = queue.sent;
    result.emailsFailed = queue.failed;

    const ms = Date.now() - started;
    log.info("retention job ran", { ...result, ms });
    return NextResponse.json({ ok: true, ...result, ms });
  } catch (e) {
    reportError(e, { component: "api/cron/retention", action: "run", ms: Date.now() - started });
    return NextResponse.json({ ok: false, error: "job failed" }, { status: 500 });
  }
}
