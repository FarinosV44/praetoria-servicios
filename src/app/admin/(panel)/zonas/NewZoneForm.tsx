"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Alert, Button, Field } from "@/ui";
import { COVERED_MUNICIPALITIES } from "@/config/coverage";
import { createLocalPageAction } from "@/server/actions/localPage";

export function NewZoneForm() {
  const router = useRouter();
  const [municipality, setMunicipality] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setError(null);
    if (municipality.trim().length < 2) {
      setError("Indica un municipio.");
      return;
    }
    setBusy(true);
    const r = await createLocalPageAction({ municipality });
    setBusy(false);
    if (r.ok) router.push(`/admin/zonas/${r.value.id}`);
    else setError("No se ha podido crear.");
  }

  return (
    <div>
      {error && <Alert tone="warning">{error}</Alert>}
      <Field
        label="Municipio"
        list="covered-municipalities"
        value={municipality}
        onChange={(e) => setMunicipality(e.currentTarget.value)}
      />
      <datalist id="covered-municipalities">
        {COVERED_MUNICIPALITIES.map((m) => (
          <option key={m} value={m} />
        ))}
      </datalist>
      <Button onClick={submit} loading={busy}>
        Crear borrador
      </Button>
    </div>
  );
}
