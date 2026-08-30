"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Alert, Button, Field } from "@/ui";
import { PhotoUpload } from "@/ui/patterns/PhotoUpload";
import {
  addInfoAction,
  askClarificationAction,
  decideQuoteAction,
} from "@/server/actions/clientLink";
import styles from "./link.module.css";

type QuoteView = {
  id: string;
  version: number;
  status: string;
  workDescription: string;
  isEstimate: boolean;
  lines: { concept: string; amount: string; included: boolean }[];
  subtotal: string;
  tax: string;
  total: string;
  maxTotal: string | null;
  visitFee: string | null;
  visitFeeDiscounted: boolean;
  exclusionsNote: string | null;
  assumptions: string[];
  extrasApprovalNote: string | null;
  preparatoryNote: string | null;
  professionalRef: string | null;
  verificationScope: string | null;
  scheduledFor: string | null;
  durationEstimate: string | null;
  warrantyText: string | null;
  warrantyResponsible: string | null;
  estimatedTimeframe: string | null;
  validUntil: string | null;
  observations: string | null;
};

type View = {
  reference: string;
  status: { label: string; description: string; tone: string; awaitingClient: boolean };
  clientName: string | null;
  hasPhone: boolean;
  trade: string | null;
  municipality: string | null;
  submittedAt: string | null;
  photoCount: number;
  canAddInfo: boolean;
  canDecideQuote: boolean;
  analysis: { plainSummary: string; orientativeSolution: string; disclaimer: string } | null;
  quote: QuoteView | null;
};

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("es-ES", { dateStyle: "long" }).format(new Date(iso));
}

const ERR: Record<string, string> = {
  rate_limited: "Demasiadas peticiones. Espera un momento.",
  verification_failed: "Los 4 dígitos no coinciden con el teléfono de la solicitud.",
  not_allowed: "Esta acción ya no está disponible para tu solicitud.",
  expired: "El enlace ha caducado. Recupera el acceso.",
  revoked: "El enlace ya no es válido.",
};
const msgFor = (k: string) => ERR[k] ?? "No hemos podido completar la acción. Inténtalo de nuevo.";

