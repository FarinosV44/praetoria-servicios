import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { newOpaqueToken } from "./id";
import { env } from "./env";

/**
 * Signed, expiring, revocable client status links (issue #16).
 * "Enlace firmado, aleatorio, revocable y con caducidad configurable."
 * "Identificadores secuenciales no sirven para acceder."
 *
 * The raw token is given to the client once (in the link). Only its SHA-256
 * hash is stored (ClientLink.tokenHash), so a database read never yields a
 * working link. The token payload carries the request id + expiry, HMAC-signed,
 * so a tampered link fails before any DB lookup.
 */

function secret(): string {
  return (
    env.SIGNED_LINK_SECRET ??
    (env.NODE_ENV === "production" ? "" : "dev-insecure-signed-link-secret")
  );
}

export interface IssuedLink {
  /** goes in the URL — never stored */
  token: string;
  /** stored in ClientLink.tokenHash */
  tokenHash: string;
  expiresAt: Date;
}

export function issueClientLink(requestId: string, ttlHours: number): IssuedLink {
  const s = secret();
  if (!s) throw new Error("SIGNED_LINK_SECRET is not configured");
  const nonce = newOpaqueToken();
  const exp = Date.now() + ttlHours * 3600_000;
  const payload = `${requestId}.${exp}.${nonce}`;
  const sig = createHmac("sha256", s).update(payload).digest("base64url");
  const token = `${Buffer.from(payload).toString("base64url")}.${sig}`;
  return { token, tokenHash: hashToken(token), expiresAt: new Date(exp) };
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export type LinkParseResult =
  | { ok: true; requestId: string; expiresAt: Date; tokenHash: string }
  | { ok: false; reason: "malformed" | "bad_signature" | "expired" | "not_configured" };

export function parseClientLink(token: string): LinkParseResult {
  const s = secret();
  if (!s) return { ok: false, reason: "not_configured" };

  const parts = token.split(".");
  if (parts.length !== 2) return { ok: false, reason: "malformed" };
  const [payloadB64, sig] = parts;

  let payload: string;
  try {
    payload = Buffer.from(payloadB64, "base64url").toString("utf8");
  } catch {
    return { ok: false, reason: "malformed" };
  }
  const segs = payload.split(".");
  if (segs.length !== 3) return { ok: false, reason: "malformed" };
  const [requestId, expStr] = segs;
  const exp = Number(expStr);
  if (!requestId || !Number.isFinite(exp)) return { ok: false, reason: "malformed" };

  const expected = createHmac("sha256", s).update(payload).digest("base64url");
  const a = Buffer.from(expected);
  const b = Buffer.from(sig);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return { ok: false, reason: "bad_signature" };
  }
  if (Date.now() > exp) return { ok: false, reason: "expired" };

  return { ok: true, requestId, expiresAt: new Date(exp), tokenHash: hashToken(token) };
}
