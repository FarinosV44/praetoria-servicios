import Link from "next/link";
import { notFound } from "next/navigation";
import { professionalService } from "@/server/services/professionals";
import { allowedNextProfessionalStatuses } from "@/domain/professionals/state-machine";
import { findTrade } from "@/config/trades";
import { ProfessionalControls } from "./ProfessionalControls";
import styles from "../../../admin.module.css";

function fmt(d: Date | null) {
  return d
    ? new Intl.DateTimeFormat("es-ES", { dateStyle: "short", timeStyle: "short" }).format(d)
    : "—";
}
function fmtDate(d: Date | null) {
  return d ? new Intl.DateTimeFormat("es-ES", { dateStyle: "short" }).format(d) : "sin caducidad";
}

export default async function ProfessionalDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const p = await professionalService.getById(id);
  if (!p) notFound();

  const next = allowedNextProfessionalStatuses(p.status);
  const regulatedTrades = p.trades.filter((t) => findTrade(t)?.regulated);

  return (
    <div className={styles.detail}>
      <Link href="/admin/profesionales" className={styles.back}>
        ← Red de profesionales
      </Link>
      <h1>
        {p.reference} <span className={styles.badge}>{p.status}</span>
      </h1>

      <div className={styles.detailGrid}>
        <div>
          <section className={styles.card}>
            <h2>Ficha</h2>
            <dl className={styles.dl}>
              <div><dt>Nombre legal</dt><dd>{p.legalName}</dd></div>
              <div><dt>Nombre visible</dt><dd>{p.displayName}</dd></div>
              <div><dt>NIF / CIF</dt><dd>{p.taxId ?? "—"}</dd></div>
              <div><dt>Contacto</dt><dd>{p.phone ?? "—"} · {p.email ?? "—"}</dd></div>
              <div><dt>Oficios</dt><dd>{p.trades.map((t) => findTrade(t)?.label ?? t).join(", ") || "—"}</dd></div>
              <div><dt>Zonas</dt><dd>{p.municipalities.join(", ") || "—"}</dd></div>
              <div><dt>Disponibilidad</dt><dd>{p.availabilityNote ?? "—"}</dd></div>
              <div><dt>Experiencia</dt><dd>{p.experienceNote ?? "—"}</dd></div>
              <div><dt>Referencias</dt><dd>{p.referencesNote ?? "—"}</dd></div>
              <div><dt>RC</dt><dd>{p.rcInsurer ?? "—"} {p.rcPolicyNumber ? `(${p.rcPolicyNumber})` : ""} · caduca {fmtDate(p.rcExpiresAt)}</dd></div>
              <div><dt>IBAN (últimos 4)</dt><dd>{p.bankIbanLast4 ?? "—"}</dd></div>
              <div><dt>Valoración interna</dt><dd>{p.internalRating ?? "—"}</dd></div>
              <div><dt>Foto para el cliente</dt><dd>{p.photoConsent ? "con consentimiento" : "sin consentimiento"}</dd></div>
            </dl>
          </section>

          {regulatedTrades.length > 0 && (
            <section className={styles.card}>
              <h2>Oficios regulados</h2>
              <p>
                Estos oficios exigen una acreditación vigente para poder asignarlos:
                {" "}
                {regulatedTrades.map((t) => findTrade(t)?.label ?? t).join(", ")}.
              </p>
              <ul>
                {regulatedTrades.map((t) => {
                  const cred = p.credentials.find((c) => c.trade === t);
                  const valid = cred && (!cred.expiresAt || cred.expiresAt > new Date());
                  return (
                    <li key={t}>
                      {findTrade(t)?.label ?? t}:{" "}
                      {valid ? `acreditación vigente (caduca ${fmtDate(cred!.expiresAt)})` : "sin acreditación vigente ⚠"}
                    </li>
                  );
                })}
              </ul>
            </section>
          )}

          <section className={styles.card}>
            <h2>Verificaciones ({p.verifications.length})</h2>
            {p.verifications.length === 0 ? (
              <p>Ninguna registrada. Una comprobación de solo teléfono/email no cuenta como “verificado”.</p>
            ) : (
              <table className={styles.table}>
                <thead>
                  <tr><th>Qué</th><th>Resultado</th><th>Quién</th><th>Cuándo</th><th>Revisar antes de</th><th>Nota</th></tr>
                </thead>
                <tbody>
                  {p.verifications.map((v) => (
                    <tr key={v.id}>
                      <td>{v.kind}</td>
                      <td>{v.passed ? "✓" : "✗"}</td>
                      <td>{v.checkedByAdminId}</td>
                      <td>{fmt(v.checkedAt)}</td>
                      <td>{fmtDate(v.expiresAt)}</td>
                      <td>{v.note ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>

          <section className={styles.card}>
            <h2>Acreditaciones ({p.credentials.length})</h2>
            <ul>
              {p.credentials.map((c) => (
                <li key={c.id}>
                  <strong>{findTrade(c.trade)?.label ?? c.trade}</strong> — {c.label}
                  {c.reference ? ` (${c.reference})` : ""} · caduca {fmtDate(c.expiresAt)}
                </li>
              ))}
              {p.credentials.length === 0 && <li>Ninguna.</li>}
            </ul>
          </section>

          <section className={styles.card}>
            <h2>Documentos ({p.documents.length})</h2>
            <ul>
              {p.documents.map((d) => (
                <li key={d.id}>
                  {d.kind} · {(d.byteSize / 1024).toFixed(0)} KB · añadido {fmt(d.createdAt)} · caduca {fmtDate(d.expiresAt)}
                </li>
              ))}
              {p.documents.length === 0 && <li>Ninguno.</li>}
            </ul>
            <p className={styles.smallprint}>
              Los documentos se guardan cifrados y con acceso mínimo. Se purgan {" "}
              a los 180 días de un rechazo.
            </p>
          </section>

          <section className={styles.card}>
            <h2>Asignaciones</h2>
            <ul>
              {p.assignments.map((a) => (
                <li key={a.id}>
                  Solicitud {a.requestId.slice(0, 8)}… · {a.active ? "activa" : "finalizada"}
                  {" "}({fmt(a.assignedAt)}{a.endedAt ? ` → ${fmt(a.endedAt)}` : ""})
                  {a.endedReason ? ` — ${a.endedReason}` : ""}
                </li>
              ))}
              {p.assignments.length === 0 && <li>Ninguna.</li>}
            </ul>
          </section>
        </div>

        <div>
          <ProfessionalControls
            id={p.id}
            status={p.status}
            nextStatuses={next}
            photoConsent={p.photoConsent}
          />
        </div>
      </div>
    </div>
  );
}
