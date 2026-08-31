"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Alert, Button, Field } from "@/ui";
import { allowedNextApplicationStatuses, type ApplicationStatus } from "@/domain/professionals/application";
import {
  addApplicationNoteAction,
  convertApplicationAction,
  setApplicationStatusAction,
} from "@/server/actions/adminApplications";

export function ApplicationRow({
  id,
  status,
  converted,
}: {
  id: string;
  status: string;
  converted: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ tone: "success" | "warning"; text: string } | null>(null);
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");

  async function run(
    fn: () => Promise<{ ok: boolean; error?: { kind: string; message?: string } }>,
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

  const next = allowedNextApplicationStatuses(status as ApplicationStatus);

  return (
    <div style={{ marginTop: "0.5rem" }}>
      {msg && <Alert tone={msg.tone}>{msg.text}</Alert>}

      <div style={{ display: "flex", gap: "0.5rem", alignItems: "flex-end", flexWrap: "wrap" }}>
        {next.map((to) =>
          to === "RECHAZADA" ? null : (
            <Button
              key={to}
              variant="secondary"
              loading={busy}
              onClick={() => run(() => setApplicationStatusAction(id, { to }), `Estado → ${to}.`)}
            >
              Pasar a {to}
            </Button>
          ),
        )}
        {next.includes("RECHAZADA") && (
          <>
            <Field label="Motivo de rechazo" value={reason} onChange={(e) => setReason(e.currentTarget.value)} />
            <Button
              variant="ghost"
              loading={busy}
              onClick={() => run(() => setApplicationStatusAction(id, { to: "RECHAZADA", reason }), "Rechazada.")}
            >
              Rechazar
            </Button>
          </>
        )}
      </div>

      <div style={{ display: "flex", gap: "0.5rem", alignItems: "flex-end", flexWrap: "wrap", marginTop: "0.5rem" }}>
        <Field label="Nota interna" value={note} onChange={(e) => setNote(e.currentTarget.value)} />
        <Button
          variant="secondary"
          loading={busy}
          onClick={() => run(() => addApplicationNoteAction(id, note), "Nota añadida.")}
        >
          Añadir nota
        </Button>
      </div>

      {status === "APROBADA" && !converted && (
        <Button
          loading={busy}
          onClick={() => run(() => convertApplicationAction(id), "Convertida a profesional CANDIDATO.")}
          style={{ marginTop: "0.5rem" }}
        >
          Convertir en profesional (CANDIDATO)
        </Button>
      )}
    </div>
  );
}
