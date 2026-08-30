"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Alert, Button } from "@/ui";
import { COPY } from "@/config/copy";
import { DOC_KINDS, DOC_KIND_LABEL } from "@/domain/insurance/schema";
import { setInsuranceConsentAction } from "@/server/actions/insurance";
import styles from "./link.module.css";

type Doc = { id: string; kindLabel: string; ocrUsed: boolean; pageCount: number | null };

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Sin documentos todavía",
  PARTIAL: "Lectura parcial",
  DONE: "Lectura completada",
  UNREADABLE: "No se ha podido leer",
};

export function InsuranceSection({
  token,
  consentGiven,
  status,
  insurerName,
  policyNumber,
  missingDocsNote,
  documents,
}: {
  token: string;
  consentGiven: boolean;
  status: string | null;
  insurerName: string | null;
  policyNumber: string | null;
  missingDocsNote: string | null;
  documents: Doc[];
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [notice, setNotice] = useState<string | null>(null);
  const [kind, setKind] = useState<string>(DOC_KINDS[0]);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const c = COPY.insurance;

  function grantConsent() {
    setNotice(null);
    start(async () => {
      const r = await setInsuranceConsentAction(token, true);
      if (r.ok) router.refresh();
      else setNotice("No hemos podido registrar tu autorización.");
    });
  }

  async function upload() {
    const file = fileRef.current?.files?.[0];
    if (!file) return;
    setNotice(null);
    setUploading(true);
    try {
      const form = new FormData();
      form.append("token", token);
      form.append("kind", kind);
      form.append("file", file, file.name);
      const res = await fetch("/api/insurance/documents", { method: "POST", body: form });
      if (res.ok) {
        setNotice("Documento subido. Lo hemos leído de forma orientativa.");
        if (fileRef.current) fileRef.current.value = "";
        router.refresh();
      } else {
        const body = await res.json().catch(() => ({}));
        setNotice(
          body.message ?? "No hemos podido subir el documento. Revisa el formato o el tamaño.",
        );
      }
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className={styles.card}>
      <h2>{c.heading}</h2>
      <p>{c.intro}</p>

      {notice && <Alert tone="info">{notice}</Alert>}

      {!consentGiven ? (
        <>
          <p className={styles.smallprint}>{c.consentNeeded}</p>
          <label style={{ display: "block", margin: "0.5rem 0" }}>
            <input type="checkbox" id="ins-consent" /> {c.consentLabel}
          </label>
          <Button
            size="md"
            loading={pending}
            onClick={() => {
              const el = document.getElementById("ins-consent") as HTMLInputElement | null;
              if (!el?.checked) {
                setNotice("Marca la casilla de autorización para continuar.");
                return;
              }
              grantConsent();
            }}
          >
            Autorizar y continuar
          </Button>
        </>
      ) : (
        <>
          <p>{c.whichDocsHelp}</p>

          {documents.length > 0 && (
            <ul className={styles.commList}>
              {documents.map((d) => (
                <li key={d.id} className={styles.commItem}>
                  {d.kindLabel}
                  {d.pageCount != null ? ` · ${d.pageCount} pág.` : ""}
                  {d.ocrUsed ? " · leído con OCR" : ""}
                </li>
              ))}
            </ul>
          )}

          {status && (
            <p className={styles.smallprint}>
              Estado de la lectura: {STATUS_LABEL[status] ?? status}
              {insurerName ? ` · ${insurerName}` : ""}
              {policyNumber ? ` · póliza ${policyNumber}` : ""}
            </p>
          )}
          {missingDocsNote && (
            <Alert tone="warning">Parece que falta: {missingDocsNote}</Alert>
          )}

          <div style={{ margin: "0.75rem 0" }}>
            <label className={styles.smallprint} htmlFor="ins-kind">
              Tipo de documento
            </label>
            <br />
            <select id="ins-kind" value={kind} onChange={(e) => setKind(e.target.value)}>
              {DOC_KINDS.map((k) => (
                <option key={k} value={k}>
                  {DOC_KIND_LABEL[k]}
                </option>
              ))}
            </select>
          </div>
          <input ref={fileRef} type="file" accept=".pdf,image/jpeg,image/png,image/webp" />
          <div style={{ marginTop: "0.5rem" }}>
            <Button size="md" loading={uploading} onClick={upload}>
              Subir documento
            </Button>
          </div>

          <p className={styles.smallprint}>{c.disclaimer}</p>
        </>
      )}
    </div>
  );
}
