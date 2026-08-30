import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { proxy } from "./proxy";

/**
 * Reproduction for issue #29: the strict CSP from #17 has no nonce, so Next's
 * inline hydration scripts are blocked and React never hydrates. The proxy must
 * emit a per-request nonce and a `script-src` that carries it.
 */

function run(path: string, headers?: Record<string, string>) {
  return proxy(new NextRequest(`http://localhost:3000${path}`, { headers }));
}

describe("proxy — CSP nonce (issue #29)", () => {
  it("emits a Content-Security-Policy with a script-src nonce, not a bare 'self'", () => {
    const res = run("/servicios/pintura");
    const csp = res.headers.get("content-security-policy");
    expect(csp).toBeTruthy();
    const scriptSrc = csp!.split(";").find((d) => d.trim().startsWith("script-src"))!;
    expect(scriptSrc).toMatch(/'nonce-[A-Za-z0-9+/=]+'/);
    expect(scriptSrc).toContain("'strict-dynamic'");
    // the exact failure mode of #29: script-src with only 'self'
    expect(scriptSrc.trim()).not.toBe("script-src 'self'");
  });

  it("still forbids 'unsafe-inline' in script-src", () => {
    const csp = run("/").headers.get("content-security-policy")!;
    const scriptSrc = csp.split(";").find((d) => d.trim().startsWith("script-src"))!;
    expect(scriptSrc).not.toContain("'unsafe-inline'");
  });

  it("generates a different nonce per request", () => {
    const a = run("/").headers.get("content-security-policy")!;
    const b = run("/").headers.get("content-security-policy")!;
    const nonceOf = (csp: string) => csp.match(/'nonce-([A-Za-z0-9+/=]+)'/)?.[1];
    expect(nonceOf(a)).toBeTruthy();
    expect(nonceOf(a)).not.toBe(nonceOf(b));
  });

  it("exposes the nonce for the renderer via the x-nonce request header", () => {
    const res = run("/");
    // NextResponse.next({ request: { headers } }) surfaces overridden request
    // headers on this response header for the downstream render.
    expect(res.headers.get("x-middleware-request-x-nonce") ?? res.headers.get("x-nonce")).toMatch(
      /^[A-Za-z0-9+/=]+$/,
    );
  });

  it("keeps the /admin cookie gate: no cookie redirects to the login page", () => {
    const res = run("/admin/solicitudes");
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("/admin/login");
  });

  it("does not redirect a normal marketing route", () => {
    const res = run("/cobertura");
    expect(res.status).not.toBe(307);
    expect(res.headers.get("content-security-policy")).toBeTruthy();
  });
});
