import { customAlphabet } from "nanoid";

/**
 * Public identifiers — random, non-sequential, never derived from a database PK.
 * Issues #9, #11, #16: "identificador público no secuencial",
 * "Identificadores secuenciales no sirven para acceder."
 */

// Unambiguous alphabet (no 0/O, 1/I/L) for human-facing references.
const humanAlphabet = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
const humanId = customAlphabet(humanAlphabet, 10);

// URL-safe token alphabet for signed links and admin URLs.
const tokenAlphabet = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_";
const token = customAlphabet(tokenAlphabet, 32);

/** e.g. "PS-7Q2M-KX9A" — shown to the client as their request reference. */
export function newRequestReference(): string {
  const raw = humanId();
  return `PS-${raw.slice(0, 4)}-${raw.slice(4, 8)}`;
}

/** 32-char URL-safe opaque token for signed status links, upload sessions, etc. */
export function newOpaqueToken(): string {
  return token();
}

/** Slug-safe short id for internal-but-URL-visible resources. */
export function newShortId(): string {
  return token().slice(0, 16);
}
