"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Alert, Button, Field } from "@/ui";
import { warrantyKindLabel, type WarrantyKind } from "@/domain/service-closure/incidence";
import { SERVICE_CLOSURE } from "@/config/service-closure";
import {
  confirmWorkAction,
  openIncidenceAction,
  submitReviewAction,
  getExpedienteAction,
} from "@/server/actions/serviceClosure";
import styles from "./link.module.css";

interface Completion {
  workDone: string;
  materialsNote: string | null;
  completedAt: string;
  warrantyKind: WarrantyKind | null;
  warrantyText: string | null;
  warrantyExclusions: string | null;
  warrantyResponsible: string | null;
  clientConfirmedAt: string | null;
}

export function PostService({
  token,
  rawStatus,
  hasPhone,
  completion,
  reviewSubmitted,
}: {
  token: string;
  rawStatus: string;
  hasPhone: boolean;
  completion: Completion | null;
  reviewSubmitted: boolean;
}) {
  const router = useRouter();
  const [msg, setMsg] = useState<{ tone: "success" | "warning"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const [last4, setLast4] = useState("");
  const [problem, setProblem] = useState("");
  const [showProblem, setShowProblem] = useState(false);

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [publishConsent, setPublishConsent] = useState(false);
  const [authorName, setAuthorName] = useState("");
  const [dims, setDims] = useState<Record<"punctuality" | "clarity" | "cleanliness" | "result", number | "">>({
    punctuality: "",
    clarity: "",
    cleanliness: "",
    result: "",
  });

  if (!completion && rawStatus !== "CERRADA") return null;

  async function run(fn: () => Promise<{ ok: boolean; error?: { kind: string } }>, okText: string) {
    setBusy(true);
    setMsg(null);
    const r = await fn();
    setBusy(false);
    if (r.ok) {
      setMsg({ tone: "success", text: okText });
      router.refresh();
    } else {
      setMsg({
        tone: "warning",
        text:
          r.error?.kind === "verification_failed"
            ? "Los últimos 4 dígitos no coinciden."
            : `No se ha podido completar (${r.error?.kind ?? "error"}).`,
      });
    }
  }

  async function downloadExpediente() {
    const r = await getExpedienteAction(token);
    if (!r.ok) {
      setMsg({ tone: "warning", text: "No se ha podido generar el expediente." });
      return;
    }
    const blob = new Blob([r.value.json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "expediente-praetoria.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section className={styles.card}>
      <h2>Cierre del servicio</h2>
      {msg && <Alert tone={msg.tone}>{msg.text}</Alert>}

      {completion && (
        <>
          <p>
            <strong>Trabajo realizado:</strong> {completion.workDone}
          </p>
          {completion.materialsNote && <p>Materiales: {completion.materialsNote}</p>}
          {completion.warrantyKind && (
            <div className={styles.trustBeforeAccept}>
              <p>
                <strong>{warrantyKindLabel(completion.warrantyKind)}</strong>
              </p>
              <p>{SERVICE_CLOSURE.warrantyKindDescription[completion.warrantyKind]}</p>
              {completion.warrantyText && <p>{completion.warrantyText}</p>}
              {completion.warrantyExclusions && (
                <p>Exclusiones: {completion.warrantyExclusions}</p>
              )}
              {completion.warrantyResponsible && (
                <p>Responsable: {completion.warrantyResponsible}</p>
              )}
            </div>
          )}
          <p className={styles.charterMeta}>{SERVICE_CLOSURE.noPromiseNote}</p>
        </>
      )}

      {/* Confirm / report — while the request is still ACEPTADA */}
      {completion && rawStatus === "ACEPTADA" && (
        <div>
          <h3>¿Está todo correcto?</h3>
          {hasPhone ? (
            <>
              <Field
                label="Confirma con los últimos 4 dígitos de tu teléfono"
                inputMode="numeric"
                maxLength={4}
                value={last4}
                onChange={(e) => setLast4(e.currentTarget.value.replace(/\D/g, ""))}
              />
              <div className={styles.decisionRow}>
                <Button
                  loading={busy}
                  disabled={last4.length !== 4}
                  onClick={() =>
                    run(
                      () => confirmWorkAction(token, last4),
                      "Gracias por confirmarlo. Damos el trabajo por cerrado.",
                    )
                  }
                >
                  Confirmar que el trabajo está bien
                </Button>
                <Button variant="secondary" onClick={() => setShowProblem((v) => !v)}>
                  Tengo un problema con el trabajo
                </Button>
              </div>
            </>
          ) : (
            <Alert tone="info">
              Para confirmar o abrir una incidencia necesitamos verificar tu teléfono. Escríbenos.
            </Alert>
          )}
        </div>
      )}

      {/* The "Tengo un problema" button is always available once the work is done */}
      {completion && rawStatus !== "ACEPTADA" && (
        <Button variant="secondary" onClick={() => setShowProblem((v) => !v)}>
          Tengo un problema con el trabajo
        </Button>
      )}

      {showProblem && (
        <div style={{ marginTop: "1rem" }}>
          <Field
            as="textarea"
            label="¿Qué ha ocurrido?"
            hint="Descríbelo con tus palabras: qué falla, desde cuándo, y qué esperabas."
            value={problem}
            onChange={(e) => setProblem(e.currentTarget.value)}
          />
          <Button
            loading={busy}
            disabled={problem.trim().length < 10}
            onClick={() =>
              run(async () => {
                const r = await openIncidenceAction(token, problem);
                if (r.ok) setProblem("");
                return r;
              }, "Hemos registrado tu incidencia. Un responsable la revisa y te contacta.")
            }
          >
            Enviar incidencia
          </Button>
        </div>
      )}

      {/* Downloadable expediente */}
      <p style={{ marginTop: "1rem" }}>
        <Button variant="ghost" onClick={downloadExpediente}>
          Descargar el expediente del servicio
        </Button>
      </p>

      {/* Review — only once CERRADA and not yet submitted */}
      {rawStatus === "CERRADA" && !reviewSubmitted && (
        <div style={{ marginTop: "1rem" }}>
          <h3>¿Cómo ha ido?</h3>
          <label>
            Valoración{" "}
            <select value={rating} onChange={(e) => setRating(Number(e.currentTarget.value))}>
              {[5, 4, 3, 2, 1].map((n) => (
                <option key={n} value={n}>
                  {n} / 5
                </option>
              ))}
            </select>
          </label>
          <fieldset style={{ border: "none", padding: 0, margin: "0.5rem 0" }}>
            <legend>Detalle (opcional)</legend>
            {(
              [
                ["punctuality", "Puntualidad"],
                ["clarity", "Claridad"],
                ["cleanliness", "Limpieza"],
                ["result", "Resultado"],
              ] as const
            ).map(([key, label]) => (
              <label key={key} style={{ display: "inline-flex", gap: "0.35rem", marginRight: "1rem" }}>
                {label}{" "}
                <select
                  value={dims[key]}
                  onChange={(e) => {
                    const v = e.currentTarget.value;
                    setDims((p) => ({ ...p, [key]: v === "" ? "" : Number(v) }));
                  }}
                >
                  <option value="">—</option>
                  {[5, 4, 3, 2, 1].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </label>
            ))}
          </fieldset>
          <Field
            as="textarea"
            label="Comentario (opcional)"
            hint="No incluyas teléfonos, direcciones ni correos: si aparecen, retiramos el dato antes de publicar."
            value={comment}
            onChange={(e) => setComment(e.currentTarget.value)}
          />
          <label className={styles.check}>
            <input
              type="checkbox"
              checked={publishConsent}
              onChange={(e) => setPublishConsent(e.currentTarget.checked)}
            />
            <span>Autorizo a Praetoria a mostrar esta opinión públicamente.</span>
          </label>
          {publishConsent && (
            <Field
              label="Nombre a mostrar (opcional, p. ej. «Ana G.»)"
              value={authorName}
              onChange={(e) => setAuthorName(e.currentTarget.value)}
            />
          )}
          <Button
            loading={busy}
            onClick={() =>
              run(
                () =>
                  submitReviewAction(token, {
                    rating,
                    comment: comment || undefined,
                    publishConsent,
                    authorDisplayName: authorName || undefined,
                    punctuality: dims.punctuality === "" ? null : dims.punctuality,
                    clarity: dims.clarity === "" ? null : dims.clarity,
                    cleanliness: dims.cleanliness === "" ? null : dims.cleanliness,
                    result: dims.result === "" ? null : dims.result,
                  }),
                "Gracias por tu valoración.",
              )
            }
          >
            Enviar valoración
          </Button>
          <p className={styles.charterMeta}>
            Tu valoración es privada por defecto. Solo se muestra públicamente si la autorizas y un
            responsable la revisa.
          </p>
        </div>
      )}

      {rawStatus === "CERRADA" && reviewSubmitted && (
        <p className={styles.charterMeta}>Gracias, ya hemos recibido tu valoración.</p>
      )}
    </section>
  );
}
