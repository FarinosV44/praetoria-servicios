"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Uploader, type UploaderFile } from "./Uploader";
import { Alert } from "../primitives/Alert";
import { prepareImage, firstBytes } from "./image-client";
import { detectImageType } from "@/domain/photos/validation";
import { LIMITS } from "@/config/limits";
import { removePhotoAction, reorderPhotosAction } from "@/server/actions/photos";

/**
 * Photo capture + upload for the assistant (issue #6). Wraps the Uploader shell
 * with client-side compression/orientation, magic-byte pre-check, one-at-a-time
 * XHR upload with progress and per-file retry. A failed upload never forces the
 * others to be repeated.
 */

interface Item extends UploaderFile {
  serverId?: string;
  file: File;
  hint?: string;
}

export function PhotoUpload({
  requestId,
  linkToken,
  initial = [],
  onCountChange,
}: {
  requestId: string;
  /** when set, uploads go through the signed client link (issue #16) and
   *  remove/reorder are disabled — the client only adds photos */
  linkToken?: string;
  initial?: { id: string; signedUrl: string }[];
  onCountChange?: (n: number) => void;
}) {
  const [items, setItems] = useState<Item[]>(
    initial.map((p) => ({
      id: p.id,
      serverId: p.id,
      name: "foto",
      previewUrl: p.signedUrl,
      progress: 100,
      status: "done",
      file: new File([], "foto"),
    })),
  );
  const [notice, setNotice] = useState<string | null>(null);
  const previews = useRef<string[]>([]);

  useEffect(() => {
    onCountChange?.(items.filter((i) => i.status === "done").length);
  }, [items, onCountChange]);

  useEffect(() => {
    const urls = previews.current;
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, []);

  const upload = useCallback(
    (item: Item) => {
      setItems((prev) =>
        prev.map((i) =>
          i.id === item.id ? { ...i, status: "uploading", progress: 0, error: undefined } : i,
        ),
      );
      const form = new FormData();
      if (linkToken) form.append("token", linkToken);
      else form.append("requestId", requestId);
      if (item.hint) form.append("hint", item.hint);
      form.append("file", item.file, item.name);

      const xhr = new XMLHttpRequest();
      xhr.open("POST", "/api/uploads");
      xhr.upload.onprogress = (e) => {
        if (!e.lengthComputable) return;
        const progress = Math.round((e.loaded / e.total) * 100);
        setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, progress } : i)));
      };
      xhr.onload = () => {
        if (xhr.status === 201) {
          const body = JSON.parse(xhr.responseText) as { id: string };
          setItems((prev) =>
            prev.map((i) =>
              i.id === item.id ? { ...i, status: "done", progress: 100, serverId: body.id } : i,
            ),
          );
        } else {
          let message = "No se pudo subir";
          try {
            message = (JSON.parse(xhr.responseText) as { message?: string }).message ?? message;
          } catch {
            /* keep default */
          }
          setItems((prev) =>
            prev.map((i) => (i.id === item.id ? { ...i, status: "error", error: message } : i)),
          );
        }
      };
      xhr.onerror = () => {
        setItems((prev) =>
          prev.map((i) =>
            i.id === item.id ? { ...i, status: "error", error: "Sin conexión. Reintenta." } : i,
          ),
        );
      };
      xhr.send(form);
    },
    [requestId, linkToken],
  );

  const onPick = useCallback(
    async (fileList: FileList) => {
      setNotice(null);
      const current = items.filter((i) => i.status !== "error").length;
      const room = LIMITS.photos.max - current;
      const chosen = Array.from(fileList).slice(0, Math.max(0, room));
      if (chosen.length < fileList.length) {
        setNotice(`Solo se pueden añadir ${LIMITS.photos.max} fotos.`);
      }

      for (const file of chosen) {
        if (file.size > LIMITS.photos.maxBytes) {
          setNotice("Alguna foto pesa demasiado y se ha omitido.");
          continue;
        }
        const sig = await firstBytes(file);
        if (!detectImageType(sig)) {
          setNotice("Algún archivo no era una imagen y se ha omitido.");
          continue;
        }
        const prepared = await prepareImage(file);
        previews.current.push(prepared.previewUrl);
        const id = crypto.randomUUID();
        const item: Item = {
          id,
          name: file.name || "foto.jpg",
          previewUrl: prepared.previewUrl,
          progress: 0,
          status: "queued",
          file: new File([prepared.blob], file.name || "foto.jpg", { type: prepared.type }),
        };
        setItems((prev) => [...prev, item]);
        upload(item);
      }
    },
    [items, upload],
  );

  const onRemove = useCallback(
    async (id: string) => {
      const item = items.find((i) => i.id === id);
      setItems((prev) => prev.filter((i) => i.id !== id));
      if (item?.serverId && !linkToken) await removePhotoAction(requestId, item.serverId);
    },
    [items, requestId, linkToken],
  );

  const onRetry = useCallback(
    (id: string) => {
      const item = items.find((i) => i.id === id);
      if (item) upload(item);
    },
    [items, upload],
  );

  const onMove = useCallback(
    (id: string, dir: -1 | 1) => {
      setItems((prev) => {
        const idx = prev.findIndex((i) => i.id === id);
        const next = idx + dir;
        if (idx < 0 || next < 0 || next >= prev.length) return prev;
        const copy = [...prev];
        [copy[idx], copy[next]] = [copy[next]!, copy[idx]!];
        const orderedServerIds = copy.map((i) => i.serverId).filter((x): x is string => !!x);
        if (!linkToken) void reorderPhotosAction(requestId, orderedServerIds);
        return copy;
      });
    },
    [requestId, linkToken],
  );

  const doneCount = items.filter((i) => i.status === "done").length;

  return (
    <div>
      {notice && (
        <Alert tone="warning" className="">
          {notice}
        </Alert>
      )}
      <Uploader
        files={items}
        accept={LIMITS.photos.acceptedTypes.join(",")}
        maxReached={items.filter((i) => i.status !== "error").length >= LIMITS.photos.max}
        onPick={onPick}
        onRemove={onRemove}
        onRetry={onRetry}
        onMove={onMove}
      />
      {doneCount > 0 && doneCount < LIMITS.photos.minRecommended && (
        <Alert tone="info">
          Con una foto general y otra de detalle nos ayudas a entender mejor el problema.
        </Alert>
      )}
    </div>
  );
}
