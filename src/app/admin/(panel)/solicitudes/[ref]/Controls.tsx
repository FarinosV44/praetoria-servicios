"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Alert, Button, Field, Modal } from "@/ui";
import { TRADES } from "@/config/trades";
import { allowedNextStatuses, type RequestStatus } from "@/domain/requests/state-machine";
import {
  changeStatusAction,
  requestMoreInfoAction,
  updateClassificationAction,
} from "@/server/actions/admin";
import styles from "../../../admin.module.css";

const REASON_REQUIRED: string[] = [
  "EN_REVISION->RECHAZADA",
  "PRESUPUESTO_ENVIADO->RECHAZADA",
  "PENDIENTE_ANALISIS->CANCELADA",
  "EN_REVISION->CANCELADA",
];
const CONFIRM: RequestStatus[] = ["RECHAZADA", "CANCELADA", "CERRADA"];

export function AdminRequestControls({
  reference,
  status,
  trade,
  urgency,
}: {
  reference: string;
  status: RequestStatus;
  trade: string;
  urgency: string;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const [tradeVal, setTradeVal] = useState(trade);
  const [urgencyVal, setUrgencyVal] = useState(urgency);
  const [note, setNote] = useState("");
  const [infoMsg, setInfoMsg] = useState("");
  const [confirmTo, setConfirmTo] = useState<RequestStatus | null>(null);
  const [reason, setReason] = useState("");

  const nexts = allowedNextStatuses(status);

  function saveClassification() {
    setMsg(null);
    start(async () => {
      const r = await updateClassificationAction(reference, {
        trade: tradeVal || undefined,
        urgency: (urgencyVal || undefined) as never,
        internalNote: note || undefined,
      });
      setMsg(r.ok ? "Clasificación guardada." : "No se pudo guardar.");
      if (r.ok) {
        setNote("");
        router.refresh();
      }
    });
  }

  function doStatus(to: RequestStatus, why?: string) {
    setMsg(null);
    start(async () => {
      const r = await changeStatusAction(reference, to, why);
      setMsg(r.ok ? `Estado cambiado a ${to}.` : `No se pudo: ${r.error.kind}`);
      setConfirmTo(null);
      setReason("");
      if (r.ok) router.refresh();
    });
  }

  function handleStatusClick(to: RequestStatus) {
    const needsReason = REASON_REQUIRED.includes(`${status}->${to}`);
    if (CONFIRM.includes(to) || needsReason) {
      setConfirmTo(to);
    } else {
      doStatus(to);
    }
  }

  function sendInfoRequest() {
    if (!infoMsg.trim()) return;
    setMsg(null);
    start(async () => {
      const r = await requestMoreInfoAction(reference, infoMsg);
      setMsg(r.ok ? "Solicitud de información registrada." : `No se pudo: ${r.error.kind}`);
      if (r.ok) {
        setInfoMsg("");
        router.refresh();
      }
    });
  }

  return (
    <section className={styles.card}>
      <h2>Gestión</h2>
      {msg && <Alert tone="info">{msg}</Alert>}

      <h3>Clasificación</h3>
      <label className={styles.miniLabel}>
        Oficio
        <select value={tradeVal} onChange={(e) => setTradeVal(e.target.value)}>
          <option value="">Sin asignar</option>
          {TRADES.map((t) => (
            <option key={t.key} value={t.key}>
              {t.label}
            </option>
          ))}
        </select>
      </label>
      <label className={styles.miniLabel}>
        Urgencia
        <select value={urgencyVal} onChange={(e) => setUrgencyVal(e.target.value)}>
          <option value="">Sin asignar</option>
          {["BAJA", "MEDIA", "ALTA", "EMERGENCIA"].map((u) => (
            <option key={u} value={u}>
              {u}
            </option>
          ))}
        </select>
      </label>
      <Field
        as="textarea"
        label="Nota interna (no visible para el cliente)"
        value={note}
        onChange={(e) => setNote(e.currentTarget.value)}
      />
      <Button onClick={saveClassification} loading={pending} size="md">
        Guardar clasificación
      </Button>

      <h3>Cambiar estado</h3>
      {nexts.length === 0 ? (
        <p className={styles.smallprint}>Estado final, sin transiciones.</p>
      ) : (
        <div className={styles.statusBtns}>
          {nexts.map((to) => (
            <Button key={to} variant="secondary" size="md" onClick={() => handleStatusClick(to)}>
              {to}
            </Button>
          ))}
        </div>
      )}

      <h3>Pedir información al cliente</h3>
      <Field
        as="textarea"
        label="Qué falta"
        value={infoMsg}
        onChange={(e) => setInfoMsg(e.currentTarget.value)}
      />
      <Button variant="secondary" size="md" onClick={sendInfoRequest} loading={pending}>
        Registrar petición
      </Button>

      <Modal
        open={confirmTo !== null}
        onClose={() => setConfirmTo(null)}
        title={`Cambiar a ${confirmTo}`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmTo(null)}>
              Cancelar
            </Button>
            <Button
              variant="danger"
              disabled={
                confirmTo !== null &&
                REASON_REQUIRED.includes(`${status}->${confirmTo}`) &&
                !reason.trim()
              }
              onClick={() => confirmTo && doStatus(confirmTo, reason || undefined)}
            >
              Confirmar
            </Button>
          </>
        }
      >
        <p>Esta acción queda registrada con tu usuario.</p>
        <Field
          as="textarea"
          label="Motivo"
          value={reason}
          onChange={(e) => setReason(e.currentTarget.value)}
        />
      </Modal>
    </section>
  );
}
