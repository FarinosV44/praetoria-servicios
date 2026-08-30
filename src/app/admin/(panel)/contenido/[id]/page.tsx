import Link from "next/link";
import { notFound } from "next/navigation";
import { contentService } from "@/server/services/content";
import { allowedNextArticleStatuses } from "@/domain/content/article-status";
import { ArticleEditor } from "./ArticleEditor";
import styles from "../../../admin.module.css";

export default async function ArticleEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [a, warnings] = await Promise.all([
    contentService.getForAdmin(id),
    contentService.warningsFor(id),
  ]);
  if (!a) notFound();

  return (
    <div className={styles.detail}>
      <Link href="/admin/contenido" className={styles.back}>
        ← Contenido
      </Link>
      <h1>
        {a.title} <span className={styles.badge}>{a.status}</span>
      </h1>
      <p className={styles.smallprint}>
        <Link href={`/admin/contenido/${id}/preview`} target="_blank">
          Vista previa
        </Link>
        {a.status === "PUBLICADO" && (
          <>
            {" · "}
            <Link href={`/guias/${a.slug}`} target="_blank">
              Ver publicado
            </Link>
          </>
        )}
      </p>

      <ArticleEditor
        article={{
          id: a.id,
          slug: a.slug,
          title: a.title,
          excerpt: a.excerpt ?? "",
          kind: a.kind,
          status: a.status,
          reviewedByHuman: a.reviewedByHuman,
          expertReviewer: a.expertReviewer ?? "",
          author: a.author ?? "",
          body: JSON.stringify(a.body, null, 2),
          coverImageSrc: a.coverImageSrc ?? "",
          coverImageAlt: a.coverImageAlt ?? "",
          coverCaption: a.coverCaption ?? "",
          coverCredit: a.coverCredit ?? "",
          metaTitle: a.metaTitle ?? "",
          metaDescription: a.metaDescription ?? "",
          canonicalUrl: a.canonicalUrl ?? "",
          noindex: a.noindex,
          socialImage: a.socialImage ?? "",
          targetKeywords: a.targetKeywords.join(", "),
          sources: a.sources ?? "",
          internalNotes: a.internalNotes ?? "",
          nextReviewAt: a.nextReviewAt ? a.nextReviewAt.toISOString().slice(0, 10) : "",
          publishAt: a.publishAt ? a.publishAt.toISOString().slice(0, 16) : "",
        }}
        nextStatuses={allowedNextArticleStatuses(a.status)}
        warnings={warnings}
        revisions={a.revisions.map((r) => ({
          id: r.id,
          note: r.note ?? "",
          createdAt: r.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
