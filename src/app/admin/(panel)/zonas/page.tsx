import Link from "next/link";
import { EmptyState } from "@/ui";
import { localPageService } from "@/server/services/localPage";
import { NewZoneForm } from "./NewZoneForm";
import styles from "../../admin.module.css";

function fmt(d: Date) {
  return new Intl.DateTimeFormat("es-ES", { dateStyle: "short", timeStyle: "short" }).format(d);
}

export default async function ZonasAdminPage() {
  const pages = await localPageService.listForAdmin();

  return (
    <div>
      <h1>Zonas (SEO local)</h1>
      <p className={styles.smallprint}>
        Una página de zona sólo se indexa cuando tiene contenido real y específico: municipio
        cubierto, nota de cobertura y al menos dos señales diferenciadoras (servicios demandados,
        tiempos, preguntas locales, trabajos realizados). El resto queda como <code>noindex</code>.
      </p>

      <section className={styles.card}>
        <h2>Nueva zona</h2>
        <NewZoneForm />
      </section>

      {pages.length === 0 ? (
        <EmptyState title="Sin zonas" description="Crea la primera arriba." />
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Municipio</th>
                <th>Estado</th>
                <th>Indexable</th>
                <th>Actualizado</th>
              </tr>
            </thead>
            <tbody>
              {pages.map((z) => (
                <tr key={z.id}>
                  <td>
                    <Link href={`/admin/zonas/${z.id}`}>{z.municipality}</Link>
                    <br />
                    <small>/zonas/{z.slug}</small>
                  </td>
                  <td>{z.status}</td>
                  <td>
                    {z.indexable ? "✓ sí" : "— no"}
                    {!z.indexable && z.reasons.length > 0 && (
                      <>
                        <br />
                        <small>{z.reasons[0]}</small>
                      </>
                    )}
                  </td>
                  <td>{fmt(z.updatedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