export function ClientStatusView({
  token,
  view,
  photos,
}: {
  token: string;
  view: View;
  photos: { id: string; signedUrl: string }[];
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [notice, setNotice] = useState<string | null>(null);

  const [info, setInfo] = useState("");
  const [clar, setClar] = useState("");
  const [last4, setLast4] = useState("");

  function run(fn: () => Promise<{ ok: boolean; error?: { kind: string } }>, okMsg: string) {
    setNotice(null);
    start(async () => {
      const r = await fn();
      if (r.ok) {
        setNotice(okMsg);
        setInfo("");
        setClar("");
        setLast4("");
        router.refresh();
      } else {
        setNotice(msgFor(r.error!.kind));
      }
    });
  }

  const q = view.quote;

  return (
    <div>
      <div className={styles.statusBanner} data-tone={view.status.tone}>
        <p className={styles.statusLabel}>{view.status.label}</p>
        <p>{view.status.description}</p>
        <p className={styles.meta}>
          <span>
            Referencia <span className={styles.ref}>{view.reference}</span>
          </span>
          {view.trade && <span>{view.trade}</span>}
          {view.municipality && <span>{view.municipality}</span>}
          {view.submittedAt && <span>Enviada el {fmtDate(view.submittedAt)}</span>}
        </p>
      </div>

      {notice && <Alert tone="info">{notice}</Alert>}

      {view.analysis && (
        <div className={styles.card}>
          <h2>Lo que hemos entendido</h2>
          <p>{view.analysis.plainSummary}</p>
          {view.analysis.orientativeSolution && (
            <>
              <h3>Orientación</h3>
              <p>{view.analysis.orientativeSolution}</p>
            </>
          )}
          <p className={styles.smallprint}>{view.analysis.disclaimer}</p>
        </div>
      )}

      {q && (
        <div className={styles.card}>
          <h2>
            Presupuesto (v{q.version}){" "}
            {q.isEstimate ? "· estimación" : "· importe cerrado"}
          </h2>
          <p>{q.workDescription}</p>

          <table className={styles.quoteLines}>
            <tbody>
              {q.visitFee && (
                <tr>
                  <td>Visita / diagnóstico{q.visitFeeDiscounted ? " (se descuenta si aceptas)" : ""}</td>
                  <td>{q.visitFee}</td>
                </tr>
              )}
              {q.lines.map((l, i) => (
                <tr key={i} className={l.included ? undefined : styles.excluded}>
                  <td>
                    {l.concept}
                    {l.included ? "" : " (no incluido)"}
                  </td>
                  <td>{l.amount}</td>
                </tr>
              ))}
              <tr>
                <td>Subtotal</td>
                <td>{q.subtotal}</td>
              </tr>
              <tr>
                <td>IVA</td>
                <td>{q.tax}</td>
              </tr>
              <tr className={styles.totalRow}>
                <td>Total{q.isEstimate ? " estimado" : ""}</td>
                <td>{q.total}</td>
              </tr>
              {q.maxTotal && (
                <tr>
                  <td>Máximo previsible</td>
                  <td>{q.maxTotal}</td>
                </tr>
              )}
            </tbody>
          </table>

          <dl className={styles.quoteFacts}>
            {q.professionalRef && (
              <div>
                <dt>Profesional asignado</dt>
                <dd>
                  {q.professionalRef}
                  {q.verificationScope ? ` — ${q.verificationScope}` : ""}
                </dd>
              </div>
            )}
            {(q.scheduledFor || q.durationEstimate || q.estimatedTimeframe) && (
              <div>
                <dt>Fecha y duración</dt>
                <dd>
                  {q.scheduledFor ? fmtDate(q.scheduledFor) : q.estimatedTimeframe ?? "Por confirmar"}
                  {q.durationEstimate ? ` · ${q.durationEstimate}` : ""}
                </dd>
              </div>
            )}
            {q.warrantyText && (
              <div>
                <dt>Garantía</dt>
                <dd>
                  {q.warrantyText}
                  {q.warrantyResponsible ? ` (responsable: ${q.warrantyResponsible})` : ""}
                </dd>
              </div>
            )}
            {q.preparatoryNote && (
              <div>
                <dt>Trabajos previos</dt>
                <dd>{q.preparatoryNote}</dd>
              </div>
            )}
            {q.exclusionsNote && (
              <div>
                <dt>No incluye</dt>
                <dd>{q.exclusionsNote}</dd>
              </div>
            )}
            {q.assumptions.length > 0 && (
              <div>
                <dt>Supuestos que podrían cambiar el precio</dt>
                <dd>
                  <ul>
                    {q.assumptions.map((a, i) => (
                      <li key={i}>{a}</li>
                    ))}
                  </ul>
                </dd>
              </div>
            )}
            {q.extrasApprovalNote && (
              <div>
                <dt>Aprobación de extras</dt>
                <dd>{q.extrasApprovalNote}</dd>
              </div>
            )}
            {q.validUntil && (
              <div>
                <dt>Validez de la oferta</dt>
                <dd>Hasta el {fmtDate(q.validUntil)}</dd>
              </div>
            )}
            {q.observations && (
              <div>
                <dt>Observaciones</dt>
                <dd>{q.observations}</dd>
              </div>
            )}
          </dl>

          {view.canDecideQuote ? (
            <>
              <h3>¿Quieres seguir adelante?</h3>
              {view.hasPhone ? (
                <>
                  <Field
                    label="Confirma con los últimos 4 dígitos de tu teléfono"
                    inputMode="numeric"
                    maxLength={4}
                    className={styles.verifyField}
                    value={last4}
                    onChange={(e) => setLast4(e.currentTarget.value.replace(/\D/g, ""))}
                  />
                  <div className={styles.decisionRow}>
                    <Button
                      size="md"
                      loading={pending}
                      disabled={last4.length !== 4}
                      onClick={() =>
                        run(
                          () => decideQuoteAction(token, q.id, "ACEPTADO", last4),
                          "Has aceptado el presupuesto. Gracias, nos ponemos en marcha.",
                        )
                      }
                    >
                      Aceptar presupuesto
                    </Button>
                    <Button
                      size="md"
                      variant="secondary"
                      loading={pending}
                      disabled={last4.length !== 4}
                      onClick={() =>
                        run(
                          () => decideQuoteAction(token, q.id, "RECHAZADO", last4),
                          "Has rechazado el presupuesto. Si quieres una alternativa, escríbenos abajo.",
                        )
                      }
                    >
                      Rechazar
                    </Button>
                  </div>
                </>
              ) : (
                <Alert tone="info">
                  Para aceptar o rechazar necesitamos verificar tu teléfono. Ponte en contacto con
                  nosotros.
                </Alert>
              )}
            </>
          ) : (
            <p className={styles.smallprint}>
              Estado del presupuesto:{" "}
              {q.status === "ACEPTADO"
                ? "aceptado"
                : q.status === "RECHAZADO"
                  ? "rechazado"
                  : q.status === "CADUCADO"
                    ? "caducado"
                    : "pendiente"}
              .
            </p>
          )}
        </div>
      )}

      {view.canAddInfo && (
        <div className={styles.card}>
          <h2>Añade la información que te hemos pedido</h2>
          <Field
            as="textarea"
            label="Cuéntanos lo que falta"
            value={info}
            onChange={(e) => setInfo(e.currentTarget.value)}
          />
          <Button
            size="md"
            loading={pending}
            disabled={info.trim().length < 3}
            onClick={() =>
              run(() => addInfoAction(token, info), "Gracias, lo revisamos y seguimos con tu solicitud.")
            }
          >
            Enviar información
          </Button>

          <h3>Añade fotos</h3>
          <PhotoUpload requestId="" linkToken={token} initial={photos} />
        </div>
      )}

      <div className={styles.card}>
        <h2>¿Necesitas una aclaración?</h2>
        <p className={styles.smallprint}>
          Escríbenos y un responsable de Praetoria te contestará. No es un chat automático.
        </p>
        <Field
          as="textarea"
          label="Tu mensaje"
          value={clar}
          onChange={(e) => setClar(e.currentTarget.value)}
        />
        <Button
          size="md"
          variant="secondary"
          loading={pending}
          disabled={clar.trim().length < 3}
          onClick={() =>
            run(
              () => askClarificationAction(token, clar),
              "Hemos recibido tu mensaje. Te responderemos por tu canal de contacto.",
            )
          }
        >
          Enviar mensaje
        </Button>
      </div>
    </div>
  );
}
