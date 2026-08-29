import { NextResponse } from "next/server";
import { photoService } from "@/server/services/photos";
import { rateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { clientIp, isSameOrigin } from "@/lib/http";
import { LIMITS } from "@/config/limits";
import { log } from "@/lib/logging";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * POST /api/uploads — attach one photo to a request (issue #6).
 * multipart/form-data: requestId, file, hint?
 * A failed upload never affects the others (the client uploads one at a time).
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

  const requestId = form.get("requestId");
  const hint = form.get("hint");
  const file = form.get("file");

  if (typeof requestId !== "string" || !(file instanceof File)) {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }
  if (file.size > LIMITS.photos.maxBytes) {
    return NextResponse.json({ error: "too_large" }, { status: 413 });
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const result = await photoService.add({
    requestId,
    bytes,
    declaredType: file.type,
    size: file.size,
    hint: typeof hint === "string" && hint ? hint : undefined,
  });

  if (!result.ok) {
    const e = result.error;
    if (e.kind === "request_not_found") {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }
    if (e.kind === "request_locked") {
      return NextResponse.json({ error: "request_locked" }, { status: 409 });
    }
    return NextResponse.json({ error: e.code, message: e.message }, { status: 422 });
  }

  log.debug("upload accepted", { requestId });
  return NextResponse.json(result.value, { status: 201 });
}
