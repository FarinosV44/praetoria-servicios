import { applicationService } from "@/server/services/applications";
import { findTrade } from "@/config/trades";
import { EmptyState } from "@/ui";
import { ApplicationRow } from "./ApplicationRow";
import styles from "../../admin.module.css";

function fmt(d: Date) {
  return new Intl.DateTimeFormat("es-ES", { dateStyle: "short", timeStyle: "short" }).format(d);
}

const GROUPS = ["NUEVA", "CONTACTADA", "EN_VALIDACION", "APROBADA", "RECHAZADA"] as const;

export default async function CandidaturasPage() {
  const groups = await Promise.all(
    GROUPS.map(async (status) => ({ status, rows: await applicationService.listForAdmin(status) })),
  );
  const total = groups.reduce((n, g) => n + g.rows.length, 0);

  return (
    <div>
      <h1>Candidaturas de profesionales</h1>
      <p className={styles.smallprint}>
        Bandeja de primer contacto, separada de la red verificada. Aprobar una candidatura y
        convertirla crea un profesional en estado <code>CANDIDATO</code> en «Profesionales». En este
        MVP el profesional no tiene ningún acceso al sistema.
      </p>

      {total === 0 && (
        <EmptyState title="Sin candidaturas" description="Llegarán desde /trabaja-con-nosotros." />
      )}

      {groups.map(
        (g) =>
          g.rows.length > 0 && (
            <section key={g.status} className={styles.card}>
              <h2>
                {g.status} ({g.rows.length})
              </h2>
              <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
                {g.rows.map((a) => (
                  <li key={a.id} style={{ borderTop: "1px solid var(--c-border)", padding: "0.75rem 0" }}>
                    <div>
                      <strong>{a.name}</strong> · {a.isCompany ? "empresa" : "autónomo/a"} ·{" "}
                      {a.trades.map((t) => findTrade(t)?.label ?? t).join(", ")}
                      {a.spamFlagged ? " · ⚠ marcada como spam" : ""}
                      {a.professionalId ? " · convertida a profesional" : ""}
                    </div>
                    <div className={styles.smallprint}>
                      {a.email} · {a.phone}
                      {a.municipalities.length ? ` · ${a.municipalities.join(", ")}` : ""} · recibida{" "}
                      {fmt(a.createdAt)}
                    </div>
                    {a.availabilityNote && (
                      <div className={styles.smallprint}>Disponibilidad: {a.availabilityNote}</div>
                    )}
                    {a.experienceNote && (
                      <div className={styles.smallprint}>Experiencia: {a.experienceNote}</div>
                    )}
                    {a.observations && (
                      <div className={styles.smallprint}>Observaciones: {a.observations}</div>
                    )}
                    {a.reviewReason && (
                      <div className={styles.smallprint}>Motivo de rechazo: {a.reviewReason}</div>
                    )}
                    {a.internalNotes && (
                      <pre className={styles.smallprint} style={{ whiteSpace: "pre-wrap", margin: "0.25rem 0" }}>
                        {a.internalNotes}
                      </pre>
                    )}
                    <ApplicationRow
                      id={a.id}
                      status={a.status}
                      converted={Boolean(a.professionalId)}
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
