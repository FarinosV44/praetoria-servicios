/**
 * Reputation / reviews configuration (issue #26). Product config, not secrets.
 */

export const REPUTATION = {
  /**
   * What the "verificada" badge means — shown verbatim near every review list.
   * Never a generic trust claim: it states the concrete fact.
   */
  verifiedMeaning:
    "«Verificada» significa que la reseña corresponde a un trabajo gestionado y cerrado por " +
    "Praetoria: hubo solicitud, presupuesto aceptado, ejecución y confirmación del cliente. No " +
    "publicamos opiniones que no procedan de un trabajo real.",

  /**
   * Optional link to the Google Business Profile review form. Empty = the CTA is
   * hidden. No automation that would breach Google's policies — it is a plain
   * link the client may choose to follow. Env: NEXT_PUBLIC_GBP_REVIEW_URL.
   */
  googleReviewUrl: process.env.NEXT_PUBLIC_GBP_REVIEW_URL?.trim() || "",

  /** How many reviews to show on a service / zone page before "ver más". */
  pagePreviewCount: 6,

  dimensionLabel: {
    punctuality: "Puntualidad",
    clarity: "Claridad",
    cleanliness: "Limpieza",
    result: "Resultado",
  } as const,

  sortLabel: {
    recent: "Más recientes",
    rating_desc: "Mejor valoradas",
    rating_asc: "Peor valoradas",
  } as const,
} as const;
