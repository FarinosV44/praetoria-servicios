import { env } from "./env";

/**
 * Small HTTP helpers for route handlers (issue #6, #17).
 * Server actions have built-in CSRF protection; route handlers do not, so
 * mutating routes check the Origin against APP_URL.
 */

export function isSameOrigin(req: Request): boolean {
  const origin = req.headers.get("origin");
  if (!origin) {
    // No Origin header (e.g. same-origin GET, some fetch cases) — fall back to Referer.
    const referer = req.headers.get("referer");
    if (!referer) return false;
    try {
      return new URL(referer).origin === new URL(env.APP_URL).origin;
    } catch {
      return false;
    }
  }
  try {
    return new URL(origin).origin === new URL(env.APP_URL).origin;
  } catch {
    return false;
  }
}

export function clientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]!.trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}
