"use client";

import { useEffect } from "react";

/**
 * Global error boundary (issue #19). Catches render errors in the root layout /
 * template. Shows a plain fallback and logs the error to the browser console so
 * the debug-log workflow (`docs/runbook.md`) can pick it up. A real client-side
 * error tracker would be wired here (via `NEXT_PUBLIC_ERROR_SINK_URL`).
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[global-error]", error.digest ?? "", error.message);
  }, [error]);

  return (
    <html lang="es">
      <body
        style={{
          fontFamily: "system-ui, sans-serif",
          maxWidth: "32rem",
          margin: "4rem auto",
          padding: "0 1rem",
          lineHeight: 1.5,
        }}
      >
        <h1 style={{ fontSize: "1.25rem" }}>Algo no ha ido bien</h1>
        <p>
          Ha ocurrido un error inesperado. Puedes reintentar; si sigue fallando, inténtalo de nuevo
          en unos minutos.
        </p>
        <button
          type="button"
          onClick={reset}
          style={{
            padding: "0.6rem 1rem",
            borderRadius: "0.4rem",
            border: 0,
            background: "#b0522f",
            color: "#faf7f2",
            cursor: "pointer",
          }}
        >
          Reintentar
        </button>
      </body>
    </html>
  );
}
