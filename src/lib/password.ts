import { randomBytes, scrypt, timingSafeEqual, type ScryptOptions } from "node:crypto";

/**
 * Password hashing (issue #11) — scrypt, no external dependency.
 * Format: scrypt$<N>$<saltB64>$<hashB64>
 */
function scryptAsync(
  password: string,
  salt: Buffer,
  keylen: number,
  options: ScryptOptions,
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(password, salt, keylen, options, (e, derived) =>
      e ? reject(e) : resolve(derived as Buffer),
    );
  });
}
const KEYLEN = 64;
const COST = 16384; // N

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const derived = (await scryptAsync(password, salt, KEYLEN, { N: COST })) as Buffer;
  return `scrypt$${COST}$${salt.toString("base64")}$${derived.toString("base64")}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split("$");
  if (parts.length !== 4 || parts[0] !== "scrypt") return false;
  const cost = Number(parts[1]);
  const salt = Buffer.from(parts[2]!, "base64");
  const expected = Buffer.from(parts[3]!, "base64");
  if (!Number.isFinite(cost) || expected.length !== KEYLEN) return false;
  const derived = (await scryptAsync(password, salt, KEYLEN, { N: cost })) as Buffer;
  return derived.length === expected.length && timingSafeEqual(derived, expected);
}
