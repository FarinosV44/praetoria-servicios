import Link from "next/link";
import { adminService } from "@/server/services/admin";
import { TRADES } from "@/config/trades";
import { COVERED_MUNICIPALITIES } from "@/config/coverage";
import { EmptyState } from "@/ui";
import styles from "../admin.module.css";
import type { RequestStatus, Urgency } from "@prisma/client";

const STATUSES: RequestStatus[] = [
  "PENDIENTE_ANALISIS",
  "REQUIERE_INFORMACION",
  "VALIDADA_CLIENTE",
  "EN_REVISION",
  "PRESUPUESTO_PREPARADO",
  "PRESUPUESTO_ENVIADO",
  "ACEPTADA",
  "RECHAZADA",
  "CANCELADA",
  "CERRADA",
];

function fmt(d: Date | null) {
  return d
    ? new Intl.DateTimeFormat("es-ES", { dateStyle: "short", timeStyle: "short" }).format(d)
    : "—";
}

export default async function AdminInbox({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const filters = {
    status: (sp.status as RequestStatus) || undefined,
    trade: sp.trade || undefined,
    urgency: (sp.urgency as Urgency) || undefined,
    municipality: sp.municipality || undefined,
    search: sp.q || undefined,
    page: sp.page ? Number(sp.page) : 1,
  };

  const [kpis, list] = await Promise.all([adminService.kpis(), adminService.listRequests(filters)]);
  const pages = Math.max(1, Math.ceil(list.total / list.perPage));

  return (
    <div>
      <h1>Solicitudes</h1>

      <div className={styles.kpis}>
        <Kpi label="Nuevas" value={kpis.nuevas} />
        <Kpi label="Pendientes" value={kpis.pendientes} />
        <Kpi label="Próximas a incumplir plazo" value={kpis.proximasIncumplir} tone="warn" />
        <Kpi label="Cerradas / aceptadas" value={kpis.cerradas} />
      </div>

      <form className={styles.filters} method="get">
        <input
          name="q"
          defaultValue={sp.q ?? ""}
          placeholder="Referencia, nombre, teléfono, email"
        />
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
        <select name="urgency" defaultValue={sp.urgency ?? ""}>
          <option value="">Toda urgencia</option>
          {["BAJA", "MEDIA", "ALTA", "EMERGENCIA"].map((u) => (
            <option key={u} value={u}>
              {u}
            </option>
          ))}
        </select>
        <select name="municipality" defaultValue={sp.municipality ?? ""}>
          <option value="">Todos los municipios</option>
          {COVERED_MUNICIPALITIES.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
        <button type="submit">Filtrar</button>
        <Link href="/admin" className={styles.clear}>
          Limpiar
        </Link>
      </form>

      {list.rows.length === 0 ? (
        <EmptyState
          title="No hay solicitudes con esos filtros"
          description="Prueba a limpiar los filtros."
        />
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Referencia</th>
                <th>Estado</th>
                <th>Oficio</th>
                <th>Urgencia</th>
                <th>Municipio</th>
                <th>Cliente</th>
                <th>Enviada</th>
              </tr>
            </thead>
            <tbody>
              {list.rows.map((r) => (
                <tr key={r.reference} className={r.nearDeadline ? styles.warnRow : undefined}>
                  <td>
                    <Link href={`/admin/solicitudes/${r.reference}`}>{r.reference}</Link>
                  </td>
                  <td>{r.status}</td>
                  <td>{r.trade ?? "—"}</td>
                  <td>{r.urgency ?? "—"}</td>
                  <td>{r.municipality ?? "—"}</td>
                  <td>{r.name}</td>
                  <td>{fmt(r.submittedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {pages > 1 && (
        <div className={styles.pager}>
          {Array.from({ length: pages }, (_, i) => i + 1).map((p) => {
            const q = new URLSearchParams(sp as Record<string, string>);
            q.set("page", String(p));
            return (
              <Link
                key={p}
                href={`/admin?${q.toString()}`}
                className={p === list.page ? styles.pageActive : undefined}
              >
                {p}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Kpi({ label, value, tone }: { label: string; value: number; tone?: "warn" }) {
  return (
    <div className={`${styles.kpi} ${tone === "warn" ? styles.kpiWarn : ""}`}>
      <span className={styles.kpiValue}>{value}</span>
      <span className={styles.kpiLabel}>{label}</span>
    </div>
  );
}
