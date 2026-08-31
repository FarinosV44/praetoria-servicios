import Link from "next/link";
import { seoService } from "@/server/services/seo";
import { EmptyState } from "@/ui";
import { CsvImportForm } from "./CsvImportForm";
import { DraftButton } from "./DraftButton";
import styles from "../../admin.module.css";

function fmtRange(p: { start: Date; end: Date } | null) {
  if (!p) return "sin datos importados";
  const f = (d: Date) => new Intl.DateTimeFormat("es-ES", { dateStyle: "medium" }).format(d);
  return `${f(p.start)} – ${f(p.end)}`;
}

const KIND_LABEL: Record<string, string> = {
  real: "dato real",
  estimate: "estimación",
  recommendation: "recomendación",
};

function Section({
  id,
  title,
  hint,
  children,
}: {
  id: string;
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={styles.card} aria-labelledby={id}>
      <h2 id={id}>{title}</h2>
      {hint && <p className={styles.smallprint}>{hint}</p>}
      {children}
    </section>
  );
}

function OppList({ items }: { items: { query: string; page: string | null; detail: string; action: string; kind: string }[] }) {
  if (items.length === 0) return <p className={styles.smallprint}>Nada que señalar con los datos actuales.</p>;
  return (
    <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
      {items.slice(0, 25).map((o, i) => (
        <li key={i} style={{ borderTop: "1px solid var(--c-border)", padding: "0.6rem 0" }}>
          <div>
            <strong>{o.query}</strong>{" "}
            <span className={styles.badge}>{KIND_LABEL[o.kind] ?? o.kind}</span>
            {o.page && (
              <>
                {" · "}
                <Link href={o.page} target="_blank">
                  {o.page}
                </Link>
              </>
            )}
          </div>
          <div className={styles.smallprint}>{o.detail}</div>
          <div className={styles.smallprint}>
            <strong>Acción:</strong> {o.action}
          </div>
        </li>
      ))}
    </ul>
  );
}

export default async function SeoControlPage() {
  const [overview, imports, trafficNoReq] = await Promise.all([
    seoService.overview(),
    seoService.listImports(),
    seoService.pagesWithTrafficNoRequests(),
  ]);

  const src = overview.metrics.source ?? "—";
  const period = fmtRange(overview.metrics.period);

  return (
    <div>
      <h1>Centro de control SEO local</h1>
      <p className={styles.smallprint}>
        Sin integración con Search Console: los datos de consultas entran por CSV. Cada bloque indica
        su <strong>período</strong> y su <strong>fuente</strong>, y si es un <em>dato real</em>, una{" "}
        <em>estimación</em> o una <em>recomendación</em>. El panel no afirma que ningún cambio haya
        causado una mejora de posición: son señales para decidir, no una relación de causa-efecto.
      </p>

      <Section id="import" title="Importar métricas (CSV)">
        <CsvImportForm />
        {imports.length > 0 && (
          <table className={styles.table} style={{ marginTop: "1rem" }}>
            <thead>
              <tr>
                <th>Fuente</th>
                <th>Período</th>
                <th>Filas</th>
                <th>Descartadas</th>
                <th>Importado</th>
              </tr>
            </thead>
            <tbody>
              {imports.map((im) => (
                <tr key={im.id}>
                  <td>{im.source}</td>
                  <td>{fmtRange({ start: im.periodStart, end: im.periodEnd })}</td>
                  <td>{im.rowCount}</td>
                  <td>{im.skippedCount}</td>
                  <td>{new Intl.DateTimeFormat("es-ES", { dateStyle: "short", timeStyle: "short" }).format(im.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Section>

      <Section
        id="consultas"
        title="Consultas (dato real)"
        hint={`Fuente: ${src} · Período: ${period} · ${overview.metrics.rowCount} filas.`}
      >
        {overview.queries.length === 0 ? (
          <EmptyState title="Sin datos" description="Importa un CSV de Search Console arriba." />
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Consulta</th>
                  <th>Página</th>
                  <th>Clics</th>
                  <th>Impr.</th>
                  <th>CTR</th>
                  <th>Pos.</th>
                </tr>
              </thead>
              <tbody>
                {overview.queries.map((q, i) => (
                  <tr key={i}>
                    <td>{q.query}</td>
                    <td>{q.page ?? "—"}</td>
                    <td>{q.clicks}</td>
                    <td>{q.impressions}</td>
                    <td>{(q.ctr * 100).toFixed(1)}%</td>
                    <td>{q.position.toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      <Section
        id="lowctr"
        title="CTR bajo para la posición (recomendación)"
        hint="Impresiones altas pero pocos clics para la posición media. Suele arreglarse en el title / meta description."
      >
        <OppList items={overview.lowCtr} />
        {overview.lowCtr.map((o, i) => (
          <DraftButton key={i} query={o.query} />
        ))}
      </Section>

      <Section
        id="striking"
        title="A distancia de la primera página (recomendación)"
        hint="Consultas en posición 4–20 con impresiones reales: un empujón de contenido o enlaces internos puede moverlas a la página 1."
      >
        <OppList items={overview.strikingDistance} />
      </Section>

      <Section
        id="trafico-sin-solicitudes"
        title="Páginas con tráfico pero sin solicitudes (dato real)"
        hint={`Fuente: ${trafficNoReq.source ?? "—"} · Período: ${fmtRange(trafficNoReq.period)}. Atribución por página de entrada (cookie propia, solo la ruta).`}
      >
        {trafficNoReq.items.length === 0 ? (
          <p className={styles.smallprint}>Ninguna, o aún no hay atribución suficiente.</p>
        ) : (
          <ul>
            {trafficNoReq.items.map((p) => (
              <li key={p.page}>
                <Link href={p.page} target="_blank">
                  {p.page}
                </Link>{" "}
                — {p.clicks} clics, {p.impressions} impresiones, 0 solicitudes atribuidas.
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section id="gaps" title="Huecos de enlazado y cobertura (recomendación)">
        <OppList
          items={overview.linkingGaps.map((g) => ({
            query: g.title,
            page: g.href,
            detail: g.detail,
            action: g.action,
            kind: g.kind,
          }))}
        />
      </Section>

      <Section id="stale" title="Contenido sin actualizar (recomendación)">
        <OppList items={overview.staleContent} />
      </Section>

      <Section id="canibalizacion" title="Posible canibalización (recomendación)">
        <OppList items={overview.cannibalization} />
      </Section>

      <Section
        id="faq"
        title="Preguntas frecuentes a partir de solicitudes reales (recomendación)"
        hint="Dudas reales de clientes, anonimizadas (se eliminan teléfonos, correos y direcciones antes de mostrarlas). Material para redactar FAQs; nunca se publica solo."
      >
        {overview.faqCandidates.length === 0 ? (
          <p className={styles.smallprint}>Sin suficientes solicitudes por oficio todavía.</p>
        ) : (
          overview.faqCandidates.map((f) => (
            <div key={f.trade} style={{ marginBottom: "0.75rem" }}>
              <strong>{f.trade}</strong> ({f.count} solicitudes)
              <ul>
                {f.snippets.map((s, i) => (
                  <li key={i} className={styles.smallprint}>
                    «{s}»
                  </li>
                ))}
              </ul>
              <span className={styles.smallprint}>{f.action}</span>
            </div>
          ))
        )}
      </Section>
    </div>
  );
}
