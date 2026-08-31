"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Alert, Button, Field } from "@/ui";
import { importSeoCsvAction } from "@/server/actions/seo";

export function CsvImportForm() {
  const router = useRouter();
  const [csv, setCsv] = useState("");
  const [source, setSource] = useState("gsc-csv");
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ tone: "success" | "warning"; text: string } | null>(null);

  async function submit() {
    setMsg(null);
    if (csv.trim().length < 10 || !periodStart || !periodEnd) {
      setMsg({ tone: "warning", text: "Pega el CSV e indica el período que cubre." });
      return;
    }
    setBusy(true);
    const r = await importSeoCsvAction({ csv, source, periodStart, periodEnd, note: note || undefined });
    setBusy(false);
    if (r.ok) {
      setMsg({
        tone: "success",
        text: `Importadas ${r.value.rowCount} filas. Descartadas ${r.value.skipped}${
          r.value.skippedReasons.includes("pii") ? " (algunas por contener datos personales)" : ""
        }.`,
      });
      setCsv("");
      router.refresh();
    } else {
      setMsg({
        tone: "warning",
        text: r.error.kind === "empty_csv" ? "El CSV no tiene filas válidas." : "No se ha podido importar.",
      });
    }
  }

  return (
    <div>
      {msg && <Alert tone={msg.tone}>{msg.text}</Alert>}
      <p style={{ fontSize: "var(--text-sm)", color: "var(--c-text-soft)" }}>
        Exporta el informe de rendimiento de Google Search Console a CSV y pega el contenido aquí.
        Las columnas reconocidas: consulta/query, página/page, clics, impresiones, CTR, posición,
        dispositivo. Las filas cuya consulta contenga un teléfono, correo o dirección se descartan.
      </p>
      <Field
        as="textarea"
        label="Contenido del CSV"
        value={csv}
        onChange={(e) => setCsv(e.currentTarget.value)}
        style={{ minHeight: "10rem", fontFamily: "monospace" }}
      />
      <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
        <Field label="Fuente" value={source} onChange={(e) => setSource(e.currentTarget.value)} />
        <Field
          label="Período: desde"
          type="date"
          value={periodStart}
          onChange={(e) => setPeriodStart(e.currentTarget.value)}
        />
        <Field
          label="Período: hasta"
          type="date"
          value={periodEnd}
          onChange={(e) => setPeriodEnd(e.currentTarget.value)}
        />
      </div>
      <Field label="Nota (opcional)" value={note} onChange={(e) => setNote(e.currentTarget.value)} />
      <Button onClick={submit} loading={busy}>
        Importar
      </Button>
    </div>
  );
}
