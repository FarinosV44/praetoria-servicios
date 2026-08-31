"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Alert, Button, Field } from "@/ui";
import {
  moderateReviewAction,
  openIncidenceFromReviewAction,
  redactReviewAction,
  respondReviewAction,
} from "@/server/actions/reviews";

export function ReviewModeration({
  id,
  status,
  piiFlagged,
  hasIncidence,
}: {
  id: string;
  status: string;
  piiFlagged: boolean;
  hasIncidence: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ tone: "success" | "warning"; text: string } | null>(null);
  const [reason, setReason] = useState("");
  const [response, setResponse] = useState("");

  async function run(
    fn: () => Promise<{ ok: boolean; error?: { kind: string; message?: string }; value?: unknown }>,
    okText: string,
  ) {
    setBusy(true);
    setMsg(null);
    const r = await fn();
    setBusy(false);
    if (r.ok) {
      setMsg({ tone: "success", text: okText });
      router.refresh();
    } else {
      setMsg({ tone: "warning", text: r.error?.message ?? `Error (${r.error?.kind}).` });
    }
  }

  const canModerate = status === "PENDIENTE" || status === "RETENIDA_PII";

  return (
    <div style={{ marginTop: "0.5rem" }}>
      {msg && <Alert tone={msg.tone}>{msg.text}</Alert>}

      {piiFlagged && (
        <Button variant="secondary" loading={busy} onClick={() => run(() => redactReviewAction(id), "Datos personales depurados.")}>
          Depurar datos personales
        </Button>
      )}

      {canModerate && (
        <>
          <Button
            loading={busy}
            onClick={() => run(() => moderateReviewAction(id, { to: "AUTORIZADA" }), "Publicada.")}
          >
            Autorizar publicación
          </Button>
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "flex-end", flexWrap: "wrap", marginTop: "0.5rem" }}>
            <Field label="Motivo (para no publicar / retener)" value={reason} onChange={(e) => setReason(e.currentTarget.value)} />
            <Button
              variant="ghost"
              loading={busy}
              onClick={() => run(() => moderateReviewAction(id, { to: "RECHAZADA", reason }), "Rechazada.")}
            >
              No publicar
            </Button>
            {status !== "RETENIDA_PII" && (
              <Button
                variant="ghost"
                loading={busy}
                onClick={() => run(() => moderateReviewAction(id, { to: "RETENIDA_PII", reason }), "Retenida.")}
              >
                Retener por datos
              </Button>
            )}
          </div>
        </>
      )}

      {status === "AUTORIZADA" && (
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "flex-end", flexWrap: "wrap", marginTop: "0.5rem" }}>
          <Field label="Motivo de retirada" value={reason} onChange={(e) => setReason(e.currentTarget.value)} />
          <Button
            variant="ghost"
            loading={busy}
            onClick={() => run(() => moderateReviewAction(id, { to: "RETIRADA", reason }), "Retirada.")}
          >
            Retirar (rectificación / derecho del cliente)
          </Button>
        </div>
      )}

      <div style={{ display: "flex", gap: "0.5rem", alignItems: "flex-end", flexWrap: "wrap", marginTop: "0.5rem" }}>
        <Field label="Respuesta pública de Praetoria" value={response} onChange={(e) => setResponse(e.currentTarget.value)} />
        <Button
          variant="secondary"
          loading={busy}
          onClick={() => run(() => respondReviewAction(id, response), "Respuesta guardada.")}
        >
          Guardar respuesta
        </Button>
      </div>

      {!hasIncidence && (
        <Button
          variant="ghost"
          loading={busy}
          onClick={() => run(() => openIncidenceFromReviewAction(id), "Incidencia abierta.")}
          style={{ marginTop: "0.5rem" }}
        >
          Abrir incidencia desde esta opinión
        </Button>
      )}
    </div>
  );
}
