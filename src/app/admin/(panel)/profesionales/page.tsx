import Link from "next/link";
import { professionalService } from "@/server/services/professionals";
import { TRADES } from "@/config/trades";
import { EmptyState } from "@/ui";
import { NewProfessionalForm } from "./NewProfessionalForm";
import styles from "../../admin.module.css";
import type { ProfessionalStatus } from "@prisma/client";

const STATUSES: ProfessionalStatus[] = [
  "CANDIDATO",
  "DOCUMENTACION_PENDIENTE",
  "VERIFICANDO",
  "APROBADO",
  "SUSPENDIDO",
  "RECHAZADO",
];

function fmtDate(d: Date | null) {
  return d ? new Intl.DateTimeFormat("es-ES", { dateStyle: "short" }).format(d) : "—";
}

export default async function ProfessionalsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const [list, expiring] = await Promise.all([
    professionalService.list({
      status: (sp.status as ProfessionalStatus) || undefined,
      trade: sp.trade || undefined,
      search: sp.q || undefined,
    }),
    professionalService.expiringItems(),
  ]);

  const alerts = [
    ...expiring.credentials.map((c) => ({
      ref: c.professional.reference,
      name: c.professional.displayName,
      what: `Acreditación ${c.label}`,
      when: c.expiresAt,
    })),
    ...expiring.rc.map((p) => ({
      ref: p.reference,
      name: p.displayName,
      what: "Seguro de responsabilidad civil",
      when: p.rcExpiresAt,
    })),
    ...expiring.verifications.map((v) => ({
      ref: v.professional.reference,
      name: v.professional.displayName,
      what: `Verificación ${v.kind}`,
      when: v.expiresAt,
    })),
    ...expiring.documents.map((d) => ({
      ref: d.professional.reference,
      name: d.professional.displayName,
      what: `Documento ${d.kind}`,
      when: d.expiresAt,
    })),
  ].sort((a, b) => (a.when?.getTime() ?? 0) - (b.when?.getTime() ?? 0));

  return (
    <div>
      <h1>Red de profesionales</h1>

      {alerts.length > 0 && (
        <section className={`${styles.card} ${styles.kpiWarn}`}>
          <h2>Por caducar</h2>
          <ul>
            {alerts.map((a, i) => (
              <li key={i}>
                <strong>{a.ref}</strong> {a.name} — {a.what} · {fmtDate(a.when)}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className={styles.card}>
        <h2>Alta de profesional</h2>
        <NewProfessionalForm />
      </section>

      <form className={styles.filters} method="get">
        <input name="q" defaultValue={sp.q ?? ""} placeholder="Referencia o nombre" />
        <select name="status" defaultValue={sp.status ?? ""}>
          <option value="">Todos los estados</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select name="trade" defaultValue={sp.trade ?? ""}>
          <option value="">Todos los oficios</option>
          {TRADES.map((t) => (
            <option key={t.key} value={t.key}>
              {t.label}
            </option>
          ))}
        </select>
        <button type="submit">Filtrar</button>
        <Link href="/admin/profesionales" className={styles.clear}>
          Limpiar
        </Link>
      </form>

      {list.length === 0 ? (
        <EmptyState title="No hay profesionales" description="Da de alta el primero arriba." />
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Ref.</th>
                <th>Nombre</th>
                <th>Estado</th>
                <th>Oficios</th>
                <th>Zonas</th>
                <th>Asignaciones activas</th>
                <th>RC caduca</th>
              </tr>
            </thead>
            <tbody>
              {list.map((p) => (
                <tr key={p.id}>
                  <td>
                    <Link href={`/admin/profesionales/${p.id}`}>{p.reference}</Link>
                  </td>
                  <td>{p.displayName}</td>
                  <td>{p.status}</td>
                  <td>{p.trades.join(", ") || "—"}</td>
                  <td>{p.municipalities.join(", ") || "—"}</td>
                  <td>{p._count.assignments}</td>
                  <td>{fmtDate(p.rcExpiresAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
