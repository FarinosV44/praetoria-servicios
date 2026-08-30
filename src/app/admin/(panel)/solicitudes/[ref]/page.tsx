import { notFound } from "next/navigation";
import Link from "next/link";
import { adminService } from "@/server/services/admin";
import { findTrade } from "@/config/trades";
import { AdminRequestControls } from "./Controls";
import { CommsPanel } from "./CommsPanel";
import { InsurancePanel } from "./InsurancePanel";
import { CoveragePanel } from "./CoveragePanel";
import { DangerZone } from "./DangerZone";
import styles from "../../../admin.module.css";

function fmt(d: Date | null | undefined) {
  return d
    ? new Intl.DateTimeFormat("es-ES", { dateStyle: "medium", timeStyle: "short" }).format(d)
    : "—";
}

export default async function RequestDetail({ params }: { params: Promise<{ ref: string }> }) {
  const { ref } = await params;
  const data = await adminService.getDetail(ref);
  if (!data) notFound();

  const { request, photos, analysisHistory, corrections, communications, insurance, coverage } =
    data;
  const active = analysisHistory.find((a) => a.isActive);
  const result =
    active && active.outcome !== "PROVIDER_ERROR"
      ? (active.result as Record<string, unknown>)
      : null;

  return (
    <div className={styles.detail}>
      <Link href="/admin" className={styles.back}>
        ← Volver
      </Link>
      <h1>
        {request.reference} <span className={styles.badge}>{request.status}</span>
      </h1>

      <div className={styles.detailGrid}>
        <div>
          <section className={styles.card}>
            <h2>Problema</h2>
            <p>{request.problemText ?? "—"}</p>
            <dl className={styles.dl}>
              <div>
                <dt>Oficio</dt>
                <dd>
                  {findTrade(request.trade)?.label ??
                    (request.clientChoseUnsure ? "No lo sabe" : "—")}
                </dd>
              </div>
              <div>
                <dt>Urgencia</dt>
                <dd>{request.urgency ?? "—"}</dd>
              </div>
              <div>
                <dt>Municipio / CP</dt>
                <dd>
                  {request.municipality ?? "—"} · {request.postalCode ?? "—"}{" "}
                  {request.withinCoverage === false && <em>(fuera de cobertura)</em>}
                </dd>
              </div>
              <div>
                <dt>Enviada</dt>
                <dd>{fmt(request.submittedAt)}</dd>
              </div>
            </dl>
          </section>

          {photos.length > 0 && (
            <section className={styles.card}>
              <h2>Fotos ({photos.length})</h2>
              <div className={styles.photos}>
                {photos.map((p) => (
                  <a key={p.id} href={p.signedUrl} target="_blank" rel="noreferrer">
                    {/* eslint-disable-next-line @next/next/no-img-element -- private, expiring signed URL; next/image proxying is wrong here */}
                    <img src={p.signedUrl} alt={p.hint ?? "foto de la solicitud"} />
                  </a>
                ))}
              </div>
              <p className={styles.smallprint}>Los enlaces caducan a los 10 minutos.</p>
            </section>
          )}

          <section className={styles.card}>
            <h2>Análisis (v{active?.version ?? "—"})</h2>
            {active?.outcome === "PROVIDER_ERROR" && (
              <p>El análisis automático falló. Requiere revisión manual.</p>
            )}
            {result && (
              <>
                <h3>Lo que entendió el cliente</h3>
                <p>{String(result.plainSummary ?? "")}</p>
                <h3>Descripción técnica</h3>
                <p>{String(result.technicalDescription ?? "")}</p>
                <h3>Solución orientativa</h3>
                <p>{String(result.orientativeSolution ?? "")}</p>
              </>
            )}
            {analysisHistory.length > 1 && (
              <p className={styles.smallprint}>
                {analysisHistory.length} versiones de análisis registradas.
              </p>
            )}
            {corrections.length > 0 && (
              <>
                <h3>Correcciones del cliente</h3>
                <ul>
                  {corrections.map((c) => (
                    <li key={c.id}>
                      {c.wrongSections.join(", ") || "(sin apartados)"} —{" "}
                      {c.clarification ?? "sin texto"}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </section>

          <section className={styles.card}>
            <h2>Historial de estados</h2>
            <ol className={styles.history}>
              {request.statusHistory.map((e) => (
                <li key={e.id}>
                  <strong>{e.to}</strong> · {e.actorType}
                  {e.actorId ? ` (${e.actorId})` : ""} · {fmt(e.createdAt)}
                  {e.reason ? ` — ${e.reason}` : ""}
                </li>
              ))}
            </ol>
          </section>
        </div>

        <aside>
          <section className={styles.card}>
            <h2>Contacto</h2>
            <dl className={styles.dl}>
              <div>
                <dt>Nombre</dt>
                <dd>{request.contact?.name ?? "—"}</dd>
              </div>
              <div>
                <dt>Teléfono</dt>
                <dd>{request.contact?.phone ?? "—"}</dd>
              </div>
              <div>
                <dt>Email</dt>
                <dd>{request.contact?.email ?? "—"}</dd>
              </div>
              <div>
                <dt>Canal</dt>
                <dd>{request.contact?.preferredChannel ?? "—"}</dd>
              </div>
              <div>
                <dt>Disponibilidad</dt>
                <dd>{request.contact?.availabilityNote ?? "—"}</dd>
              </div>
            </dl>
            <p className={styles.smallprint}>
              Consentimientos:{" "}
              {request.consents.map((c) => `${c.type}:${c.granted ? "sí" : "no"}`).join(" · ")}
            </p>
          </section>

          <section className={styles.card}>
            <h2>Presupuesto</h2>
            <Link href={`/admin/solicitudes/${request.reference}/presupuesto`}>
              Preparar / ver presupuesto →
            </Link>
          </section>

          {insurance && (
            <InsurancePanel
              reference={request.reference}
              insurance={{
                consentGiven: insurance.consentGiven,
                extractionStatus: insurance.extractionStatus,
                insurerName: insurance.insurerName,
                policyNumber: insurance.policyNumber,
                validFrom: insurance.validFrom ? insurance.validFrom.toISOString() : null,
                validTo: insurance.validTo ? insurance.validTo.toISOString() : null,
                missingDocsNote: insurance.missingDocsNote,
                extraction: insurance.extraction,
                documents: insurance.documents,
              }}
            />
          )}

          {insurance && (
            <CoveragePanel
              reference={request.reference}
              coverage={
                coverage
                  ? {
                      verdict: coverage.verdict,
                      confidence: coverage.confidence,
                      draftText: coverage.draftText,
                      draftStatusLabel: coverage.draftStatusLabel,
                      reviewed: coverage.reviewed,
                      reviewedAt: coverage.reviewedAt
                        ? coverage.reviewedAt.toISOString()
                        : null,
                      needsPolicyDocument: coverage.needsPolicyDocument,
                      breakdown: coverage.breakdown,
                      revisions: coverage.revisions.map((r) => ({
                        id: r.id,
                        note: r.note,
                        createdAt: r.createdAt.toISOString(),
                      })),
                    }
                  : null
              }
            />
          )}

          <CommsPanel
            reference={request.reference}
            communications={communications.map((c) => ({
              id: c.id,
              channel: c.channel,
              kind: c.kind,
              status: c.status,
              subject: c.subject,
              bodyPreview: c.bodyPreview,
              error: c.error,
              attempts: c.attempts,
              createdAt: c.createdAt.toISOString(),
            }))}
          />

          <AdminRequestControls
            reference={request.reference}
            status={request.status}
            trade={request.trade ?? ""}
            urgency={request.urgency ?? ""}
          />

          <DangerZone reference={request.reference} />
        </aside>
      </div>
    </div>
  );
}
