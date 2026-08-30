"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Alert, Button, Field } from "@/ui";
import { WARRANTY_KINDS, warrantyKindLabel } from "@/domain/service-closure/incidence";
import { recordCompletionAction } from "@/server/actions/incidences";
import styles from "../../../admin.module.css";

export function CompletionPanel({
  requestId,
  reference,
  current,
}: {
  requestId: string;
  reference: string;
  current: {
    completedAt: string;
    workDone: string;
    warrantyKind: string | null;
    acceptedQuoteVersion: number | null;
    clientConfirmedAt: string | null;
  } | null;
}) {
  const router = useRouter();
  const [workDone, setWorkDone] = useState(current?.workDone ?? "");
  const [materialsNote, setMaterialsNote] = useState("");
  const [approvedExtrasNote, setApprovedExtrasNote] = useState("");
  const [completedAt, setCompletedAt] = useState(
    (current?.completedAt ?? new Date().toISOString()).slice(0, 10),
  );
  const [warrantyKind, setWarrantyKind] = useState(current?.warrantyKind ?? "");
  const [warrantyText, setWarrantyText] = useState("");
  const [warrantyExclusions, setWarrantyExclusions] = useState("");
  const [warrantyResponsible, setWarrantyResponsible] = useState("Praetoria Servicios");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ tone: "success" | "warning"; text: string } | null>(null);

  async function submit() {
    setBusy(true);
    setMsg(null);
    const r = await recordCompletionAction(requestId, reference, {
      completedAt,
      workDone,
      materialsNote: materialsNote || undefined,
      approvedExtrasNote: approvedExtrasNote || undefined,
      warrantyKind: warrantyKind || null,
      warrantyText: warrantyText || undefined,
      warrantyExclusions: warrantyExclusions || undefined,
      warrantyResponsible: warrantyResponsible || undefined,
    });
    setBusy(false);
    if (r.ok) {
      setMsg({ tone: "success", text: "Cierre registrado. El cliente puede confirmarlo desde su enlace." });
      router.refresh();
    } else {
      setMsg({ tone: "warning", text: `No se pudo registrar (${r.error.kind}).` });
    }
  }

  return (
    <section className={styles.card}>
      <h2>Cierre del trabajo</h2>
      {current && (
        <p className={styles.smallprint}>
          Registrado. Presupuesto v{current.acceptedQuoteVersion ?? "—"}.{" "}
          {current.clientConfirmedAt
            ? `Confirmado por el cliente el ${new Date(current.clientConfirmedAt).toLocaleDateString("es-ES")}.`
            : "Pendiente de confirmación del cliente."}
        </p>
      )}
      {msg && <Alert tone={msg.tone}>{msg.text}</Alert>}

      <Field label="Fecha" type="date" value={completedAt} onChange={(e) => setCompletedAt(e.currentTarget.value)} />
      <Field as="textarea" label="Trabajos realizados" value={workDone} onChange={(e) => setWorkDone(e.currentTarget.value)} />
      <Field as="textarea" label="Materiales (opcional)" value={materialsNote} onChange={(e) => setMaterialsNote(e.currentTarget.value)} />
      <Field
        as="textarea"
        label="Extras aprobados (opcional) — cómo y cuándo se aprobaron"
        value={approvedExtrasNote}
        onChange={(e) => setApprovedExtrasNote(e.currentTarget.value)}
      />

      <label>
        Tipo de garantía{" "}
        <select value={warrantyKind} onChange={(e) => setWarrantyKind(e.currentTarget.value)}>
          <option value="">— sin especificar —</option>
          {WARRANTY_KINDS.map((k) => (
            <option key={k} value={k}>
              {warrantyKindLabel(k)}
            </option>
          ))}
        </select>
      </label>
      <Field as="textarea" label="Texto de la garantía" value={warrantyText} onChange={(e) => setWarrantyText(e.currentTarget.value)} />
      <Field as="textarea" label="Exclusiones" value={warrantyExclusions} onChange={(e) => setWarrantyExclusions(e.currentTarget.value)} />
      <Field label="Responsable de la garantía" value={warrantyResponsible} onChange={(e) => setWarrantyResponsible(e.currentTarget.value)} />

      <Button onClick={submit} loading={busy} disabled={workDone.trim().length < 5}>
        {current ? "Actualizar cierre" : "Registrar cierre"}
      </Button>
    </section>
  );
}
