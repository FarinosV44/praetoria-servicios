/**
 * Print the SQL to create the first admin user.
 *
 *   node scripts/first-admin.mjs "you@example.com" "Your Name" "a-strong-password"
 *
 * Copy the printed INSERT into the Supabase SQL Editor and run it once.
 * The password is hashed here (scrypt) — the plaintext never leaves this machine.
 */
import { scrypt as _scrypt, randomBytes } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(_scrypt);
const COST = 16384;
const KEYLEN = 64;

const [email, name, password] = process.argv.slice(2);
if (!email || !name || !password) {
  console.error('Usage: node scripts/first-admin.mjs "email" "Name" "password"');
  process.exit(1);
}

const salt = randomBytes(16);
const derived = await scrypt(password, salt, KEYLEN, { N: COST });
const hash = `scrypt$${COST}$${salt.toString("base64")}$${derived.toString("base64")}`;

const id = "adm_" + randomBytes(12).toString("hex");
const esc = (s) => s.replace(/'/g, "''");

console.log(`
-- Run this once in the Supabase SQL Editor:
INSERT INTO "AdminUser" (id, email, name, "passwordHash", role, "createdAt")
VALUES ('${id}', '${esc(email)}', '${esc(name)}', '${hash}', 'ADMIN', now());
`);
