import { NextRequest, NextResponse } from "next/server";

/**
 * Edge proxy (Next 16's renamed middleware). A cheap first gate on /admin:
 * no cookie (or an expired one) → redirect to the login page. The REAL
 * authorization — HMAC signature check + DB lookup + per-resource checks — runs
 * in the Node runtime in the /admin layout and every admin server action
 * (`requireSession`). Defence in depth, never route-only.
 */
export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (!pathname.startsWith("/admin") || pathname === "/admin/login") {
    return NextResponse.next();
  }

  const token = req.cookies.get("praetoria_admin")?.value;
  const exp = token ? Number(token.split(".")[1]) : NaN;
  const looksValid = !!token && Number.isFinite(exp) && Date.now() <= exp;

  if (!looksValid) {
    const url = req.nextUrl.clone();
    url.pathname = "/admin/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
