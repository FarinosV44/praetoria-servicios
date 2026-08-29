import { NextRequest, NextResponse } from "next/server";
import { getAdapters } from "@/server/container";
import { verifyFsSignature } from "@/adapters/storage/fs";
import { env } from "@/lib/env";

export const dynamic = "force-dynamic";

/**
 * Signed download endpoint for the filesystem storage adapter (dev).
 * Files are never web-served directly from disk — every access is verified here.
 * The S3 adapter (issue #6) issues provider-native signed URLs and bypasses this.
 */
export async function GET(req: NextRequest, ctx: { params: Promise<{ key: string[] }> }) {
  if (env.STORAGE_ADAPTER !== "fs") {
    return new NextResponse("Not found", { status: 404 });
  }
  const { key: segments } = await ctx.params;
  const key = segments.join("/");
  const exp = Number(req.nextUrl.searchParams.get("exp"));
  const sig = req.nextUrl.searchParams.get("sig") ?? "";

  if (!verifyFsSignature(key, exp, sig)) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const data = await getAdapters().storage.get(key);
  if (!data) return new NextResponse("Not found", { status: 404 });

  return new NextResponse(Buffer.from(data), {
    status: 200,
    headers: {
      "Content-Type": "application/octet-stream",
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
