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
  insurance: {
    heading: "¿Podría estar cubierto por tu seguro de hogar?",
    intro:
      "Si nos compartes tu póliza, hacemos una lectura orientativa de las coberturas. No garantiza " +
      "nada: la decisión final es de la aseguradora tras la visita de un perito.",
    consentLabel:
      "Autorizo a Praetoria Servicios a analizar los documentos de mi póliza para orientarme sobre la posible cobertura.",
    whichDocsHelp:
      "Ayuda mucho tener las condiciones particulares (tu póliza concreta, con tus datos y garantías) " +
      "y las condiciones generales (el condicionado completo con las exclusiones).",
    disclaimer:
      "Tus documentos se guardan cifrados, con acceso mínimo, y puedes pedir su borrado en cualquier momento.",
    consentNeeded: "Necesitamos tu autorización antes de subir ningún documento.",
  },
  /**
   * Conversion landing (issue #4, benchmark D3/D9). Zero invented
   * figures/reviews/years/guarantees — everything here is a promise Praetoria
   * can keep, not a marketing claim.
   */
  landing: {
    hero: {
      lead:
        "Adjunta fotos y explica el problema con tus palabras. Lo interpretamos, te decimos qué " +
        "profesional necesitas y te damos un presupuesto claro y un plazo.",
    },
    steps: {
      heading: "Cómo funciona",
      items: [
        {
          title: "Cuéntanoslo",
          body: "Fotos del problema y una descripción breve. No necesitas saber a quién llamar.",
        },
        {
          title: "Lo analizamos",
          body:
            "Una primera lectura orientativa del caso y el oficio adecuado. La confirmas o la corriges.",
        },
        {
          title: "Preparamos el presupuesto",
          body:
            "Con lo incluido, lo excluido, impuestos, total y plazo. Sin sorpresas ni letra pequeña.",
        },
        {
          title: "Te acompañamos",
          body:
            "Un único responsable coordina la intervención y hace seguimiento hasta que queda resuelto.",
        },
      ],
    },
    categories: {
      heading: "Con qué te ayudamos",
      note: "Y si no sabes qué oficio es, lo averiguamos nosotros a partir de las fotos.",
    },
    noNeedToKnow: {
      heading: "No necesitas saber qué profesional necesitas",
      body:
        "Muchas incidencias del hogar no encajan en un solo oficio, o cuesta saber por dónde " +
        "empezar. Tú describes lo que ves; nosotros identificamos el problema y la solución.",
    },
    advantages: {
      heading: "Qué hacemos distinto",
      items: [
        {
          title: "Un solo interlocutor",
          body:
            "Tu solicitud no se reparte entre varios profesionales. Hablas siempre con Praetoria, " +
            "no recibes llamadas de gente que no sabe qué necesitas.",
        },
        {
          title: "Presupuesto comparable",
          body:
            "Un documento con alcance, incluido y excluido, impuestos, visita, plazo y garantía. " +
            "Comparable consigo mismo, sin “precio cerrado” con variables abiertas.",
        },
        {
          title: "Profesional identificado antes de la visita",
          body: "Sabes quién va a ir y con qué preparación, antes de que llame a tu puerta.",
        },
        {
          title: "Tus datos, sólo lo necesario",
          body:
            "Fotos, dirección y póliza no se distribuyen más allá de lo imprescindible para " +
            "resolver el problema.",
        },
        {
          title: "Revisión del seguro, opcional",
          body:
            "Si lo pides, hacemos una lectura orientativa de tu póliza con referencias a las " +
            "cláusulas y un borrador de comunicación a la aseguradora.",
        },
      ],
    },
    contrast: {
      heading: "En qué nos diferenciamos",
      message:
        "No buscamos cuatro profesionales para que te llamen. Entendemos el problema, " +
        "seleccionamos la solución adecuada y te acompañamos hasta que quede resuelto.",
      rows: [
        {
          topic: "Al contactar",
          traditional: "Llamas o escribes sin saber qué datos necesita el técnico.",
          marketplace: "Publicas la solicitud y varios profesionales te contactan.",
          praetoria: "Explicas el problema con fotos; nosotros decidimos qué hace falta.",
        },
        {
          topic: "Quién te responde",
          traditional: "Un negocio, si tiene hueco.",
          marketplace: "Varios, y comparas tú.",
          praetoria: "Un único responsable que coordina todo.",
        },
        {
          topic: "El presupuesto",
          traditional: "Verbal o por WhatsApp, difícil de comparar.",
          marketplace: "Varios presupuestos con criterios distintos.",
          praetoria: "Un presupuesto estructurado con todo detallado.",
        },
        {
          topic: "Después del trabajo",
          traditional: "Te apañas si algo falla.",
          marketplace: "Depende del profesional.",
          praetoria: "Seguimiento, garantía aplicable e incidencias documentadas.",
        },
      ],
    },
    trust: {
      heading: "Por qué puedes confiar",
      items: [
        "Tu solicitud nunca se reparte entre varios profesionales: es una promesa, y es verificable.",
        "El profesional asignado y el alcance de su verificación se muestran antes de la visita.",
        "Las métricas, reseñas o distintivos solo se muestran si son reales y verificables.",
      ],
      note: "Estamos en fase inicial: aquí no verás cifras, años de experiencia ni reseñas inventadas.",
    },
    dataProtection: {
      heading: "Qué hacemos con tus datos",
      body:
        "Las fotos y los documentos se guardan en almacenamiento privado, nunca en una URL pública. " +
        "El acceso es mediante enlaces temporales y solo para gestionar tu caso. Los documentos de " +
        "seguro se guardan cifrados. Puedes pedir la eliminación de tu solicitud y sus archivos " +
        "en cualquier momento.",
    },
    quoteExample: {
      heading: "Así es un presupuesto de Praetoria",
      caption: "Ejemplo ilustrativo. Los importes de tu caso dependen del diagnóstico.",
      workTitle: "Sustituir el sifón del fregadero y revisar la instalación",
      lines: [
        { concept: "Visita y diagnóstico (se descuenta si aceptas)", amount: "40,00 €" },
        { concept: "Mano de obra", amount: "80,00 €" },
        { concept: "Materiales (sifón)", amount: "12,00 €" },
        { concept: "Retirada de residuos", amount: "incluido" },
      ],
      total: "IVA incluido · total 159,72 €",
      facts: [
        "Plazo: 2-3 días laborables · duración estimada 1-2 h",
        "Garantía: 6 meses sobre la reparación, responsable Praetoria Servicios",
        "Cualquier trabajo adicional se aprueba por escrito antes de ejecutarlo",
      ],
    },
    insuranceBlock: {
      heading: "Puede que tu seguro de hogar lo cubra",
      body:
        "Si tu incidencia parece un daño cubierto —por agua, eléctrico, cristales— " +
        "podría estar cubierto por tu póliza. Sube tu póliza y te orientamos: qué " +
        "cláusula podría aplicar, qué debes acreditar y un borrador para la aseguradora. " +
        "Nunca te decimos que “no pagarás”: la decisión es de la aseguradora.",
    },
    coverage: {
      heading: "Dónde trabajamos",
      body:
        "Damos servicio en toda el área de Valencia: la ciudad y los municipios cercanos. " +
        "Algunos en los que ya trabajamos de forma habitual:",
    },
    faq: {
      heading: "Preguntas frecuentes",
      items: [
        {
          q: "¿Cuánto tardáis en responder?",
          a:
            "Menos de 24 horas laborables con un presupuesto y un plazo. No es una respuesta " +
            "automática de un profesional: lo revisa una persona.",
        },
        {
          q: "¿El análisis con IA es un diagnóstico?",
          a:
            "No. Es una lectura orientativa para preparar el presupuesto y elegir el oficio. El " +
            "diagnóstico definitivo lo hace el profesional en persona.",
        },
        {
          q: "¿Me va a llamar mucha gente?",
          a: "No. Tu solicitud no se reparte. Hablas siempre con Praetoria.",
        },
        {
          q: "¿Cuánto cuesta pedir presupuesto?",
          a:
            "Pedir presupuesto y el análisis inicial no tienen coste. La visita de diagnóstico, " +
            "si hace falta, se indica en el presupuesto y se descuenta si aceptas.",
        },
        {
          q: "¿Atendéis urgencias 24/7?",
          a:
            "No ofrecemos atención 24/7. Si hay riesgo (agua sin control, olor a gas, humo, " +
            "peligro eléctrico) te damos indicaciones de seguridad y te derivamos a emergencias.",
        },
        {
          q: "¿Qué hacéis con mis fotos y mi dirección?",
          a:
            "Se guardan en privado y solo se usan para gestionar tu caso. Puedes pedir su borrado " +
            "cuando quieras.",
        },
      ],
    },
    urgency: {
      heading: "¿Tienes una incidencia ahora?",
      body:
        "Si hay riesgo inmediato —agua sin control, olor a gas, humo o chispas, peligro " +
        "eléctrico, alguien atrapado— corta el suministro solo si puedes hacerlo con " +
        "seguridad, aléjate y contacta con emergencias (112). Para el resto, empieza aquí y " +
        "te respondemos en menos de 24 horas laborables.",
    },
    footer: {
      tagline: "Cualquier problema en casa. Una solución sencilla.",
      note:
        "Servicio en fase inicial. El análisis con IA es orientativo y no sustituye la " +
        "valoración de un profesional.",
      legalPrivacy: "Política de privacidad",
      legalNotice: "Aviso legal",
    },
  },
  legal: {
    provisionalBanner:
      "Texto provisional pendiente de revisión jurídica (issue #17). No debe considerarse " +
      "definitivo.",
    privacy: {
      title: "Política de privacidad",
      intro:
        "Esta página describe, de forma provisional, cómo Praetoria Servicios trata los " +
        "datos que le facilitas al usar el asistente y el panel de seguimiento.",
      sections: [
        {
          h: "Quién es el responsable",
          p:
            "Praetoria Servicios (los datos de identificación fiscal y de contacto se " +
            "completarán en la revisión jurídica).",
        },
        {
          h: "Qué datos tratamos",
          p:
            "Nombre y un medio de contacto (teléfono o correo), la descripción del problema, " +
            "fotografías, municipio y código postal, y —solo si lo autorizas— los " +
            "documentos de tu póliza de seguro.",
        },
        {
          h: "Para qué los usamos",
          p:
            "Para entender la incidencia, preparar un presupuesto y un plazo, coordinar la " +
            "intervención, comunicarnos contigo por el canal que elijas y —si lo pides— " +
            "orientarte sobre la posible cobertura del seguro.",
        },
        {
          h: "Consentimiento",
          p:
            "Los consentimientos son separados y nunca vienen marcados por defecto: gestión de " +
            "la solicitud, comunicaciones operativas, comunicaciones comerciales (opcional) y " +
            "análisis de documentos de seguro (opcional).",
        },
        {
          h: "Con quién se comparten",
          p:
            "Solo con el profesional asignado y únicamente los datos necesarios para ejecutar el " +
            "trabajo. No vendemos ni cedemos tus datos con fines publicitarios.",
        },
        {
          h: "Conservación",
          p:
            "Las solicitudes sin enviar caducan y se eliminan. El resto se conserva el tiempo " +
            "necesario para la gestión y las obligaciones legales, y después se elimina.",
        },
        {
          h: "Tus derechos",
          p:
            "Puedes solicitar acceso, rectificación, supresión, limitación, portabilidad " +
            "y oposición, y retirar cualquier consentimiento. El procedimiento y la autoridad de " +
            "control se detallarán en la versión definitiva.",
        },
      ],
    },
    notice: {
      title: "Aviso legal",
      intro:
        "Información provisional sobre la titularidad y las condiciones de uso de este sitio.",
      sections: [
        {
          h: "Titularidad",
          p:
            "Este sitio pertenece a Praetoria Servicios. Los datos registrales y fiscales se " +
            "publicarán en la revisión jurídica.",
        },
        {
          h: "Objeto",
          p:
            "Praetoria Servicios es un servicio gestionado que interpreta incidencias del hogar, " +
            "selecciona al profesional adecuado, prepara presupuestos y hace seguimiento. No es un " +
            "directorio ni un mercado de anuncios.",
        },
        {
          h: "Naturaleza del análisis",
          p:
            "El análisis automático es orientativo. No constituye un diagnóstico " +
            "definitivo, ni asesoramiento jurídico, ni garantiza la cobertura de ningún " +
            "seguro.",
        },
        {
          h: "Responsabilidad",
          p:
            "Praetoria pone medios razonables para que la información sea correcta y el servicio " +
            "funcione, sin poder garantizar la ausencia total de errores o interrupciones.",
        },
        {
          h: "Propiedad intelectual",
          p: "Los contenidos y el software de este sitio son propiedad de Praetoria Servicios.",
        },
      ],
    },
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
        "{url}\n\n" +
        "No necesitas hacer nada más por ahora.\n\n" +
        "{signature}",
      urlLine: "Puedes seguir el estado de tu solicitud aquí: {url}",
      noUrlLine: "Si quieres añadir información o fotos, responde a este mensaje.",
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
