"use client";

import { useState } from "react";
import { Button, ButtonLink, Field } from "@/ui";
import { checkCoverage } from "@/config/coverage";
import styles from "./cobertura.module.css";

/**
 * Coverage lookup (issue #18). Runs entirely in the browser against the static
 * `checkCoverage` table — the municipality / postcode the visitor types is never
 * sent anywhere, so there is no PII and no analytics event here.
 */
export function CoverageChecker() {
  const [municipality, setMunicipality] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [result, setResult] = useState<{ covered: boolean; message: string } | null>(null);

  function onCheck() {
    const r = checkCoverage({
      municipality: municipality.trim() || null,
      postalCode: postalCode.trim() || null,
    });
    if (r.covered && r.matchedBy === "area") {
      setResult({
        covered: true,
        message:
          "Sí, damos servicio en toda el área de Valencia. Confirmamos la disponibilidad exacta de tu zona al preparar el presupuesto.",
      });
    } else if (r.covered) {
      setResult({
        covered: true,
        message: `Sí, trabajamos en ${r.area?.municipality}. Empieza tu solicitud cuando quieras.`,
      });
    } else {
      setResult({
        covered: false,
        message:
          "Esa zona queda fuera del área de Valencia. Puedes escribirnos igualmente y lo valoramos según disponibilidad.",
      });
    }
  }

  return (
    <div className={styles.checker}>
      <div className={styles.row}>
        <Field
          label="Municipio"
          value={municipality}
          onChange={(e) => setMunicipality(e.currentTarget.value)}
        />
        <Field
          label="Código postal"
          inputMode="numeric"
          value={postalCode}
          onChange={(e) => setPostalCode(e.currentTarget.value.replace(/\D/g, "").slice(0, 5))}
        />
        <Button onClick={onCheck}>Comprobar</Button>
      </div>

      {result && (
        <>
          <p
            className={`${styles.result} ${result.covered ? styles.covered : styles.notCovered}`}
            role="status"
          >
            {result.message}
          </p>
          {result.covered && (
            <ButtonLink href="/solicitar" className={styles.cta}>
              Empezar mi solicitud
            </ButtonLink>
          )}
        </>
      )}
    </div>
  );
}
