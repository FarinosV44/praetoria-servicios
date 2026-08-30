import Link from "next/link";
import { serviceClosureService } from "@/server/services/serviceClosure";
import { reviewService } from "@/server/services/reviews";
import { findTrade } from "@/config/trades";
import { EmptyState } from "@/ui";
import { IncidenceControls } from "./IncidenceControls";
import { ReviewControls } from "./ReviewControls";
import styles from "../../admin.module.css";

function fmt(d: Date | null) {
  return d
    ? new Intl.DateTimeFormat("es-ES", { dateStyle: "short", timeStyle: "short" }).format(d)
    : "—";
}

export default async function IncidencesPage() {
  const [open, pendingReviews] = await Promise.all([
    serviceClosureService.listOpenIncidences(),
    reviewService.listForAdmin("PENDIENTE"),
  ]);

  return (
    <div>
      <h1>Incidencias y valoraciones</h1>

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
        <h2>Valoraciones pendientes de autorizar ({pendingReviews.length})</h2>
        {pendingReviews.length === 0 ? (
          <EmptyState
            title="Nada pendiente"
            description="Solo se publican valoraciones reales, autorizadas y con consentimiento del cliente."
          />
        ) : (
          <ul>
            {pendingReviews.map((r) => (
              <li key={r.id} style={{ marginBottom: "0.75rem" }}>
                <strong>{r.rating}/5</strong> · solicitud {r.request.reference} ·{" "}
                {findTrade(r.request.trade)?.label ?? r.request.trade} ·{" "}
                {r.publishConsent ? "con consentimiento de publicación" : "SIN consentimiento (no publicable)"}
                {r.comment ? ` — «${r.comment}»` : ""}
                <br />
                <ReviewControls id={r.id} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
