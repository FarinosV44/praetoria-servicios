"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Alert, Button, Field } from "@/ui";
import { CONTENT } from "@/config/content";
import {
  updateArticleAction,
  setArticleReviewedAction,
  setArticleStatusAction,
  restoreArticleRevisionAction,
} from "@/server/actions/content";
import type { ArticleKind } from "@prisma/client";
import styles from "../../../admin.module.css";

interface EditorArticle {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  kind: ArticleKind;
  status: string;
  reviewedByHuman: boolean;
  expertReviewer: string;
  author: string;
  body: string;
  coverImageSrc: string;
  coverImageAlt: string;
  coverCaption: string;
  coverCredit: string;
  metaTitle: string;
  metaDescription: string;
  canonicalUrl: string;
  noindex: boolean;
  socialImage: string;
  targetKeywords: string;
  sources: string;
  internalNotes: string;
  nextReviewAt: string;
  publishAt: string;
}

export function ArticleEditor({
  article,
  nextStatuses,
  warnings,
  revisions,
}: {
  article: EditorArticle;
  nextStatuses: string[];
  warnings: string[];
  revisions: { id: string; note: string; createdAt: string }[];
}) {
  const router = useRouter();
  const [f, setF] = useState(article);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ tone: "success" | "warning"; text: string } | null>(null);
  const [to, setTo] = useState(nextStatuses[0] ?? "");
  const [publishAt, setPublishAt] = useState(article.publishAt);

  const set =
    (k: keyof EditorArticle) => (e: { currentTarget: { value: string } }) => {
      // capture the value now — React nullifies currentTarget after the handler
      // returns, and the setF updater below runs later (render phase).
      const v = e.currentTarget.value;
      setF((p) => ({ ...p, [k]: v }));
    };

  async function save() {
    setBusy(true);
    setMsg(null);
    const r = await updateArticleAction(article.id, {
      title: f.title,
      slug: f.slug,
      excerpt: f.excerpt,
      kind: f.kind,
      author: f.author,
      body: f.body,
      coverImageSrc: f.coverImageSrc,
      coverImageAlt: f.coverImageAlt,
      coverCaption: f.coverCaption,
      coverCredit: f.coverCredit,
      metaTitle: f.metaTitle,
      metaDescription: f.metaDescription,
      canonicalUrl: f.canonicalUrl,
      noindex: f.noindex,
      socialImage: f.socialImage,
      targetKeywords: f.targetKeywords,
      sources: f.sources,
      internalNotes: f.internalNotes,
      nextReviewAt: f.nextReviewAt || null,
    });
    setBusy(false);
    if (r.ok) {
      setMsg({ tone: "success", text: "Guardado." });
      router.refresh();
    } else {
      setMsg({ tone: "warning", text: r.error.message ?? `No se pudo guardar (${r.error.kind}).` });
    }
  }

  async function run(fn: () => Promise<{ ok: boolean; error?: { kind: string; message?: string } }>, okText: string) {
    setBusy(true);
    setMsg(null);
    const r = await fn();
    setBusy(false);
    if (r.ok) {
      setMsg({ tone: "success", text: okText });
      router.refresh();
    } else {
      setMsg({
        tone: "warning",
        text:
          r.error?.message === "human_review_required"
            ? "No se puede publicar sin marcar la revisión humana."
            : r.error?.message === "publish_date_not_future"
              ? "La fecha de publicación debe ser futura."
              : r.error?.message ?? `Error (${r.error?.kind}).`,
      });
    }
  }

  return (
    <div className={styles.detailGrid}>
      <div>
        {msg && <Alert tone={msg.tone}>{msg.text}</Alert>}

        <section className={styles.card}>
          <h2>Contenido</h2>
          <Field label="Título" value={f.title} onChange={set("title")} />
          <Field label="Slug (/guias/…)" value={f.slug} onChange={set("slug")} />
          <Field as="textarea" label="Extracto" value={f.excerpt} onChange={set("excerpt")} />
          <label>
            Tipo{" "}
            <select value={f.kind} onChange={(e) => setF((p) => ({ ...p, kind: e.currentTarget.value as ArticleKind }))}>
              {(Object.keys(CONTENT.kindLabel) as ArticleKind[]).map((k) => (
                <option key={k} value={k}>
                  {CONTENT.kindLabel[k]}
                </option>
              ))}
            </select>
          </label>
          <Field label="Autor" value={f.author} onChange={set("author")} />
          <Field
            as="textarea"
            label="Cuerpo (bloques JSON)"
            hint='Array de bloques: {"type":"heading","level":2,"text":"…"}, {"type":"text","md":"…"}, list, quote, cta, table, image, notice, faq'
            value={f.body}
            onChange={set("body")}
            style={{ minHeight: "22rem", fontFamily: "monospace" }}
          />
        </section>

        <section className={styles.card}>
          <h2>Imagen destacada</h2>
          <Field label="URL" value={f.coverImageSrc} onChange={set("coverImageSrc")} />
          <Field label="Texto alternativo (alt)" value={f.coverImageAlt} onChange={set("coverImageAlt")} />
          <Field label="Pie" value={f.coverCaption} onChange={set("coverCaption")} />
          <Field label="Créditos" value={f.coverCredit} onChange={set("coverCredit")} />
        </section>

        <section className={styles.card}>
          <h2>SEO</h2>
          <Field label="Meta title" value={f.metaTitle} onChange={set("metaTitle")} />
          <Field as="textarea" label="Meta description" value={f.metaDescription} onChange={set("metaDescription")} />
          <Field label="Canonical (opcional)" value={f.canonicalUrl} onChange={set("canonicalUrl")} />
          <Field label="Imagen social (URL)" value={f.socialImage} onChange={set("socialImage")} />
          <Field
            as="textarea"
            label="Palabras / consultas objetivo (una por línea o separadas por comas)"
            value={f.targetKeywords}
            onChange={set("targetKeywords")}
          />
          <label className={styles.check ?? ""}>
            <input
              type="checkbox"
              checked={f.noindex}
              onChange={(e) => setF((p) => ({ ...p, noindex: e.currentTarget.checked }))}
            />{" "}
            noindex (no indexar esta página)
          </label>
        </section>

        <section className={styles.card}>
          <h2>Notas internas (no se publican)</h2>
          <Field as="textarea" label="Fuentes" value={f.sources} onChange={set("sources")} />
          <Field as="textarea" label="Notas internas" value={f.internalNotes} onChange={set("internalNotes")} />
          <Field label="Próxima revisión" type="date" value={f.nextReviewAt} onChange={set("nextReviewAt")} />
        </section>

        <Button onClick={save} loading={busy}>
          Guardar
        </Button>
      </div>

      <div>
        <section className={styles.card}>
          <h3>Revisión y publicación</h3>
          <label>
            <input
              type="checkbox"
              checked={f.reviewedByHuman}
              onChange={(e) =>
                run(
                  () => setArticleReviewedAction(article.id, e.target.checked, f.expertReviewer || undefined),
                  "Revisión actualizada.",
                )
              }
            />{" "}
            Revisado por una persona
          </label>
          <Field
            label="Revisor experto"
            value={f.expertReviewer}
            onChange={set("expertReviewer")}
          />

          {nextStatuses.length > 0 && (
            <>
              <select value={to} onChange={(e) => setTo(e.currentTarget.value)}>
                {nextStatuses.map((s) => (
                  <option key={s} value={s}>
                    → {s}
                  </option>
                ))}
              </select>
              {to === "PROGRAMADO" && (
                <Field
                  label="Publicar el"
                  type="datetime-local"
                  value={publishAt}
                  onChange={(e) => setPublishAt(e.currentTarget.value)}
                />
              )}
              <Button
                variant="secondary"
                loading={busy}
                onClick={() =>
                  run(
                    () => setArticleStatusAction(article.id, { to, publishAt: publishAt || undefined }),
                    `Estado → ${to}.`,
                  )
                }
              >
                Aplicar estado
              </Button>
            </>
          )}
        </section>

        {warnings.length > 0 && (
          <section className={`${styles.card} ${styles.kpiWarn}`}>
            <h3>Avisos de calidad</h3>
            <ul>
              {warnings.map((w) => (
                <li key={w}>{w}</li>
              ))}
            </ul>
          </section>
        )}

        <section className={styles.card}>
          <h3>Historial ({revisions.length})</h3>
          <ul>
            {revisions.map((r) => (
              <li key={r.id}>
                {new Date(r.createdAt).toLocaleString("es-ES")} — {r.note}{" "}
                <Button
                  variant="ghost"
                  loading={busy}
                  onClick={() =>
                    run(() => restoreArticleRevisionAction(article.id, r.id), "Versión restaurada.")
                  }
                >
                  Restaurar
                </Button>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
