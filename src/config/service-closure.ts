import type { WarrantyKind } from "@/domain/service-closure/incidence";

/**
 * Post-service configuration (issue #23). Product config, not secrets.
 */

export const SERVICE_CLOSURE = {
  /**
   * Internal first-response target for an incidence, in hours. This is an SLA the
   * team commits to internally — it is NOT presented to the client as "24/7"
   * attention (issue #23 rule). Env override: SLA_FIRST_RESPONSE_HOURS.
   */
  slaFirstResponseHours: 24,

  /** Incidence classifications an admin can assign. */
  incidenceKinds: [
    "resultado deficiente",
    "trabajo incompleto",
    "daño colateral",
    "material o pieza incorrecta",
    "retraso o incumplimiento de plazo",
    "trato o comunicación",
    "facturación",
    "otro",
  ],

  /** What each warranty kind means — shown to the client, honest about scope. */
  warrantyKindDescription: {
    LEGAL:
      "La que la ley reconoce al consumidor sobre el trabajo y los materiales. Praetoria facilita " +
      "su ejercicio pero no la amplía por sí sola.",
    COMERCIAL:
      "Un compromiso adicional de Praetoria, con su alcance, plazo y responsable indicados por " +
      "escrito en tu presupuesto. Solo existe cuando figura explícitamente.",
    CORTESIA:
      "Una atención puntual, sin obligación contractual, que Praetoria puede ofrecer caso por " +
      "caso. No sustituye a la garantía legal ni a la comercial.",
  } satisfies Record<WarrantyKind, string>,

  noPromiseNote:
    "No ofrecemos atención 24/7. Nuestro objetivo interno es dar una primera respuesta a cualquier " +
    "incidencia en un plazo razonable; si hay riesgo inmediato, contacta con emergencias (112).",
} as const;
