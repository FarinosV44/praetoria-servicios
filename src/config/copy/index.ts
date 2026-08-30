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
  /**
   * Communication templates (issue #13). `{brand}`, `{name}`, `{reference}`,
   * `{message}` and `{url}` are substituted by the renderer. Configurable — an
   * operator can edit these strings without touching code.
   */
  comms: {
    signature: "El equipo de {brand}",
    footer:
      "Este mensaje se envía para gestionar tu solicitud {reference}. {brand} nunca comparte tus " +
      "fotos, tu dirección ni tu póliza más allá de lo necesario para resolver el problema.",
    confirmation: {
      subject: "Hemos recibido tu solicitud ({reference}) · {brand}",
      body:
        "Hola {name}:\n\n" +
        "Hemos recibido tu solicitud con la referencia {reference}. La estamos revisando y te " +
        "responderemos en menos de 24 horas laborables con un presupuesto y un plazo.\n\n" +
        "No necesitas hacer nada más por ahora. Si quieres añadir información o fotos, responde a " +
        "este mensaje.\n\n" +
        "{signature}",
    },
    infoRequest: {
      subject: "Necesitamos un dato más para tu solicitud ({reference}) · {brand}",
      body:
        "Hola {name}:\n\n" +
        "Para preparar tu presupuesto necesitamos que nos aclares lo siguiente:\n\n" +
        "{message}\n\n" +
        "Puedes responder a este mensaje con la información o con fotos adicionales.\n\n" +
        "{signature}",
    },
    quoteAvailable: {
      subject: "Tu presupuesto está listo ({reference}) · {brand}",
      body:
        "Hola {name}:\n\n" +
        "Ya tienes disponible el presupuesto de tu solicitud {reference}, con el alcance, el total, " +
        "el plazo y la garantía detallados.\n\n" +
        "{url}\n\n" +
        "Revísalo con calma y dinos si quieres seguir adelante.\n\n" +
        "{signature}",
      urlLine: "Consúltalo aquí: {url}",
      noUrlLine:
        "Nos pondremos en contacto contigo para enviártelo por tu canal preferido.",
    },
    generic: {
      subject: "Actualización de tu solicitud ({reference}) · {brand}",
      body: "Hola {name}:\n\n{message}\n\n{signature}",
    },
  },
} as const;

export type Copy = typeof COPY;
