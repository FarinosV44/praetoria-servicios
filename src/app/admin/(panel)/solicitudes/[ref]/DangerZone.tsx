"use client";

import { useState, useTransition } from "react";
import { Alert, Button, Field, Modal } from "@/ui";
import { deleteRequestAction, exportRequestAction } from "@/server/actions/admin";
import styles from "../../../admin.module.css";

/**
 * Data-subject tools (issue #17): export the request as JSON, or hard-delete it
 * (with a reason, logged). Both actions are recorded in the ops log.
 */
export function DangerZone({ reference }: { reference: string }) {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [reason, setReason] = useState("");

  function doExport() {
    setMsg(null);
    start(async () => {
      const r = await exportRequestAction(reference);
      if (!r.ok) {
        setMsg(`No se pudo exportar: ${r.error.kind}`);
        return;
      }
      const blob = new Blob([r.value.json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `solicitud-${reference}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setMsg("Exportación descargada.");
    });
  }

  function doDelete() {
    if (!reason.trim()) return;
    start(async () => {
      const r = await deleteRequestAction(reference, reason);
      // success redirects to /admin; only errors return here
      if (!r.ok) setMsg(`No se pudo eliminar: ${r.error.kind}`);
      setConfirmOpen(false);
    });
  }

  return (
    <section className={styles.card}>
      <h2>Datos y retención</h2>
      {msg && <Alert tone="info">{msg}</Alert>}
      <div className={styles.statusBtns}>
        <Button variant="secondary" size="md" loading={pending} onClick={doExport}>
          Exportar solicitud (JSON)
        </Button>
        <Button variant="danger" size="md" onClick={() => setConfirmOpen(true)}>
          Eliminar solicitud y archivos
        </Button>
      </div>
      <p className={styles.smallprint}>
        La eliminación borra la solicitud, sus fotos y los documentos de seguro de forma
        irreversible. Queda registrada en el log de operaciones.
      </p>

      <Modal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Eliminar la solicitud"
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmOpen(false)}>
              Cancelar
            </Button>
            <Button variant="danger" disabled={!reason.trim() || pending} onClick={doDelete}>
              Eliminar definitivamente
            </Button>
          </>
        }
      >
        <p>
          Esta acción no se puede deshacer. Se borrarán la solicitud <strong>{reference}</strong>,
          sus fotos y cualquier documento de seguro.
        </p>
        <Field
          as="textarea"
          label="Motivo (obligatorio, queda registrado)"
          value={reason}
          onChange={(e) => setReason(e.currentTarget.value)}
        />
      </Modal>
    </section>
  );
}
