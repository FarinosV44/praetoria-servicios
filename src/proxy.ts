import { NextRequest, NextResponse } from "next/server";

/**
 * Edge proxy (Next 16's renamed middleware). Two jobs:
 *
 * 1. **Per-request CSP nonce (issue #29).** The strict CSP lives here, not in
 *    `next.config.ts`, because Next emits inline bootstrap/hydration scripts that
 *    a `script-src 'self'` without a nonce blocks — which stops React hydrating
 *    the whole app. A fresh nonce per request is injected into `script-src` and
 *    surfaced as `x-nonce`; Next then applies it to its own scripts automatically.
 *    (This makes pages dynamically rendered — acceptable for this app.)
 *
 * 2. **A cheap first gate on `/admin`:** no cookie (or an expired one) → redirect
 *    to the login page. The REAL authorization — HMAC signature + DB lookup +
 *    per-resource checks — runs in the Node runtime in the `/admin` layout and
 *    every admin server action (`requireSession`). Defence in depth, never route-only.
 */

const isDev = process.env.NODE_ENV !== "production";

function buildCsp(nonce: string): string {
  return [
    "default-src 'self'",
    // 'strict-dynamic' lets the nonce'd loader pull the rest of Next's chunks;
    // 'self' is kept as a fallback for browsers that ignore 'strict-dynamic'.
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ""}`,
    // Next injects runtime styles inline; nonce-ing them is unreliable, so
    // 'unsafe-inline' stays for styles only (never for scripts).
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self'",
    "connect-src 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "object-src 'none'",
    "upgrade-insecure-requests",
  ].join("; ");
}

export function proxy(req: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const csp = buildCsp(nonce);

  const { pathname } = req.nextUrl;
  const isAdmin = pathname.startsWith("/admin") && pathname !== "/admin/login";

  if (isAdmin) {
    const token = req.cookies.get("praetoria_admin")?.value;
    const exp = token ? Number(token.split(".")[1]) : NaN;
    const looksValid = !!token && Number.isFinite(exp) && Date.now() <= exp;
    if (!looksValid) {
      const url = req.nextUrl.clone();
      url.pathname = "/admin/login";
      url.searchParams.set("next", pathname);
      const redirect = NextResponse.redirect(url);
      redirect.headers.set("Content-Security-Policy", csp);
      return redirect;
    }
  }

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  const res = NextResponse.next({ request: { headers: requestHeaders } });
  res.headers.set("Content-Security-Policy", csp);
  res.headers.set("x-nonce", nonce);
  return res;
}

export const config = {
  // All routes except static assets, the image optimizer, API routes and the
  // generated metadata files (non-HTML — they need no CSP nonce).
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|icon|sitemap.xml|robots.txt|manifest.webmanifest).*)",
  ],
};
