"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Alert, Button } from "@/ui";
import {
  adminAnalyzeInsuranceAction,
  adminDeleteInsuranceDocAction,
  adminPurgeInsuranceAction,
} from "@/server/actions/insurance";
import styles from "../../../admin.module.css";

type RefItem = { text: string; ref: { doc: string; page: number } | null };
type Doc = {
  id: string;
  kindLabel: string;
  contentType: string;
  byteSize: number;
  ocrUsed: boolean;
  pageCount: number | null;
  url: string | null;
};
type Extraction = {
  coverages: RefItem[];
  limits: RefItem[];
  franchises: RefItem[];
  exclusions: RefItem[];
  notes: RefItem[];
};

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Sin analizar",
  PARTIAL: "Extracción parcial",
  DONE: "Extracción completa",
  UNREADABLE: "No legible",
};

function RefList({ title, items }: { title: string; items: RefItem[] }) {
  if (items.length === 0) return null;
  return (
    <>
      <h4>{title}</h4>
      <ul>
        {items.map((i, n) => (
          <li key={n}>
            {i.text}
            {i.ref ? <span className={styles.smallprint}> (pág. {i.ref.page})</span> : null}
          </li>
        ))}
      </ul>
    </>
  );
}

export function InsurancePanel({
  reference,
  insurance,
}: {
  reference: string;
  insurance: {
    consentGiven: boolean;
    extractionStatus: string;
    insurerName: string | null;
    policyNumber: string | null;
    validFrom: string | null;
    validTo: string | null;
    missingDocsNote: string | null;
    extraction: Extraction | null;
    documents: Doc[];
  };
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  const act = (fn: () => Promise<{ ok: boolean; error?: { kind: string } }>, okMsg: string) => {
    setMsg(null);
    start(async () => {
      const r = await fn();
      setMsg(r.ok ? okMsg : `No se pudo: ${r.error?.kind}`);
      if (r.ok) router.refresh();
    });
  };

  return (
    <section className={styles.card}>
      <h2>Seguro</h2>
      {msg && <Alert tone="info">{msg}</Alert>}

      <p className={styles.smallprint}>
        Consentimiento de análisis: {insurance.consentGiven ? "concedido" : "no concedido"} · Estado:{" "}
        {STATUS_LABEL[insurance.extractionStatus] ?? insurance.extractionStatus}
      </p>

      <dl className={styles.dl}>
        <div>
          <dt>Aseguradora</dt>
          <dd>{insurance.insurerName ?? "—"}</dd>
        </div>
        <div>
          <dt>Póliza</dt>
          <dd>{insurance.policyNumber ?? "—"}</dd>
        </div>
        <div>
          <dt>Vigencia</dt>
          <dd>
            {insurance.validFrom?.slice(0, 10) ?? "—"} → {insurance.validTo?.slice(0, 10) ?? "—"}
          </dd>
        </div>
      </dl>

      {insurance.missingDocsNote && (
        <Alert tone="warning">Parece que falta: {insurance.missingDocsNote}</Alert>
      )}

      <h3>Documentos ({insurance.documents.length})</h3>
      <ul className={styles.commList}>
        {insurance.documents.map((d) => (
          <li key={d.id} className={styles.commItem}>
            <div className={styles.commMeta}>
              <strong>{d.kindLabel}</strong>
              <span className={styles.smallprint}>
                {d.contentType} · {(d.byteSize / 1024).toFixed(0)} KB
                {d.pageCount != null ? ` · ${d.pageCount} pág.` : ""}
                {d.ocrUsed ? " · OCR" : ""}
              </span>
            </div>
            <div className={styles.statusBtns}>
              {d.url && (
                <a href={d.url} target="_blank" rel="noreferrer">
                  Ver (enlace temporal)
                </a>
              )}
              <Button
                variant="secondary"
                size="md"
                loading={pending}
                onClick={() =>
                  act(
                    () => adminDeleteInsuranceDocAction(reference, d.id),
                    "Documento eliminado y verificado.",
                  )
                }
              >
                Eliminar
              </Button>
            </div>
          </li>
        ))}
      </ul>

      {insurance.extraction && (
        <>
          <h3>Extracción orientativa</h3>
          <RefList title="Garantías" items={insurance.extraction.coverages} />
          <RefList title="Límites / capitales" items={insurance.extraction.limits} />
          <RefList title="Franquicias" items={insurance.extraction.franchises} />
          <RefList title="Exclusiones" items={insurance.extraction.exclusions} />
        </>
      )}

      <div className={styles.statusBtns}>
        <Button
          variant="secondary"
          size="md"
          loading={pending}
          onClick={() =>
            act(() => adminAnalyzeInsuranceAction(reference), "Extracción actualizada.")
          }
        >
          Re-analizar
        </Button>
        <Button
          variant="danger"
          size="md"
          loading={pending}
          onClick={() =>
            act(() => adminPurgeInsuranceAction(reference), "Caso de seguro eliminado (retención).")
          }
        >
          Eliminar todo (retención)
        </Button>
      </div>
    </section>
  );
}
