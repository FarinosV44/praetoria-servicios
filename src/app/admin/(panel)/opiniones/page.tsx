import Link from "next/link";
import { reviewService } from "@/server/services/reviews";
import { findTrade } from "@/config/trades";
import { REPUTATION } from "@/config/reputation";
import { EmptyState } from "@/ui";
import { ReviewModeration } from "./ReviewModeration";
import styles from "../../admin.module.css";

function fmt(d: Date | null) {
  return d ? new Intl.DateTimeFormat("es-ES", { dateStyle: "short", timeStyle: "short" }).format(d) : "—";
}

const GROUPS: { title: string; status: Parameters<typeof reviewService.listForAdmin>[0] }[] = [
  { title: "Pendientes", status: "PENDIENTE" },
  { title: "Retenidas por datos personales", status: "RETENIDA_PII" },
  { title: "Publicadas", status: "AUTORIZADA" },
  { title: "Rechazadas", status: "RECHAZADA" },
  { title: "Retiradas", status: "RETIRADA" },
];

export default async function OpinionesPage() {
  const groups = await Promise.all(
    GROUPS.map(async (g) => ({ ...g, rows: await reviewService.listForAdmin(g.status) })),
  );

  return (
    <div>
      <h1>Opiniones verificadas</h1>
      <p className={styles.smallprint}>
        Cada opinión se decide una a una y con motivo registrado. No hay ningún filtro que oculte
        críticas legítimas: una opinión de 1★ se publica por el mismo camino que una de 5★. Los datos
        personales se eliminan antes de publicar. {REPUTATION.verifiedMeaning}
      </p>

      {groups.every((g) => g.rows.length === 0) && (
        <EmptyState
          title="Sin opiniones"
          description="Aparecerán aquí cuando un cliente valore un trabajo cerrado."
        />
      )}

      {groups.map(
        (g) =>
          g.rows.length > 0 && (
            <section key={g.status} className={styles.card}>
              <h2>
                {g.title} ({g.rows.length})
              </h2>
              <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {g.rows.map((r) => (
                  <li key={r.id} style={{ borderTop: "1px solid var(--c-border)", padding: "0.75rem 0" }}>
                    <div className={styles.smallprint}>
                      <strong>{r.rating}/5</strong>
                      {" · "}
                      <Link href={`/admin/solicitudes/${r.request.reference}`}>
                        {r.request.reference}
                      </Link>
                      {" · "}
                      {findTrade(r.request.trade)?.label ?? r.request.trade}
                      {" · "}
                      {r.publishConsent ? "con consentimiento" : "SIN consentimiento (no publicable)"}
                      {" · creada "}
                      {fmt(r.createdAt)}
                      {r.incidenceId ? " · incidencia abierta" : ""}
                    </div>

                    {(r.piiFlagged || r.spamFlagged || r.duplicateFlagged) && (
                      <p className={styles.smallprint}>
                        {r.piiFlagged && `⚠ datos personales detectados (${r.piiKinds.join(", ")}) `}
                        {r.spamFlagged && "⚠ posible spam "}
                        {r.duplicateFlagged && "⚠ posible duplicado "}
                      </p>
                    )}

                    {r.comment && <p style={{ margin: "0.25rem 0" }}>«{r.comment}»</p>}
                    {r.originalComment && r.originalComment !== r.comment && (
                      <p className={styles.smallprint}>Original (interno): «{r.originalComment}»</p>
                    )}
                    {(r.punctuality || r.clarity || r.cleanliness || r.result) && (
                      <p className={styles.smallprint}>
                        {r.punctuality ? `Puntualidad ${r.punctuality} ` : ""}
                        {r.clarity ? `Claridad ${r.clarity} ` : ""}
                        {r.cleanliness ? `Limpieza ${r.cleanliness} ` : ""}
                        {r.result ? `Resultado ${r.result}` : ""}
                      </p>
                    )}
                    {r.moderationReason && (
                      <p className={styles.smallprint}>Motivo de moderación: {r.moderationReason}</p>
                    )}
                    {r.praetoriaResponse && (
                      <p className={styles.smallprint}>Respuesta pública: {r.praetoriaResponse}</p>
                    )}

                    <ReviewModeration
                      id={r.id}
                      status={r.status}
                      piiFlagged={r.piiFlagged}
                      hasIncidence={Boolean(r.incidenceId)}
                    />
                  </li>
                ))}
              </ul>
            </section>
          ),
      )}
    </div>
  );
}
