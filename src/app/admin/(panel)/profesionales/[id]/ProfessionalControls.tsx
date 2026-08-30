"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Alert, Button, Field } from "@/ui";
import { TRADES } from "@/config/trades";
import {
  transitionProfessionalAction,
  recordVerificationAction,
  addCredentialAction,
  addDocumentAction,
  setPhotoConsentAction,
} from "@/server/actions/professionals";

const VERIF_KINDS = [
  "IDENTITY",
  "FISCAL",
  "RC_INSURANCE",
  "CREDENTIAL",
  "REFERENCES",
  "BANK_ACCOUNT",
  "CONTACT",
] as const;

export function ProfessionalControls({
  id,
  status,
  nextStatuses,
  photoConsent,
}: {
  id: string;
  status: string;
  nextStatuses: string[];
  photoConsent: boolean;
}) {
  const router = useRouter();
  const [msg, setMsg] = useState<{ tone: "ok" | "warn"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  // transition
  const [to, setTo] = useState(nextStatuses[0] ?? "");
  const [reason, setReason] = useState("");

  // verification
  const [vKind, setVKind] = useState<(typeof VERIF_KINDS)[number]>("IDENTITY");
  const [vPassed, setVPassed] = useState(true);
  const [vNote, setVNote] = useState("");
  const [vExpires, setVExpires] = useState("");

  // credential
  const [cTrade, setCTrade] = useState(TRADES.find((t) => t.regulated)?.key ?? TRADES[0].key);
  const [cLabel, setCLabel] = useState("");
  const [cRef, setCRef] = useState("");
  const [cExpires, setCExpires] = useState("");

  async function run(fn: () => Promise<{ ok: boolean; error?: { kind: string } }>, okText: string) {
    setBusy(true);
    setMsg(null);
    const r = await fn();
    setBusy(false);
    if (r.ok) {
      setMsg({ tone: "ok", text: okText });
      router.refresh();
    } else {
      setMsg({ tone: "warn", text: `No se pudo completar (${r.error?.kind ?? "error"}).` });
    }
  }

  return (
    <>
      {msg && <Alert tone={msg.tone === "ok" ? "success" : "warning"}>{msg.text}</Alert>}

      <section style={{ marginBottom: "1.5rem" }}>
        <h3>Cambiar estado ({status})</h3>
        {nextStatuses.length === 0 ? (
          <p>Estado final. No hay transiciones.</p>
        ) : (
          <>
            <select value={to} onChange={(e) => setTo(e.currentTarget.value)}>
              {nextStatuses.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <Field
              label="Motivo (obligatorio para rechazar/suspender)"
              value={reason}
              onChange={(e) => setReason(e.currentTarget.value)}
            />
            <Button
              loading={busy}
              onClick={() =>
                run(
                  () => transitionProfessionalAction(id, { to, reason: reason || undefined }),
                  "Estado actualizado.",
                )
              }
            >
              Aplicar
            </Button>
          </>
        )}
      </section>

      <section style={{ marginBottom: "1.5rem" }}>
        <h3>Registrar verificación</h3>
        <select value={vKind} onChange={(e) => setVKind(e.currentTarget.value as never)}>
          {VERIF_KINDS.map((k) => (
            <option key={k} value={k}>
              {k}
            </option>
          ))}
        </select>
        <label style={{ display: "block", margin: "0.5rem 0" }}>
          <input type="checkbox" checked={vPassed} onChange={(e) => setVPassed(e.currentTarget.checked)} />{" "}
          Comprobación superada
        </label>
        <Field label="Nota" value={vNote} onChange={(e) => setVNote(e.currentTarget.value)} />
        <Field
          label="Revisar antes de (opcional)"
          type="date"
          value={vExpires}
          onChange={(e) => setVExpires(e.currentTarget.value)}
        />
        <Button
          loading={busy}
          onClick={() =>
            run(
              () =>
                recordVerificationAction(id, {
                  kind: vKind,
                  passed: vPassed,
                  note: vNote || undefined,
                  expiresAt: vExpires || undefined,
                }),
              "Verificación registrada.",
            )
          }
        >
          Registrar
        </Button>
      </section>

      <section style={{ marginBottom: "1.5rem" }}>
        <h3>Añadir acreditación</h3>
        <select value={cTrade} onChange={(e) => setCTrade(e.currentTarget.value)}>
          {TRADES.map((t) => (
            <option key={t.key} value={t.key}>
              {t.label}
              {t.regulated ? " (regulado)" : ""}
            </option>
          ))}
        </select>
        <Field label="Descripción" value={cLabel} onChange={(e) => setCLabel(e.currentTarget.value)} />
        <Field label="Número (opcional)" value={cRef} onChange={(e) => setCRef(e.currentTarget.value)} />
        <Field
          label="Caduca (opcional)"
          type="date"
          value={cExpires}
          onChange={(e) => setCExpires(e.currentTarget.value)}
        />
        <Button
          loading={busy}
          onClick={() =>
            run(
              () =>
                addCredentialAction(id, {
                  trade: cTrade,
                  label: cLabel,
                  reference: cRef || undefined,
                  expiresAt: cExpires || undefined,
                }),
              "Acreditación añadida.",
            )
          }
        >
          Añadir
        </Button>
      </section>

      <section style={{ marginBottom: "1.5rem" }}>
        <h3>Subir documento</h3>
        <form
          action={async (fd) => {
            const r = await addDocumentAction(id, fd);
            if (r.ok) {
              setMsg({ tone: "ok", text: "Documento subido." });
              router.refresh();
            } else {
              setMsg({ tone: "warn", text: `No se pudo subir (${r.error.message ?? r.error.kind}).` });
            }
          }}
        >
          <select name="kind" defaultValue="identidad">
            {["identidad", "fiscal", "rc", "carne", "referencias", "bancario", "otro"].map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </select>
          <input type="file" name="file" accept=".pdf,image/*" required />
          <label style={{ display: "block", margin: "0.5rem 0" }}>
            Caduca (opcional) <input type="date" name="expiresAt" />
          </label>
          <Button type="submit">Subir</Button>
        </form>
        <p style={{ fontSize: "0.8rem" }}>
          Los documentos se guardan cifrados, con acceso mínimo, y se purgan a los 180 días de un
          rechazo.
        </p>
      </section>

      <section>
        <h3>Foto para el cliente</h3>
        <label>
          <input
            type="checkbox"
            checked={photoConsent}
            onChange={(e) =>
              run(() => setPhotoConsentAction(id, e.target.checked), "Consentimiento actualizado.")
            }
          />{" "}
          Consentimiento del profesional para mostrar su foto al cliente
        </label>
      </section>
    </>
  );
}
