"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Alert, Button, Field } from "@/ui";
import { assignProfessionalAction } from "@/server/actions/professionals";
import styles from "../../../admin.module.css";

interface ProOption {
  id: string;
  reference: string;
  displayName: string;
  trades: string[];
  municipalities: string[];
}

export function AssignPanel({
  requestId,
  reference,
  current,
  professionals,
}: {
  requestId: string;
  reference: string;
  current: { displayName: string; reference: string } | null;
  professionals: ProOption[];
}) {
  const router = useRouter();
  const [proId, setProId] = useState(professionals[0]?.id ?? "");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ tone: "success" | "warning"; text: string } | null>(null);

  async function assign() {
    setBusy(true);
    setMsg(null);
    const r = await assignProfessionalAction({ requestId, professionalId: proId, reason: reason || undefined, reference });
    setBusy(false);
    if (r.ok) {
      setMsg({ tone: "success", text: "Profesional asignado." });
      router.refresh();
    } else if (r.error.kind === "incompatible") {
      setMsg({ tone: "warning", text: `Asignación bloqueada: ${r.error.message}` });
    } else {
      setMsg({ tone: "warning", text: `No se pudo asignar (${r.error.kind}).` });
    }
  }

  return (
    <section className={styles.card}>
      <h2>Profesional asignado</h2>
      {current ? (
        <p>
          <strong>{current.displayName}</strong> ({current.reference})
        </p>
      ) : (
        <p>Sin asignar.</p>
      )}

      {professionals.length === 0 ? (
        <p>No hay profesionales APROBADOS. Da de alta y aprueba profesionales en la red.</p>
      ) : (
        <>
          {msg && <Alert tone={msg.tone}>{msg.text}</Alert>}
          <label>
            {current ? "Sustituir por" : "Asignar a"}
            <select value={proId} onChange={(e) => setProId(e.currentTarget.value)}>
              {professionals.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.reference} · {p.displayName} · {p.trades.join("/")} · {p.municipalities.join("/")}
                </option>
              ))}
            </select>
          </label>
          {current && (
            <Field
              label="Motivo de la sustitución"
              value={reason}
              onChange={(e) => setReason(e.currentTarget.value)}
            />
          )}
          <Button onClick={assign} loading={busy}>
            {current ? "Sustituir" : "Asignar"}
          </Button>
          <p className={styles.smallprint} style={{ fontSize: "0.85rem" }}>
            El panel rechaza asignaciones incompatibles con el oficio, la zona, el estado del
            profesional o una acreditación caducada.
          </p>
        </>
      )}
    </section>
  );
}
