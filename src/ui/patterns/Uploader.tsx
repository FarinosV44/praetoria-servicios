"use client";

import { useRef } from "react";
import { Icon } from "../icons/Icon";
import { cn } from "../cn";
import styles from "./Uploader.module.css";

/**
 * Uploader UI shell (issue #3). The real capture/compression/validation/upload
 * machinery is wired by issue #6; this component is purely presentational:
 * dropzone, per-file preview + progress + retry + remove, reorder controls.
 */

export interface UploaderFile {
  id: string;
  name: string;
  previewUrl?: string;
  progress: number; // 0..100
  status: "queued" | "uploading" | "done" | "error";
  error?: string;
}

export function Uploader({
  files,
  accept,
  maxReached,
  hint,
  onPick,
  onRemove,
  onRetry,
  onMove,
}: {
  files: UploaderFile[];
  accept: string;
  maxReached: boolean;
  hint?: string;
  onPick: (fileList: FileList) => void;
  onRemove: (id: string) => void;
  onRetry: (id: string) => void;
  onMove: (id: string, dir: -1 | 1) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className={styles.uploader}>
      {!maxReached && (
        <button type="button" className={styles.dropzone} onClick={() => inputRef.current?.click()}>
          <Icon name="foto" size={28} />
          <span className={styles.dzTitle}>Añadir fotos</span>
          <span className={styles.dzHint}>
            {hint ?? "Haz una foto general, otra de detalle y, si la hay, la etiqueta o el modelo."}
          </span>
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple
        capture="environment"
        className={styles.input}
        onChange={(e) => {
          if (e.target.files?.length) onPick(e.target.files);
          e.target.value = "";
        }}
      />

      {files.length > 0 && (
        <ul className={styles.list}>
          {files.map((f, i) => (
            <li key={f.id} className={cn(styles.item, styles[f.status])}>
              <div className={styles.thumb} aria-hidden="true">
                {f.previewUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={f.previewUrl} alt="" />
                ) : (
                  <Icon name="foto" size={20} />
                )}
              </div>
              <div className={styles.meta}>
                <span className={styles.name}>{f.name}</span>
                {f.status === "uploading" && (
                  <span
                    className={styles.bar}
                    role="progressbar"
                    aria-valuenow={f.progress}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  >
                    <span style={{ width: `${f.progress}%` }} />
                  </span>
                )}
                {f.status === "error" && (
                  <span className={styles.errorText}>{f.error ?? "No se pudo subir"}</span>
                )}
                {f.status === "done" && <span className={styles.doneText}>Subida</span>}
              </div>
              <div className={styles.actions}>
                <button
                  type="button"
                  onClick={() => onMove(f.id, -1)}
                  disabled={i === 0}
                  aria-label={`Mover ${f.name} antes`}
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => onMove(f.id, 1)}
                  disabled={i === files.length - 1}
                  aria-label={`Mover ${f.name} después`}
                >
                  ↓
                </button>
                {f.status === "error" && (
                  <button
                    type="button"
                    onClick={() => onRetry(f.id)}
                    aria-label={`Reintentar ${f.name}`}
                  >
                    ↻
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => onRemove(f.id)}
                  aria-label={`Quitar ${f.name}`}
                >
                  ✕
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
