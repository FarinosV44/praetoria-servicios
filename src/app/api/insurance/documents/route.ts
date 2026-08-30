import { NextResponse } from "next/server";
import { insuranceService } from "@/server/services/insurance";
import { clientLinkService } from "@/server/services/clientLink";
import { requireSession } from "@/server/auth";
import { rateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { clientIp, isSameOrigin } from "@/lib/http";
import { LIMITS } from "@/config/limits";
import { log } from "@/lib/logging";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * POST /api/insurance/documents — attach one insurance policy document (issue #14).
 * multipart/form-data: file, kind, and one of { token } (signed client link) or
 * { reference } (admin session). The specific INSURANCE_DOC_ANALYSIS consent is
 * enforced by the service.
 */
export async function POST(req: Request) {
  if (!isSameOrigin(req)) {
    return NextResponse.json({ error: "forbidden_origin" }, { status: 403 });
  }
  const gate = rateLimit(`upload:${clientIp(req)}`, RATE_LIMITS.upload);
  if (!gate.ok) {
    return NextResponse.json(
      { error: "rate_limited" },
      { status: 429, headers: { "Retry-After": String(Math.ceil(gate.retryAfterMs / 1000)) } },
    );
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const token = form.get("token");
  const reference = form.get("reference");
  const kind = form.get("kind");
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }
  if (file.size > LIMITS.insuranceDocs.maxBytes) {
    return NextResponse.json({ error: "too_large" }, { status: 413 });
  }

  let requestId: string;
  if (typeof token === "string" && token) {
    const link = await clientLinkService.resolve(token);
    if (!link.ok) return NextResponse.json({ error: "not_found" }, { status: 404 });
    requestId = link.value.requestId;
  } else if (typeof reference === "string" && reference) {
    await requireSession(); // admin only
    const { db } = await import("@/lib/db");
    const r = await db.request.findUnique({ where: { reference }, select: { id: true } });
    if (!r) return NextResponse.json({ error: "not_found" }, { status: 404 });
    requestId = r.id;
  } else {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const result = await insuranceService.addDocument({
    requestId,
    bytes,
    size: file.size,
    kind: typeof kind === "string" ? kind : "otro",
  });
  if (!result.ok) {
    if (result.error.kind === "consent_required") {
      return NextResponse.json({ error: "consent_required" }, { status: 409 });
    }
    if (result.error.kind === "request_not_found") {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }
    if (result.error.kind === "rejected") {
      return NextResponse.json(
        { error: result.error.code, message: result.error.message },
        { status: 422 },
      );
    }
    return NextResponse.json({ error: "error" }, { status: 500 });
  }

  // Re-run the tentative extraction so the client immediately sees the result.
  await insuranceService.analyze(requestId);
  log.debug("insurance document accepted", { requestId });
  return NextResponse.json(result.value, { status: 201 });
}
