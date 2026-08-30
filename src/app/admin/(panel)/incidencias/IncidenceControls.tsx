"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Field } from "@/ui";
import {
  allowedNextIncidenceStatuses,
  type IncidenceStatus,
} from "@/domain/service-closure/incidence";
import { SERVICE_CLOSURE } from "@/config/service-closure";
import {
  classifyIncidenceAction,
  transitionIncidenceAction,
} from "@/server/actions/incidences";

export function IncidenceControls({ id, status }: { id: string; status: IncidenceStatus }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [kind, setKind] = useState<string>(SERVICE_CLOSURE.incidenceKinds[0]);
  const [to, setTo] = useState<IncidenceStatus>(allowedNextIncidenceStatuses(status)[0]);
  const [reason, setReason] = useState("");
  const [evidence, setEvidence] = useState("");

  const closing = to === "RESUELTA" || to === "DESESTIMADA";

  async function run(fn: () => Promise<{ ok: boolean; error?: { kind: string } }>) {
    setBusy(true);
    setError(null);
    const r = await fn();
    setBusy(false);
    if (r.ok) router.refresh();
    else
      setError(
        r.error?.kind === "reason_required"
          ? "Indica un motivo."
          : r.error?.kind === "evidence_required"
            ? "Indica la evidencia que respalda el cierre."
            : `Error (${r.error?.kind ?? "?"}).`,
      );
  }

  return (
    <div style={{ minWidth: "18rem" }}>
      {error && <p style={{ color: "var(--c-danger)" }}>{error}</p>}

      {(status === "ABIERTA" || status === "EN_CLASIFICACION") && (
        <div>
          <select value={kind} onChange={(e) => setKind(e.currentTarget.value)}>
            {SERVICE_CLOSURE.incidenceKinds.map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </select>
          <Button
            loading={busy}
            onClick={() => run(() => classifyIncidenceAction(id, { kind }))}
          >
            {status === "ABIERTA" ? "Clasificar" : "Pasar a en curso"}
          </Button>
        </div>
      )}

      <div style={{ marginTop: "0.5rem" }}>
        <select value={to} onChange={(e) => setTo(e.currentTarget.value as IncidenceStatus)}>
          {allowedNextIncidenceStatuses(status).map((s) => (
            <option key={s} value={s}>
              → {s}
            </option>
          ))}
        </select>
        {closing && (
          <>
            <Field label="Motivo" value={reason} onChange={(e) => setReason(e.currentTarget.value)} />
            <Field
              label="Evidencia (qué lo respalda)"
              value={evidence}
              onChange={(e) => setEvidence(e.currentTarget.value)}
            />
          </>
        )}
        <Button
          variant="secondary"
          loading={busy}
          onClick={() =>
            run(() =>
              transitionIncidenceAction(id, {
                to,
                reason: reason || undefined,
                evidenceNote: evidence || undefined,
              }),
            )
          }
        >
          Aplicar
        </Button>
      </div>
    </div>
  );
}
