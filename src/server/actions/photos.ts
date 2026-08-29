"use server";

import { photoService } from "@/server/services/photos";
import { err, ok, type Result } from "@/lib/result";

export async function removePhotoAction(
  requestId: string,
  photoId: string,
): Promise<Result<null, { kind: string }>> {
  const r = await photoService.remove(requestId, photoId);
  return r.ok ? ok(null) : err({ kind: r.error.kind });
}

export async function reorderPhotosAction(
  requestId: string,
  orderedIds: string[],
): Promise<Result<null, never>> {
  await photoService.reorder(requestId, orderedIds);
  return ok(null);
}

export async function listPhotosAction(requestId: string) {
  return photoService.list(requestId);
}
