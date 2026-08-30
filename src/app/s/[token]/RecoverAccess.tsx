"use client";

import { useState, useTransition } from "react";
import { Alert, Button, Field } from "@/ui";
import { regenerateAccessAction } from "@/server/actions/clientLink";
import styles from "./link.module.css";

export function RecoverAccess() {
  const [ref, setRef] = useState("");
  const [last4, setLast4] = useState("");
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const [newUrl, setNewUrl] = useState<string | null>(null);

  function submit() {
    setMsg(null);
    setNewUrl(null);
    start(async () => {
      const r = await regenerateAccessAction(ref.trim(), last4.trim());
      if (r.ok) {
        setNewUrl(r.value.url);
        setMsg("Acceso regenerado. Guarda este nuevo enlace: es personal y caduca.");
      } else if (r.error.kind === "rate_limited") {
        setMsg("Demasiados intentos. Espera unos minutos.");
      } else if (r.error.kind === "verification_failed" || r.error.kind === "request_not_found") {
        setMsg("La referencia o los 4 dígitos no coinciden.");
      } else {
        setMsg("No hemos podido regenerar el acceso.");
      }
    });
  }

  return (
    <div>
      {msg && <Alert tone={newUrl ? "success" : "warning"}>{msg}</Alert>}
      {newUrl ? (
        <p>
          <a href={newUrl}>Abrir mi solicitud</a>
        </p>
      ) : (
        <>
          <Field
            label="Referencia de la solicitud"
            placeholder="PS-XXXX-XXXX"
            value={ref}
            onChange={(e) => setRef(e.currentTarget.value)}
          />
          <Field
            label="Últimos 4 dígitos de tu teléfono"
            inputMode="numeric"
            maxLength={4}
            className={styles.verifyField}
            value={last4}
            onChange={(e) => setLast4(e.currentTarget.value.replace(/\D/g, ""))}
          />
          <Button onClick={submit} loading={pending} size="md">
            Recuperar acceso
          </Button>
        </>
      )}
    </div>
  );
}
