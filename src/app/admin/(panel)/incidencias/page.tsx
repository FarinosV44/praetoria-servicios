import Link from "next/link";
import { serviceClosureService } from "@/server/services/serviceClosure";
import { reviewService } from "@/server/services/reviews";
import { EmptyState } from "@/ui";
import { IncidenceControls } from "./IncidenceControls";
import styles from "../../admin.module.css";

function fmt(d: Date | null) {
  return d
    ? new Intl.DateTimeFormat("es-ES", { dateStyle: "short", timeStyle: "short" }).format(d)
    : "—";
}

export default async function IncidencesPage() {
  const [open, pending, heldPii] = await Promise.all([
    serviceClosureService.listOpenIncidences(),
    reviewService.listForAdmin("PENDIENTE"),
    reviewService.listForAdmin("RETENIDA_PII"),
  ]);
  const reviewsToReview = pending.length + heldPii.length;

  return (
    <div>
      <h1>Incidencias</h1>

      <section className={styles.card}>
        <h2>Incidencias abiertas ({open.length})</h2>
        {open.length === 0 ? (
          <EmptyState title="Ninguna incidencia abierta" description="Todo en orden." />
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Ref.</th>
                  <th>Solicitud</th>
                  <th>Estado</th>
                  <th>Clasificación</th>
                  <th>Abierta</th>
                  <th>Primera respuesta antes de</th>
                  <th>Descripción</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {open.map((i) => (
                  <tr key={i.id} className={i.overdue ? styles.warnRow : undefined}>
                    <td>{i.reference}</td>
                    <td>
                      <Link href={`/admin/solicitudes/${i.request.reference}`}>
                        {i.request.reference}
                      </Link>
                    </td>
                    <td>{i.status}</td>
                    <td>{i.kind ?? "—"}</td>
                    <td>{i.openedBy}</td>
                    <td>
                      {fmt(i.firstResponseDueAt)} {i.overdue ? "⚠ vencida" : ""}
                    </td>
                    <td>{i.description.slice(0, 120)}</td>
                    <td>
                      <IncidenceControls id={i.id} status={i.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className={styles.card}>
        <h2>Opiniones</h2>
        <p>
          {reviewsToReview > 0
            ? `${reviewsToReview} opinión(es) esperando moderación.`
            : "Nada pendiente de moderar."}{" "}
          <Link href="/admin/opiniones">Ir a Opiniones →</Link>
        </p>
      </section>
    </div>
  );
}
