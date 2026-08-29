/**
 * BlobStore — private object storage (issues #6, #14, #17).
 * Files are NEVER public. Callers receive short-lived signed URLs only.
 */
export interface PutInput {
  key: string;
  data: Uint8Array;
  contentType: string;
  /** mark as encrypted-at-rest sensitive (insurance docs) */
  sensitive?: boolean;
}

export interface BlobStore {
  put(input: PutInput): Promise<void>;
  get(key: string): Promise<Uint8Array | null>;
  /** signed, time-limited download URL */
  getSignedUrl(key: string, ttlSeconds: number): Promise<string>;
  delete(key: string): Promise<void>;
  deleteByPrefix(prefix: string): Promise<number>;
  exists(key: string): Promise<boolean>;
}

export { createMemoryBlobStore } from "./memory";
export { createFsBlobStore } from "./fs";
