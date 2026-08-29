import "server-only";
import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "node:crypto";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { verifyPassword } from "@/lib/password";
import { rateLimit } from "@/lib/rate-limit";
import { err, ok, type Result } from "@/lib/result";

/**
 * Minimal admin session (issue #11). A signed, httpOnly, sameSite cookie holds
 * the admin id + expiry; the signature is HMAC-SHA256 over the payload. No
 * external auth dependency. Every admin route re-checks this.
 */

const COOKIE = "praetoria_admin";
const TTL_MS = 1000 * 60 * 60 * 8; // 8 hours

function secret(): string {
  return env.AUTH_SECRET ?? (env.NODE_ENV === "production" ? "" : "dev-insecure-auth-secret");
}

function sign(payload: string): string {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

export interface AdminSession {
  adminId: string;
  email: string;
  name: string;
  role: "OPERATOR" | "ADMIN";
}

export async function signIn(
  email: string,
  password: string,
  ip: string,
): Promise<Result<AdminSession, { kind: "invalid" | "rate_limited" | "disabled" }>> {
  const gate = rateLimit(`login:${ip}`, { limit: 8, windowMs: 300_000 });
  if (!gate.ok) return err({ kind: "rate_limited" });

  const user = await db.adminUser.findUnique({ where: { email: email.trim().toLowerCase() } });
  // Always run a verify to keep timing uniform even when the user does not exist.
  const okPass = await verifyPassword(
    password,
    user?.passwordHash ?? "scrypt$16384$AAAAAAAAAAAAAAAAAAAAAA==$" + "A".repeat(88),
  );
  if (!user || !okPass) return err({ kind: "invalid" });
  if (user.disabledAt) return err({ kind: "disabled" });

  const exp = Date.now() + TTL_MS;
  const payload = `${user.id}.${exp}`;
  const token = `${payload}.${sign(payload)}`;
  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: Math.floor(TTL_MS / 1000),
  });
  await db.adminUser.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
  return ok({ adminId: user.id, email: user.email, name: user.name, role: user.role });
}

export async function signOut(): Promise<void> {
  const jar = await cookies();
  jar.delete(COOKIE);
}

/** Read + verify the session cookie. Returns null if absent, tampered or expired. */
export async function getSession(): Promise<AdminSession | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [adminId, expStr, sig] = parts;
  const payload = `${adminId}.${expStr}`;
  const expected = sign(payload);
  const a = Buffer.from(expected);
  const b = Buffer.from(sig!);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  if (Date.now() > Number(expStr)) return null;

  const user = await db.adminUser.findUnique({ where: { id: adminId } });
  if (!user || user.disabledAt) return null;
  return { adminId: user.id, email: user.email, name: user.name, role: user.role };
}

/** For server components / actions — throws (caught by the layout) if not signed in. */
export async function requireSession(): Promise<AdminSession> {
  const s = await getSession();
  if (!s) throw new Error("UNAUTHENTICATED");
  return s;
}

export const ADMIN_COOKIE = COOKIE;
