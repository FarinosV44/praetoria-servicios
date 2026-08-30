import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

/**
 * SSRF guard for server-side outbound requests (issue #17). Any fetch to a URL
 * that could be influenced by user input (a policy document URL, a webhook, a
 * future provider callback) MUST go through `safeFetch` rather than the global
 * `fetch`. It rejects non-http(s) schemes, private / loopback / link-local /
 * reserved IP targets, and follows redirects manually so each hop is re-checked.
 *
 * v1 has no server-side external fetch (every adapter is mock/dev). This exists
 * so the first real one is safe by default.
 */

export class SsrfBlockedError extends Error {
  constructor(reason: string) {
    super(`Blocked outbound request: ${reason}`);
    this.name = "SsrfBlockedError";
  }
}

/** True for an IP literal that must never be the target of a server-side fetch. */
export function isBlockedAddress(ip: string): boolean {
  const v = isIP(ip);
  if (v === 4) return isBlockedIPv4(ip);
  if (v === 6) return isBlockedIPv6(ip);
  return true; // not a valid IP literal → block
}

function isBlockedIPv4(ip: string): boolean {
  const p = ip.split(".").map(Number);
  if (p.length !== 4 || p.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) return true;
  const [a, b] = p;
  if (a === 0) return true; // "this" network
  if (a === 10) return true; // private
  if (a === 127) return true; // loopback
  if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT 100.64/10
  if (a === 169 && b === 254) return true; // link-local
  if (a === 172 && b >= 16 && b <= 31) return true; // private
  if (a === 192 && b === 168) return true; // private
  if (a === 192 && b === 0) return true; // 192.0.0/24 + 192.0.2/24 (TEST-NET-1)
  if (a === 198 && (b === 18 || b === 19)) return true; // benchmarking
  if (a === 198 && b === 51) return true; // TEST-NET-2 (198.51.100/24)
  if (a === 203 && b === 0) return true; // TEST-NET-3 (203.0.113/24)
  if (a >= 224) return true; // multicast + reserved + broadcast
  return false;
}

function isBlockedIPv6(ip: string): boolean {
  const lower = ip.toLowerCase();
  if (lower === "::1" || lower === "::") return true; // loopback / unspecified
  if (lower.startsWith("fe80")) return true; // link-local
  if (lower.startsWith("fc") || lower.startsWith("fd")) return true; // unique local fc00::/7
  if (lower.startsWith("ff")) return true; // multicast
  // IPv4-mapped (::ffff:a.b.c.d) — check the embedded v4
  const mapped = lower.match(/::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (mapped) return isBlockedIPv4(mapped[1]);
  return false;
}

/** Validate a URL for a server-side fetch. Throws SsrfBlockedError if unsafe. */
export async function assertSafeUrl(raw: string): Promise<URL> {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new SsrfBlockedError("not a valid URL");
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new SsrfBlockedError(`scheme ${url.protocol}`);
  }
  if (url.username || url.password) throw new SsrfBlockedError("credentials in URL");

  const host = url.hostname.replace(/^\[|\]$/g, "");
  if (isIP(host)) {
    if (isBlockedAddress(host)) throw new SsrfBlockedError(`ip ${host}`);
    return url;
  }
  if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".internal")) {
    throw new SsrfBlockedError(`host ${host}`);
  }
  // Resolve and check every A/AAAA record.
  let records: { address: string }[];
  try {
    records = await lookup(host, { all: true });
  } catch {
    throw new SsrfBlockedError(`cannot resolve ${host}`);
  }
  if (records.length === 0) throw new SsrfBlockedError(`no address for ${host}`);
  for (const r of records) {
    if (isBlockedAddress(r.address)) throw new SsrfBlockedError(`resolves to ${r.address}`);
  }
  return url;
}

export type SafeFetchOptions = RequestInit & { maxRedirects?: number; timeoutMs?: number };

/** `fetch` with SSRF checks and manual, re-checked redirects. */
export async function safeFetch(input: string, opts: SafeFetchOptions = {}): Promise<Response> {
  const { maxRedirects = 3, timeoutMs = 10_000, ...init } = opts;
  let current = input;

  for (let hop = 0; hop <= maxRedirects; hop++) {
    const url = await assertSafeUrl(current);
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), timeoutMs);
    let res: Response;
    try {
      res = await fetch(url, { ...init, redirect: "manual", signal: ctl.signal });
    } finally {
      clearTimeout(timer);
    }
    if (res.status >= 300 && res.status < 400 && res.headers.has("location")) {
      if (hop === maxRedirects) throw new SsrfBlockedError("too many redirects");
      current = new URL(res.headers.get("location")!, url).toString();
      continue;
    }
    return res;
  }
  throw new SsrfBlockedError("too many redirects");
}
