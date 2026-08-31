import type { NextConfig } from "next";

/**
 * Static security headers (issue #17). Applied to every response.
 *
 * The Content-Security-Policy is NOT here — it needs a per-request nonce for
 * Next's inline hydration scripts (issue #29) and so lives in `src/proxy.ts`.
 * `'unsafe-eval'` for dev and the nonce/`'strict-dynamic'` machinery are all in
 * the proxy; everything below is request-independent.
 */
const SECURITY_HEADERS = [
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=(), payment=()",
  },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "X-DNS-Prefetch-Control", value: "off" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,

  // Self-contained server for constrained / Passenger-style hosting (Hostinger).
  // `next build` produces `.next/standalone/server.js` with only the traced
  // runtime deps — no full `node_modules` on the server, far less RAM. The build
  // can run in CI and only the bundle is shipped. See docs/deploy-hostinger.md.
  output: "standalone",

  // File tracing misses Prisma's native query-engine binary — pull it in
  // explicitly so the standalone bundle can reach the database.
  outputFileTracingIncludes: {
    "/**": ["./node_modules/.prisma/client/**", "./node_modules/@prisma/engines/**"],
  },

  async headers() {
    return [{ source: "/:path*", headers: SECURITY_HEADERS }];
  },
};

export default nextConfig;
