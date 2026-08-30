import { Alert } from "@/ui";
import styles from "./link.module.css";

/**
 * Client-facing coverage view (issue #15). Prudent by design: it shows the
 * verdict, what needs to be proven, the recommended documentation and the real
 * process — but the legal draft is shown ONLY once an admin has explicitly
 * reviewed it ("Revisado por Praetoria").
 */
export function CoverageClientView({
  verdictLabel,
  needsPolicyDocument,
  factsToProve,
  recommendedDocumentation,
  process,
  caveats,
  reviewed,
  draftText,
}: {
  verdictLabel: string;
  needsPolicyDocument: boolean;
  factsToProve: string[];
  recommendedDocumentation: string[];
  process: string[];
  caveats: string[];
  reviewed: boolean;
  draftText: string | null;
}) {
  return (
    <div className={styles.card}>
      <h2>Orientación sobre tu seguro</h2>
      <p>
        Resultado orientativo: <strong>{verdictLabel}</strong>
      </p>

      {needsPolicyDocument && (
        <Alert tone="warning">
          Para poder orientarte necesitamos el condicionado completo de tu póliza. Súbelo en la
          sección anterior.
        </Alert>
      )}

      {factsToProve.length > 0 && (
        <>
          <h3>Qué conviene poder acreditar</h3>
          <ul>
            {factsToProve.map((f, i) => (
              <li key={i}>{f}</li>
            ))}
          </ul>
        </>
      )}

      {recommendedDocumentation.length > 0 && (
        <>
          <h3>Documentación recomendada</h3>
          <ul>
            {recommendedDocumentation.map((d, i) => (
              <li key={i}>{d}</li>
            ))}
          </ul>
        </>
      )}

      <h3>Cómo funciona el proceso con la aseguradora</h3>
      <ul>
        {process.map((s, i) => (
          <li key={i}>{s}</li>
        ))}
      </ul>

      {reviewed && draftText ? (
        <>
          <h3>Borrador de comunicación a la aseguradora (revisado por Praetoria)</h3>
          <pre className={styles.commPreview} style={{ whiteSpace: "pre-wrap" }}>
            {draftText}
          </pre>
        </>
      ) : (
        <p className={styles.smallprint}>
          Estamos preparando un borrador de comunicación para tu aseguradora. Te lo mostraremos aquí
          en cuanto lo revise una persona de Praetoria.
        </p>
      )}

      {caveats.map((c, i) => (
        <p key={i} className={styles.smallprint}>
          {c}
        </p>
      ))}
    </div>
  );
}
