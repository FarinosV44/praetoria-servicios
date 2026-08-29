import type { BlobStore, PutInput } from "./index";

/** In-memory blob store for tests. Signed URLs are opaque local references. */
export function createMemoryBlobStore(): BlobStore {
  const store = new Map<string, { data: Uint8Array; contentType: string }>();
  return {
    async put(input: PutInput) {
      store.set(input.key, { data: input.data, contentType: input.contentType });
    },
    async get(key) {
      return store.get(key)?.data ?? null;
    },
    async getSignedUrl(key, ttlSeconds) {
      const exp = Date.now() + ttlSeconds * 1000;
      return `memory://${encodeURIComponent(key)}?exp=${exp}`;
    },
    async delete(key) {
      store.delete(key);
    },
    async deleteByPrefix(prefix) {
      let n = 0;
      for (const k of [...store.keys()]) {
        if (k.startsWith(prefix)) {
          store.delete(k);
          n++;
        }
      }
      return n;
    },
    async exists(key) {
      return store.has(key);
    },
  };
}
