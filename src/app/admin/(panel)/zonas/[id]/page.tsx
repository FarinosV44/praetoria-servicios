import Link from "next/link";
import { notFound } from "next/navigation";
import { localPageService } from "@/server/services/localPage";
import { ZoneEditor } from "./ZoneEditor";
import styles from "../../../admin.module.css";

export default async function ZoneEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await localPageService.getForAdmin(id);
  if (!data) notFound();
  const { page, eligibility, faq } = data;

  return (
    <div className={styles.detail}>
      <Link href="/admin/zonas" className={styles.back}>
        ← Zonas
      </Link>
      <h1>
        {page.municipality} <span className={styles.badge}>{page.status}</span>
      </h1>
      <p className={styles.smallprint}>
        {eligibility.indexable ? (
          <>Indexable ✓ — aparece en el sitemap.</>
        ) : (
          <>
            No indexable —{" "}
            {eligibility.reasons.join(" ")}
          </>
        )}
        {page.status === "PUBLICADO" && (
          <>
            {" · "}
            <Link href={`/zonas/${page.slug}`} target="_blank">
              Ver publicado
            </Link>
          </>
        )}
      </p>

      <ZoneEditor
        page={{
          id: page.id,
          slug: page.slug,
          municipality: page.municipality,
          serviceKey: page.serviceKey ?? "",
          status: page.status,
          noindex: page.noindex,
          intro: page.intro ?? "",
          coverageNote: page.coverageNote,
          responseTimeNote: page.responseTimeNote ?? "",
          completedJobsNote: page.completedJobsNote ?? "",
          casePhotoNote: page.casePhotoNote ?? "",
          metaTitle: page.metaTitle ?? "",
          metaDescription: page.metaDescription ?? "",
          typicalServices: page.typicalServices.join(", "),
          localFaq: JSON.stringify(faq, null, 2),
        }}
      />
    </div>
  );
}
