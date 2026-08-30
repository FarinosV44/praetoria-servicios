import { notFound } from "next/navigation";
import { contentService } from "@/server/services/content";
import { BlockRenderer } from "@/ui/content/BlockRenderer";
import { CONTENT } from "@/config/content";
import { headingsOf } from "@/domain/content/blocks";
import styles from "@/ui/content/content.module.css";

/**
 * Admin preview (issue #24 AC "vista previa idéntica al resultado público").
 * Uses the same `BlockRenderer` as `/guias/[slug]`, from the draft state.
 */
export default async function ArticlePreview({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const a = await contentService.getForAdmin(id);
  if (!a) notFound();
  const toc = headingsOf(a.body);

  return (
    <main className={styles.page}>
      <p className={styles.meta}>
        Vista previa · estado {a.status}
        {a.status !== "PUBLICADO" ? " (no publicada)" : ""}
      </p>
      <span className={styles.kind}>{CONTENT.kindLabel[a.kind]}</span>
      <h1 className={styles.title}>{a.title}</h1>
      <p className={styles.meta}>
        {a.author ? `Por ${a.author}` : "Equipo Praetoria"}
        {a.expertReviewer ? ` · Revisado por ${a.expertReviewer}` : ""}
      </p>
      {a.coverImageSrc && (
        <figure className={styles.figure}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={a.coverImageSrc} alt={a.coverImageAlt ?? ""} />
        </figure>
      )}
      {a.excerpt && <p className={styles.meta}>{a.excerpt}</p>}
      {toc.length >= 3 && (
        <nav className={styles.toc} aria-label="Contenido">
          <strong>En esta guía</strong>
          <ul>
            {toc.map((h) => (
              <li key={h.id} style={{ marginLeft: h.level === 3 ? "1rem" : 0 }}>
                <a href={`#${h.id}`}>{h.text}</a>
              </li>
            ))}
          </ul>
        </nav>
      )}
      <BlockRenderer body={a.body} />
    </main>
  );
}
