"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Alert, Button } from "@/ui";
import { processQueueAction, whatsappLinkAction } from "@/server/actions/communications";
import styles from "../../../admin.module.css";

type CommRow = {
  id: string;
  channel: "EMAIL" | "WHATSAPP";
  kind: string;
  status: "PENDING" | "SENT" | "FAILED" | "LINK_PREPARED";
  subject: string | null;
  bodyPreview: string | null;
  error: string | null;
  attempts: number;
  createdAt: string;
};

const KIND_LABEL: Record<string, string> = {
  CONFIRMATION: "Confirmación de solicitud",
  INFO_REQUEST: "Petición de información",
  QUOTE_AVAILABLE: "Presupuesto disponible",
  GENERIC: "Mensaje",
};

function preview(text: string | null, max = 160): string {
  if (!text) return "";
  const one = text.replace(/\s+/g, " ").trim();
  return one.length > max ? one.slice(0, max - 1) + "…" : one;
}

export function CommsPanel({
  reference,
  communications,
}: {
  reference: string;
  communications: CommRow[];
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  const hasPending = communications.some((c) => c.status === "PENDING" || c.status === "FAILED");

  function processQueue() {
    setMsg(null);
    start(async () => {
      const r = await processQueueAction(reference);
      setMsg(
        r.ok
          ? `Cola procesada: ${r.value.sent} enviado(s), ${r.value.failed} fallido(s).`
          : `No se pudo procesar: ${r.error.kind}`,
      );
      if (r.ok) router.refresh();
    });
  }

  function whatsapp(id: string) {
    setMsg(null);
    start(async () => {
      const r = await whatsappLinkAction(reference, id);
      if (r.ok) {
        window.open(r.value.url, "_blank", "noopener,noreferrer");
        setMsg("Enlace de WhatsApp generado y abierto. El envío lo realizas tú manualmente.");
        router.refresh();
      } else {
        setMsg(`No se pudo generar el enlace: ${r.error.kind}`);
      }
    });
  }

  return (
    <section className={styles.card}>
      <h2>Comunicaciones</h2>
      {msg && <Alert tone="info">{msg}</Alert>}

      {communications.length === 0 ? (
        <p className={styles.smallprint}>Todavía no se ha generado ninguna comunicación.</p>
      ) : (
        <ul className={styles.commList}>
          {communications.map((c) => (
            <li key={c.id} className={styles.commItem}>
              <div className={styles.commMeta}>
                <span className={styles.commStatus} data-s={c.status}>
                  {c.status === "LINK_PREPARED" ? "enlace preparado" : c.status.toLowerCase()}
                </span>
                <strong>{KIND_LABEL[c.kind] ?? c.kind}</strong>
                <span className={styles.smallprint}>
                  {c.channel === "EMAIL" ? "email" : "WhatsApp"}
                  {c.attempts > 0 ? ` · ${c.attempts} intento(s)` : ""}
                </span>
              </div>
              <p className={styles.commPreview}>{preview(c.subject ?? c.bodyPreview)}</p>
              {c.error && <p className={styles.commPreview}>Error: {c.error}</p>}
              {c.channel === "WHATSAPP" && c.status === "LINK_PREPARED" && (
                <Button
                  variant="secondary"
                  size="md"
                  loading={pending}
                  onClick={() => whatsapp(c.id)}
                >
                  Generar enlace de WhatsApp
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}

      {hasPending && (
        <>
          <hr />
          <Button variant="secondary" size="md" loading={pending} onClick={processQueue}>
            Procesar cola de envíos
          </Button>
        </>
      )}
      <p className={styles.smallprint}>
        WhatsApp no se envía automáticamente: se genera un enlace que el administrador envía.
      </p>
    </section>
  );
}
