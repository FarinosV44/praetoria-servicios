"use client";

import { useState } from "react";
import { Alert, Button, Field } from "@/ui";
import { COPY } from "@/config/copy";
import styles from "./assistant.module.css";

type Channel = "WHATSAPP" | "EMAIL";

/**
 * Contact + granular consent (issue #10). No account. At least one of phone/email.
 * Marketing is never pre-checked. The privacy policy is linked before submit.
 */
export function ContactStep({
  defaultChannel,
  onSubmit,
  onBack,
  busy,
}: {
  defaultChannel: Channel;
  onSubmit: (contact: unknown) => Promise<{ ok: boolean; fieldErrors?: Record<string, string[]> }>;
  onBack: () => void;
  busy: boolean;
}) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [channel, setChannel] = useState<Channel>(defaultChannel);
  const [availability, setAvailability] = useState("");
  const [consentHandling, setConsentHandling] = useState(false);
  const [consentOps, setConsentOps] = useState(true);
  const [consentMarketing, setConsentMarketing] = useState(false);
  const [consentAnalytics, setConsentAnalytics] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [topError, setTopError] = useState<string | null>(null);

  async function submit() {
    setTopError(null);
    setErrors({});
    if (!consentHandling) {
      setTopError("Necesitamos tu permiso para gestionar la solicitud.");
      return;
    }
    const res = await onSubmit({
      name,
      phone: phone || "",
      email: email || "",
      preferredChannel: channel,
      availabilityNote: availability || undefined,
      consent: {
        requestHandling: true,
        operationalComms: consentOps,
        marketing: consentMarketing,
        analytics: consentAnalytics,
        textVersion: "v1-2026-08",
      },
    });
    if (!res.ok) {
      setErrors(res.fieldErrors ?? {});
      if (!res.fieldErrors) setTopError(COPY.common.errorGeneric);
    }
  }

  const fe = (k: string) => errors[k]?.[0];

  return (
    <>
      <p className={styles.lead}>Sin crear ninguna cuenta. Solo lo necesario para responderte.</p>
      {topError && <Alert tone="warning">{topError}</Alert>}

      <Field
        label="Nombre"
        value={name}
        onChange={(e) => setName(e.currentTarget.value)}
        required
        error={fe("name")}
      />
      <Field
        label="Teléfono"
        inputMode="tel"
        value={phone}
        onChange={(e) => setPhone(e.currentTarget.value)}
        hint="Móvil o fijo español"
        error={fe("phone")}
      />
      <Field
        label="Correo electrónico"
        type="email"
        inputMode="email"
        value={email}
        onChange={(e) => setEmail(e.currentTarget.value)}
        error={fe("email")}
      />

      <fieldset className={styles.fieldset}>
        <legend className={styles.legend}>¿Cómo prefieres que te contactemos?</legend>
        <label className={styles.check}>
          <input
            type="radio"
            name="channel"
            checked={channel === "WHATSAPP"}
            onChange={() => setChannel("WHATSAPP")}
          />
          <span>WhatsApp</span>
        </label>
        <label className={styles.check}>
          <input
            type="radio"
            name="channel"
            checked={channel === "EMAIL"}
            onChange={() => setChannel("EMAIL")}
          />
          <span>Correo electrónico</span>
        </label>
      </fieldset>

      <Field
        label="¿Alguna franja en la que te viene mejor? (opcional)"
        value={availability}
        onChange={(e) => setAvailability(e.currentTarget.value)}
      />

      <fieldset className={styles.fieldset}>
        <legend className={styles.legend}>Consentimientos</legend>
        <label className={styles.check}>
          <input
            type="checkbox"
            checked={consentHandling}
            onChange={(e) => setConsentHandling(e.currentTarget.checked)}
          />
          <span>
            Autorizo a Praetoria a gestionar esta solicitud y tratar mis datos y fotos con esa
            finalidad. He leído la{" "}
            <a href="/legal/privacidad" target="_blank" rel="noreferrer">
              política de privacidad
            </a>
            .
          </span>
        </label>
        <label className={styles.check}>
          <input
            type="checkbox"
            checked={consentOps}
            onChange={(e) => setConsentOps(e.currentTarget.checked)}
          />
          <span>Quiero recibir avisos sobre el estado de mi solicitud por el canal elegido.</span>
        </label>
        <label className={styles.check}>
          <input
            type="checkbox"
            checked={consentMarketing}
            onChange={(e) => setConsentMarketing(e.currentTarget.checked)}
          />
          <span>Acepto recibir consejos y novedades de Praetoria (opcional).</span>
        </label>
        <label className={styles.check}>
          <input
            type="checkbox"
            checked={consentAnalytics}
            onChange={(e) => setConsentAnalytics(e.currentTarget.checked)}
          />
          <span>
            Acepto el uso de estadísticas anónimas de navegación para mejorar el servicio. No se
            registran tu teléfono, tu correo, tus fotos ni la descripción del problema (opcional).
          </span>
        </label>
      </fieldset>

      <div className={styles.nav}>
        <Button variant="ghost" onClick={onBack}>
          {COPY.common.back}
        </Button>
        <Button onClick={submit} loading={busy}>
          Enviar solicitud
        </Button>
      </div>
    </>
  );
}
