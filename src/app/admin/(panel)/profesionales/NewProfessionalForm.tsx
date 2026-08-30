"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Alert, Button, Field } from "@/ui";
import { TRADES } from "@/config/trades";
import { COVERED_MUNICIPALITIES } from "@/config/coverage";
import { createProfessionalAction } from "@/server/actions/professionals";

export function NewProfessionalForm() {
  const router = useRouter();
  const [legalName, setLegalName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [taxId, setTaxId] = useState("");
  const [trades, setTrades] = useState<string[]>([]);
  const [municipalities, setMunicipalities] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggle(list: string[], v: string) {
    return list.includes(v) ? list.filter((x) => x !== v) : [...list, v];
  }

  async function submit() {
    setError(null);
    if (legalName.trim().length < 2 || displayName.trim().length < 2) {
      setError("Indica el nombre legal y el nombre visible.");
      return;
    }
    setBusy(true);
    const r = await createProfessionalAction({
      legalName,
      displayName,
      taxId: taxId || "",
      trades,
      municipalities,
    });
    setBusy(false);
    if (r.ok) router.push(`/admin/profesionales/${r.value.id}`);
    else setError("No se ha podido crear. Revisa los datos.");
  }

  return (
    <div>
      {error && <Alert tone="warning">{error}</Alert>}
      <Field label="Nombre legal" value={legalName} onChange={(e) => setLegalName(e.currentTarget.value)} />
      <Field
        label="Nombre visible para el cliente"
        value={displayName}
        onChange={(e) => setDisplayName(e.currentTarget.value)}
      />
      <Field label="NIF / CIF (opcional)" value={taxId} onChange={(e) => setTaxId(e.currentTarget.value)} />

      <fieldset>
        <legend>Oficios admitidos</legend>
        {TRADES.map((t) => (
          <label key={t.key} style={{ display: "inline-block", marginRight: "0.75rem" }}>
            <input
              type="checkbox"
              checked={trades.includes(t.key)}
              onChange={() => setTrades((l) => toggle(l, t.key))}
            />{" "}
            {t.label}
            {t.regulated ? " ⚠" : ""}
          </label>
        ))}
      </fieldset>

      <fieldset>
        <legend>Zonas cubiertas</legend>
        {COVERED_MUNICIPALITIES.map((m) => (
          <label key={m} style={{ display: "inline-block", marginRight: "0.75rem" }}>
            <input
              type="checkbox"
              checked={municipalities.includes(m)}
              onChange={() => setMunicipalities((l) => toggle(l, m))}
            />{" "}
            {m}
          </label>
        ))}
      </fieldset>

      <Button onClick={submit} loading={busy}>
        Crear como CANDIDATO
      </Button>
    </div>
  );
}
