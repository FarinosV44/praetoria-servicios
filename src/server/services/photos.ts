import "server-only";
import { db } from "@/lib/db";
import { newShortId } from "@/lib/id";
import { log } from "@/lib/logging";
import { getAdapters } from "@/server/container";
import { validatePhoto } from "@/domain/photos/validation";
import { err, ok, type Result } from "@/lib/result";

/**
 * Photo persistence (issue #6). Files go to the private BlobStore; only the
 * storage key is stored, never a public URL. Access is always a short-lived
 * signed URL. Deletion is tied to the request lifecycle.
 */

const SIGNED_URL_TTL_SECONDS = 60 * 10;

const EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/heic": "heic",
};

export type PhotoError =
  | { kind: "request_not_found" }
  | { kind: "request_locked" }
  | { kind: "rejected"; code: string; message: string };

const EDITABLE_STATUSES = ["BORRADOR", "REQUIERE_INFORMACION", "PENDIENTE_ANALISIS"];

export const photoService = {
  async add(input: {
    requestId: string;
    bytes: Uint8Array;
    declaredType: string;
    size: number;
    hint?: string;
  }): Promise<Result<{ id: string; signedUrl: string }, PhotoError>> {
    const request = await db.request.findUnique({
      where: { id: input.requestId },
      select: { id: true, status: true, _count: { select: { photos: true } } },
    });
    if (!request) return err({ kind: "request_not_found" });
    if (!EDITABLE_STATUSES.includes(request.status)) return err({ kind: "request_locked" });

    const currentCount = await db.photo.count({
      where: { requestId: input.requestId, deletedAt: null },
    });
    const check = validatePhoto(
      { bytes: input.bytes, declaredType: input.declaredType, size: input.size },
      currentCount,
    );
    if (!check.ok) {
      return err({ kind: "rejected", code: check.error.code, message: check.error.message });
    }

    const type = check.type!;
    const photoId = newShortId();
    const key = `requests/${input.requestId}/photos/${photoId}.${EXT[type] ?? "bin"}`;

    const adapters = getAdapters();
    await adapters.storage.put({ key, data: input.bytes, contentType: type });

    const maxPos = await db.photo.aggregate({
      where: { requestId: input.requestId },
      _max: { position: true },
    });
    const photo = await db.photo.create({
      data: {
        requestId: input.requestId,
        storageKey: key,
        contentType: type,
        byteSize: input.size,
        position: (maxPos._max.position ?? -1) + 1,
        hint: input.hint,
      },
    });

    const signedUrl = await adapters.storage.getSignedUrl(key, SIGNED_URL_TTL_SECONDS);
    log.info("photo added", { requestId: input.requestId, photoId: photo.id, bytes: input.size });
    return ok({ id: photo.id, signedUrl });
  },

  async list(requestId: string) {
    const photos = await db.photo.findMany({
      where: { requestId, deletedAt: null },
      orderBy: { position: "asc" },
    });
    const storage = getAdapters().storage;
    return Promise.all(
      photos.map(async (p) => ({
        id: p.id,
        hint: p.hint,
        position: p.position,
        contentType: p.contentType,
        signedUrl: await storage.getSignedUrl(p.storageKey, SIGNED_URL_TTL_SECONDS),
      })),
    );
  },

  async remove(requestId: string, photoId: string): Promise<Result<null, PhotoError>> {
    const photo = await db.photo.findFirst({ where: { id: photoId, requestId, deletedAt: null } });
    if (!photo) return err({ kind: "request_not_found" });
    await getAdapters().storage.delete(photo.storageKey);
    await db.photo.update({ where: { id: photoId }, data: { deletedAt: new Date() } });
    return ok(null);
  },

  async reorder(requestId: string, orderedIds: string[]): Promise<void> {
    await db.$transaction(
      orderedIds.map((id, i) =>
        db.photo.updateMany({ where: { id, requestId }, data: { position: i } }),
      ),
    );
  },

  /** Lifecycle cleanup — remove every photo blob + row for a request (issue #6, #17). */
  async deleteAllForRequest(requestId: string): Promise<number> {
    const deleted = await getAdapters().storage.deleteByPrefix(`requests/${requestId}/photos/`);
    const { count } = await db.photo.deleteMany({ where: { requestId } });
    log.info("photos purged for request", { requestId, blobs: deleted, rows: count });
    return count;
  },
};
