"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Alert, Button, Field } from "@/ui";
import {
  adminAnalyzeCoverageAction,
  adminMarkCoverageReviewedAction,
  adminReviseCoverageDraftAction,
} from "@/server/actions/coverage";
import styles from "../../../admin.module.css";

type Ref = { document: string; page: number; quote: string };
type Breakdown = {
  policyClause: {
    text: string | null;
    references: Ref[];
    exclusions: string[];
    limitsAndExcess: string[];
    deadlines: string[];
  };
  legalNorm: { process: string[] };
  assessment: {
    verdictLabel: string;
    confidence: number;
    factsToProve: string[];
    recommendedDocumentation: string[];
    openQuestions: string[];
    caveats: string[];
  };
};

type Coverage = {
  verdict: string;
  confidence: number | null;
  draftText: string | null;
  draftStatusLabel: string;
  reviewed: boolean;
  reviewedAt: string | null;
  needsPolicyDocument: boolean;
  breakdown: Breakdown | null;
  revisions: { id: string; note: string | null; createdAt: string }[];
};

function List({ title, items }: { title: string; items: string[] }) {
  if (!items?.length) return null;
  return (
    <>
      <h4>{title}</h4>
      <ul>
        {items.map((i, n) => (
          <li key={n}>{i}</li>
        ))}
      </ul>
    </>
  );
}

export function CoveragePanel({
  reference,
  coverage,
}: {
  reference: string;
  coverage: Coverage | null;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(coverage?.draftText ?? "");
  const [note, setNote] = useState("");

  const act = (fn: () => Promise<{ ok: boolean; error?: { kind: string } }>, okMsg: string) => {
    setMsg(null);
    start(async () => {
      const r = await fn();
      setMsg(r.ok ? okMsg : `No se pudo: ${r.error?.kind}`);
      if (r.ok) {
        setEditing(false);
        setNote("");
        router.refresh();
      }
    });
  };

  return (
    <section className={styles.card}>
      <h2>Cobertura del seguro</h2>
      {msg && <Alert tone="info">{msg}</Alert>}

      {!coverage ? (
        <>
          <p className={styles.smallprint}>
            Cruza la incidencia validada con el contenido de la póliza. Requiere un análisis activo y
            al menos un documento de la póliza.
          </p>
          <Button
            size="md"
            loading={pending}
            onClick={() =>
              act(() => adminAnalyzeCoverageAction(reference), "Análisis de cobertura generado.")
            }
          >
            Analizar cobertura
          </Button>
        </>
      ) : (
        <>
          <p>
            <strong>{coverage.breakdown?.assessment.verdictLabel ?? coverage.verdict}</strong>
            {coverage.confidence != null ? ` · confianza ${coverage.confidence}%` : ""} ·{" "}
            <em>{coverage.draftStatusLabel}</em>
          </p>
          {coverage.needsPolicyDocument && (
            <Alert tone="warning">
              Falta la condición aplicable. Pide al cliente el condicionado completo.
            </Alert>
          )}

          {coverage.breakdown && (
            <>
              <h3>Cláusula de póliza</h3>
              <p>{coverage.breakdown.policyClause.text ?? "Sin cláusula identificada todavía."}</p>
              {coverage.breakdown.policyClause.references.length > 0 && (
                <ul>
                  {coverage.breakdown.policyClause.references.map((r, n) => (
                    <li key={n}>
                      {r.document}, pág. {r.page}: <em>&ldquo;{r.quote}&rdquo;</em>
                    </li>
                  ))}
                </ul>
              )}
              <List title="Límites y franquicias" items={coverage.breakdown.policyClause.limitsAndExcess} />
              <List title="Plazos" items={coverage.breakdown.policyClause.deadlines} />
              <List title="Exclusiones relevantes" items={coverage.breakdown.policyClause.exclusions} />

              <h3>Norma / proceso</h3>
              <ul>
                {coverage.breakdown.legalNorm.process.map((s, n) => (
                  <li key={n}>{s}</li>
                ))}
              </ul>

              <h3>Valoración</h3>
              <List title="Hechos que deben acreditarse" items={coverage.breakdown.assessment.factsToProve} />
              <List
                title="Documentación recomendada"
                items={coverage.breakdown.assessment.recommendedDocumentation}
              />
              <List title="Dudas pendientes" items={coverage.breakdown.assessment.openQuestions} />
              <List title="Avisos" items={coverage.breakdown.assessment.caveats} />
            </>
          )}

          <h3>Borrador ({coverage.draftStatusLabel})</h3>
          {editing ? (
            <>
              <Field
                as="textarea"
                label="Borrador"
                rows={16}
                value={draft}
                onChange={(e) => setDraft(e.currentTarget.value)}
              />
              <Field
                label="Nota de la revisión"
                value={note}
                onChange={(e) => setNote(e.currentTarget.value)}
              />
              <div className={styles.statusBtns}>
                <Button
                  size="md"
                  loading={pending}
                  onClick={() =>
                    act(
                      () => adminReviseCoverageDraftAction(reference, { text: draft, note }),
                      "Borrador actualizado (revisión registrada).",
                    )
                  }
                >
                  Guardar cambios
                </Button>
                <Button variant="secondary" size="md" onClick={() => setEditing(false)}>
                  Cancelar
                </Button>
              </div>
            </>
          ) : (
            <>
              <pre className={styles.commPreview} style={{ whiteSpace: "pre-wrap" }}>
                {coverage.draftText}
              </pre>
              <div className={styles.statusBtns}>
                <Button
                  variant="secondary"
                  size="md"
                  onClick={() => {
                    setDraft(coverage.draftText ?? "");
                    setEditing(true);
                  }}
                >
                  Editar borrador
                </Button>
                {!coverage.reviewed && (
                  <Button
                    size="md"
                    loading={pending}
                    onClick={() =>
                      act(
                        () => adminMarkCoverageReviewedAction(reference),
                        'Marcado como "Revisado por Praetoria".',
                      )
                    }
                  >
                    Marcar como revisado por Praetoria
                  </Button>
                )}
                <Button
                  variant="secondary"
                  size="md"
                  loading={pending}
                  onClick={() =>
                    act(() => adminAnalyzeCoverageAction(reference), "Análisis regenerado.")
                  }
                >
                  Re-analizar
                </Button>
              </div>
            </>
          )}

          {coverage.revisions.length > 0 && (
            <>
              <h4>Historial de revisiones ({coverage.revisions.length})</h4>
              <ul className={styles.smallprint}>
                {coverage.revisions.map((r) => (
                  <li key={r.id}>
                    {new Date(r.createdAt).toLocaleString("es-ES")} — {r.note ?? "sin nota"}
                  </li>
                ))}
              </ul>
            </>
          )}
        </>
      )}
    </section>
  );
}
