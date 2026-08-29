import { createHmac } from "node:crypto";
import { mkdir, readFile, writeFile, unlink, rm, access } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { env } from "@/lib/env";
import type { BlobStore, PutInput } from "./index";

/**
 * Filesystem blob store for local development. Files live under STORAGE_FS_DIR
 * (gitignored, outside `public/` — never web-served directly). Downloads go
 * through the app's own signed route `/api/uploads/[...key]` which verifies the
 * signature before streaming.
 */
export function createFsBlobStore(): BlobStore {
  // Dev-only adapter (guarded by STORAGE_ADAPTER === "fs" in the container).
  const root = resolve(/* turbopackIgnore: true */ process.cwd(), env.STORAGE_FS_DIR);
  const secret = env.SIGNED_LINK_SECRET ?? "dev-insecure-storage-secret";

  const pathFor = (key: string) => join(root, key.replace(/\.\./g, "_"));

  const sign = (key: string, exp: number) =>
    createHmac("sha256", secret).update(`${key}:${exp}`).digest("base64url");

  return {
    async put(input: PutInput) {
      const p = pathFor(input.key);
      await mkdir(dirname(p), { recursive: true });
      await writeFile(p, input.data);
      await writeFile(
        `${p}.meta`,
        JSON.stringify({ contentType: input.contentType, sensitive: !!input.sensitive }),
      );
    },
    async get(key) {
      try {
        return new Uint8Array(await readFile(pathFor(key)));
      } catch {
        return null;
      }
    },
    async getSignedUrl(key, ttlSeconds) {
      const exp = Date.now() + ttlSeconds * 1000;
      const sig = sign(key, exp);
      const qs = new URLSearchParams({ exp: String(exp), sig });
      return `${env.APP_URL}/api/uploads/${key}?${qs.toString()}`;
    },
    async delete(key) {
      await unlink(pathFor(key)).catch(() => {});
      await unlink(`${pathFor(key)}.meta`).catch(() => {});
    },
    async deleteByPrefix(prefix) {
      const dir = pathFor(prefix);
      try {
        await rm(dir, { recursive: true, force: true });
        return 1;
      } catch {
        return 0;
      }
    },
    async exists(key) {
      try {
        await access(pathFor(key));
        return true;
      } catch {
        return false;
      }
    },
  };
}

/** Verify a signature produced by getSignedUrl (used by the download route). */
export function verifyFsSignature(key: string, exp: number, sig: string): boolean {
  if (!Number.isFinite(exp) || Date.now() > exp) return false;
  const secret = env.SIGNED_LINK_SECRET ?? "dev-insecure-storage-secret";
  const expected = createHmac("sha256", secret).update(`${key}:${exp}`).digest("base64url");
  return timingSafeEqualStr(expected, sig);
}

function timingSafeEqualStr(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i++) out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return out === 0;
}
