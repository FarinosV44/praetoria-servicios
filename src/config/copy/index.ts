/**
 * Centralised Spanish UI copy (D-006). Components import from here rather than
 * hardcoding strings, so a future locale is an addition, not a rewrite.
 *
 * Mandatory-copy rules (issues #4, #7, #15): never promise a definitive diagnosis,
 * guaranteed insurance coverage, universal free service, or an automatic
 * professional response.
 */
export const COPY = {
  brand: {
    name: "Praetoria Servicios",
    tagline: "Cualquier problema en casa. Una solución sencilla.",
  },
  common: {
    loading: "Cargando…",
    retry: "Reintentar",
    back: "Atrás",
    next: "Continuar",
    errorGeneric: "Algo no ha ido bien. Inténtalo de nuevo en un momento.",
    empty: "Todavía no hay nada aquí.",
  },
  disclaimers: {
    aiOrientative:
      "Este análisis es orientativo y no sustituye la valoración de un profesional en persona.",
    insuranceNotGuaranteed:
      "La cobertura del seguro nunca está garantizada. Este análisis es una orientación previa a la revisión humana.",
    responseTime:
      "Praetoria responde en menos de 24 horas laborables con un presupuesto y un plazo. No es una respuesta automática de un profesional.",
  },
  assistant: {
    startCta: "Solucionar un problema",
    insuranceCta: "Comprobar mi seguro",
    chooseCategory: "¿Con qué necesitas ayuda?",
    unsure: "No sé qué profesional necesito",
  },
} as const;

export type Copy = typeof COPY;
