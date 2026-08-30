import Link from "next/link";
import { contentService } from "@/server/services/content";
import { CONTENT } from "@/config/content";
import { EmptyState } from "@/ui";
import { NewArticleForm } from "./NewArticleForm";
import styles from "../../admin.module.css";

function fmt(d: Date | null) {
  return d ? new Intl.DateTimeFormat("es-ES", { dateStyle: "short", timeStyle: "short" }).format(d) : "—";
}

export default async function ContentPage() {
  const articles = await contentService.listForAdmin();

  return (
    <div>
      <h1>Contenido editorial</h1>

      <section className={styles.card}>
        <h2>Nuevo contenido</h2>
        <NewArticleForm />
      </section>

      {articles.length === 0 ? (
        <EmptyState title="Sin contenido" description="Crea la primera guía arriba." />
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Título</th>
                <th>Tipo</th>
                <th>Estado</th>
                <th>Rev. humana</th>
                <th>Publicar / publicado</th>
                <th>Actualizado</th>
              </tr>
            </thead>
            <tbody>
              {articles.map((a) => (
                <tr key={a.id}>
                  <td>
                    <Link href={`/admin/contenido/${a.id}`}>{a.title}</Link>
                    <br />
                    <small>/guias/{a.slug}</small>
                  </td>
                  <td>{CONTENT.kindLabel[a.kind]}</td>
                  <td>{a.status}</td>
                  <td>{a.reviewedByHuman ? "✓" : "—"}</td>
                  <td>{a.publishedAt ? fmt(a.publishedAt) : a.publishAt ? `programado ${fmt(a.publishAt)}` : "—"}</td>
                  <td>{fmt(a.updatedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
