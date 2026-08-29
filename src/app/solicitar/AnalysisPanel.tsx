"use client";

import { Alert, Button, Card } from "@/ui";
import { findTrade } from "@/config/trades";
import { COPY } from "@/config/copy";
import type { AnalysisView } from "@/server/services/analysis";
import styles from "./assistant.module.css";

const URGENCY_LABEL: Record<string, string> = {
  BAJA: "Baja",
  MEDIA: "Media",
  ALTA: "Alta",
  EMERGENCIA: "Emergencia",
};

/**
 * Shows the AI analysis (issue #7/#8). Distinguishes facts the client gave,
 * inferences, and open questions. Always framed as orientative.
 */
export function AnalysisPanel({
  analysis,
  onContinue,
  onRetry,
}: {
  analysis: AnalysisView;
  onContinue: () => void;
  onRetry: () => void;
}) {
  if (analysis.outcome === "PROVIDER_ERROR" || !analysis.result) {
    return (
      <>
        <Alert tone="warning" title="El análisis automático no está disponible">
          Puedes enviar la solicitud igualmente y la revisará una persona.
        </Alert>
        <div className={styles.nav}>
          <Button variant="secondary" onClick={onRetry}>
            {COPY.common.retry}
          </Button>
          <Button onClick={onContinue}>Continuar</Button>
        </div>
      </>
    );
  }

  const r = analysis.result;
  const trade = findTrade(r.recommendedTrade);

  return (
    <div>
      <Alert tone="info">{COPY.disclaimers.aiOrientative}</Alert>

      {analysis.outcome === "NEEDS_MORE_INFO" && r.missingInfo.length > 0 && (
        <Alert tone="warning" title="Nos ayudaría saber un poco más">
          <ul>
            {r.missingInfo.map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ul>
        </Alert>
      )}

      <Card className={styles.analysisCard}>
        <h2 className={styles.h2}>Lo que hemos entendido</h2>
        <p>{r.plainSummary}</p>

        <h2 className={styles.h2}>Solución orientativa</h2>
        <p>{r.orientativeSolution}</p>
        {r.alternatives.length > 0 && (
          <ul>
            {r.alternatives.map((a) => (
              <li key={a}>{a}</li>
            ))}
          </ul>
        )}

        <h2 className={styles.h2}>Profesional recomendado</h2>
        <p>{trade ? trade.label : "Lo determinará nuestro equipo al revisar el caso."}</p>

        <h2 className={styles.h2}>Urgencia</h2>
        <p>{URGENCY_LABEL[r.urgency] ?? r.urgency}</p>

        {r.risks.length > 0 && (
          <>
            <h2 className={styles.h2}>Ten en cuenta</h2>
            <ul>
              {r.risks.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
          </>
        )}

        {r.requiresOnSiteInspection && (
          <p className={styles.smallprint}>
            Para confirmar el diagnóstico hará falta una inspección presencial.
          </p>
        )}
      </Card>

      <div className={styles.nav}>
        <Button onClick={onContinue}>Continuar</Button>
      </div>
    </div>
  );
}
