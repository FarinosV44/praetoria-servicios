"use client";

import { useState } from "react";
import { Alert, Button, Field } from "@/ui";
import { TRADES } from "@/config/trades";
import { submitProfessionalApplicationAction } from "@/server/actions/applications";

const ERR: Record<string, string> = {
  validation: "Revisa los campos obligatorios (nombre, al menos un oficio, teléfono, email y consentimiento).",
  rate_limited: "Has enviado varias candidaturas seguidas. Inténtalo de nuevo más tarde.",
  invalid: "No hemos podido registrar la candidatura. Revisa los datos.",
};

export function ApplicationForm() {
  const [f, setF] = useState({
    name: "",
    isCompany: false,
    phone: "",
    email: "",
    availabilityNote: "",
    experienceNote: "",
    observations: "",
    municipalities: "",
    website: "", // honeypot
  });
  const [trades, setTrades] = useState<string[]>([]);
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ tone: "success" | "warning"; text: string } | null>(null);
  const [done, setDone] = useState(false);

  const set = (k: keyof typeof f) => (e: { currentTarget: { value: string } }) => {
    const v = e.currentTarget.value;
    setF((p) => ({ ...p, [k]: v }));
  };

  async function submit() {
    setMsg(null);
    if (f.name.trim().length < 2 || trades.length === 0 || f.phone.trim().length < 6 || !f.email.trim() || !consent) {
      setMsg({ tone: "warning", text: ERR.validation });
      return;
    }
    setBusy(true);
    const r = await submitProfessionalApplicationAction({
      name: f.name,
      isCompany: f.isCompany,
      trades,
      municipalities: f.municipalities.split(",").map((m) => m.trim()).filter(Boolean),
      phone: f.phone,
      email: f.email,
      availabilityNote: f.availabilityNote,
      experienceNote: f.experienceNote,
      observations: f.observations,
      consent: true,
      website: f.website,
    });
    setBusy(false);
    if (r.ok) {
      setDone(true);
      setMsg({ tone: "success", text: "Gracias. Hemos recibido tu candidatura y te contactaremos si encajamos." });
    } else {
      setMsg({ tone: "warning", text: ERR[r.error.kind] ?? "No se ha podido enviar." });
    }
  }

  if (done) return <Alert tone="success">{msg?.text}</Alert>;

  return (
    <div>
      {msg && <Alert tone={msg.tone}>{msg.text}</Alert>}

      <Field label="Nombre o empresa" value={f.name} onChange={set("name")} required />

      <label style={{ display: "block", margin: "0.5rem 0" }}>
        <input
          type="checkbox"
          checked={f.isCompany}
          onChange={(e) => {
            const checked = e.currentTarget.checked;
            setF((p) => ({ ...p, isCompany: checked }));
          }}
        />{" "}
        Soy una empresa (si no, autónomo/a)
      </label>

      <fieldset style={{ border: "1px solid var(--c-border)", borderRadius: "0.5rem", padding: "0.75rem", margin: "0.75rem 0" }}>
        <legend>Oficios *</legend>
        {TRADES.map((t) => (
          <label key={t.key} style={{ display: "inline-flex", gap: "0.35rem", marginRight: "1rem", marginBottom: "0.35rem" }}>
            <input
              type="checkbox"
              checked={trades.includes(t.key)}
              onChange={(e) => {
                const checked = e.currentTarget.checked;
                setTrades((prev) =>
                  checked ? [...prev, t.key] : prev.filter((x) => x !== t.key),
                );
              }}
            />
            {t.label}
          </label>
        ))}
      </fieldset>

      <Field
        label="Municipios que atiendes"
        hint="Separados por comas, p. ej. «Burjassot, Godella, Valencia»"
        value={f.municipalities}
        onChange={set("municipalities")}
      />
      <Field label="Teléfono" type="tel" value={f.phone} onChange={set("phone")} required />
      <Field label="Email" type="email" value={f.email} onChange={set("email")} required />
      <Field label="Disponibilidad" value={f.availabilityNote} onChange={set("availabilityNote")} />
      <Field
        as="textarea"
        label="Experiencia"
        value={f.experienceNote}
        onChange={set("experienceNote")}
      />
      <Field
        as="textarea"
        label="Observaciones (opcional)"
        value={f.observations}
        onChange={set("observations")}
      />

      {/* honeypot — visually hidden, off the tab order; a bot fills it, a person doesn't */}
      <div aria-hidden="true" style={{ position: "absolute", left: "-9999px", height: 0, overflow: "hidden" }}>
        <label>
          No rellenar
          <input
            tabIndex={-1}
            autoComplete="off"
            value={f.website}
            onChange={set("website")}
          />
        </label>
      </div>

      <label style={{ display: "block", margin: "0.75rem 0" }}>
        <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.currentTarget.checked)} />{" "}
        Autorizo a Praetoria a tratar estos datos para valorar mi incorporación a su red de
        profesionales. *
      </label>

      <Button onClick={submit} loading={busy} size="lg">
        Enviar candidatura
      </Button>
    </div>
  );
}
