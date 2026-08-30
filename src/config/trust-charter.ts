/**
 * Carta de Confianza Praetoria (issue #21).
 *
 * Every commitment names the real function or process that backs it (`backing`) —
 * issue #21 AC: "cada promesa comercial corresponde a una función o proceso
 * operativo real". No figures, no external certifications, no invented reviews.
 *
 * `version` + `effectiveDate` are shown on the page. When a client accepts a
 * quote, the version in effect at that moment is recorded on the decision
 * evidence, so a later change to the charter never silently alters an
 * already-accepted request (AC).
 */

export interface TrustCommitment {
  id: string;
  title: string;
  body: string;
  /** the operational reality that makes this promise keepable */
  backing: string;
  /** show this one again next to the quote / acceptance */
  atAcceptance?: boolean;
}

export interface TrustCharter {
  version: string;
  effectiveDate: string; // ISO date
  readingTimeNote: string;
  summary: string[]; // short list for the landing
  commitments: TrustCommitment[];
  praetoriaProvides: string[];
  professionalExecutes: string[];
  /** potential costs the client must see BEFORE being asked to accept (AC) */
  preAcceptanceCosts: string[];
  sealNote: string;
}

export const TRUST_CHARTER: TrustCharter = {
  version: "1.0",
  effectiveDate: "2026-08-31",
  readingTimeNote: "Se lee en menos de dos minutos.",

  summary: [
    "Tu solicitud no se vende ni se reparte entre varios profesionales.",
    "Un único responsable de Praetoria coordina todo el proceso.",
    "Recibes el presupuesto por escrito —alcance, incluido, excluido, impuestos, desplazamiento y plazo— antes de aceptar.",
    "Ningún trabajo adicional se cobra sin tu aprobación por escrito.",
    "Sabes quién es el profesional y qué se ha verificado antes de la visita.",
    "Tienes un canal de asistencia e incidencias, y una garantía explicada por trabajo.",
  ],

  commitments: [
    {
      id: "no-reparto",
      title: "Tu solicitud no se distribuye a varios profesionales",
      body:
        "No publicamos tu solicitud en un mercado ni la enviamos a varias empresas para que te " +
        "llamen. Praetoria la recibe, la interpreta y elige un único profesional.",
      backing:
        "El modelo de datos no tiene concepto de «reparto»: una solicitud tiene como máximo una " +
        "asignación activa (`Assignment`), creada por un administrador.",
    },
    {
      id: "interlocutor",
      title: "Un único interlocutor",
      body:
        "Hablas siempre con Praetoria. Nosotros coordinamos al profesional y hacemos seguimiento " +
        "hasta que el trabajo queda resuelto.",
      backing:
        "El panel de administración gestiona la solicitud de principio a fin; el cliente se " +
        "comunica por el canal elegido y por el enlace de seguimiento, nunca directamente con un mercado.",
    },
    {
      id: "presupuesto-escrito",
      title: "Presupuesto por escrito antes de aceptar",
      body:
        "Antes de pedirte que aceptes nada recibes un documento con el alcance del trabajo, lo " +
        "incluido, lo excluido, los impuestos, el desplazamiento, el plazo y la garantía.",
      backing:
        "El presupuesto (`Quote`) obliga a alcance, líneas, subtotal, IVA, total, exclusiones, " +
        "plazo y garantía; se envía y solo entonces el cliente puede decidir.",
      atAcceptance: true,
    },
    {
      id: "extras",
      title: "Ningún extra sin tu aprobación por escrito",
      body:
        "Si durante el trabajo aparece algo no previsto, se para, se te explica y se aprueba por " +
        "escrito antes de ejecutarlo. No hay cargos sorpresa.",
      backing:
        "El presupuesto incluye el procedimiento de aprobación de extras (`extrasApprovalNote`); " +
        "un trabajo adicional es un nuevo presupuesto, no un cargo añadido.",
      atAcceptance: true,
    },
    {
      id: "identidad",
      title: "Sabes quién va a ir, antes de que vaya",
      body:
        "Antes de la visita te mostramos el nombre del profesional, su oficio y qué hemos " +
        "verificado. Nunca decimos «verificado» si solo comprobamos un teléfono o un correo.",
      backing:
        "La red de profesionales (#22): estados de verificación, acreditaciones para oficios " +
        "regulados, y la vista del cliente que solo muestra el alcance real de la verificación.",
    },
    {
      id: "asistencia",
      title: "Canal de asistencia e incidencias",
      body:
        "Si algo no va bien —antes, durante o después del trabajo— tienes un canal para decirlo " +
        "y un responsable que se ocupa.",
      backing:
        "El enlace de seguimiento permite responder y abrir «Tengo un problema con el trabajo»; " +
        "el panel registra y da seguimiento a la incidencia.",
    },
    {
      id: "garantia",
      title: "Garantía explicada por trabajo",
      body:
        "Cada presupuesto indica la garantía aplicable y quién responde de ella. No es una " +
        "promesa genérica: está escrita en tu documento.",
      backing: "`Quote.warrantyText` + `Quote.warrantyResponsible`, obligatorios en el presupuesto.",
      atAcceptance: true,
    },
    {
      id: "datos",
      title: "Tus fotos y pólizas, privadas",
      body:
        "Las fotos y los documentos de seguro se guardan en almacenamiento privado y cifrado, se " +
        "usan solo para gestionar tu caso y puedes pedir su borrado. La política de privacidad " +
        "detalla finalidad y conservación.",
      backing:
        "Almacenamiento privado con URLs firmadas y temporales; documentos de seguro `sensitive`; " +
        "retención configurable y borrado verificado (cron de retención).",
    },
    {
      id: "visita",
      title: "Si hace falta visita previa, lo sabes antes",
      body:
        "Cuando preparar el presupuesto exige una visita de diagnóstico, su coste y sus " +
        "condiciones se te informan antes de concertarla, y se descuenta si aceptas el trabajo.",
      backing:
        "El presupuesto distingue la visita de diagnóstico (`visitFeeCents`, `visitFeeDiscounted`); " +
        "se comunica antes de agendarla.",
      atAcceptance: true,
    },
    {
      id: "justificante",
      title: "Factura o justificante",
      body:
        "Recibirás factura o justificante del trabajo, según el modelo jurídico que Praetoria " +
        "adopte finalmente. Este punto se concretará en la versión definitiva de la carta.",
      backing:
        "Pendiente de la revisión jurídica del modelo de facturación (misma puerta que los textos " +
        "legales definitivos).",
    },
  ],

  praetoriaProvides: [
    "Interpretar la incidencia y elegir el oficio y el profesional adecuados.",
    "Preparar el presupuesto estructurado y comunicártelo por escrito.",
    "Coordinar la intervención y hacer seguimiento hasta el cierre.",
    "Verificar la identidad y la documentación del profesional.",
    "Gestionar incidencias y aplicar la garantía.",
    "Custodiar tus datos con acceso mínimo y borrado a petición.",
  ],
  professionalExecutes: [
    "El diagnóstico definitivo en persona.",
    "La reparación o el trabajo acordado, con sus materiales.",
    "La ejecución conforme al alcance del presupuesto.",
    "La garantía sobre su trabajo, en los términos indicados en el presupuesto.",
  ],

  preAcceptanceCosts: [
    "Pedir presupuesto y el análisis inicial no tienen coste.",
    "Si hace falta una visita de diagnóstico, su coste aparece en el presupuesto y se descuenta si aceptas el trabajo.",
    "El total del presupuesto incluye impuestos (IVA) y desplazamiento; no hay importes ocultos.",
    "Cualquier trabajo adicional se aprueba por escrito antes de ejecutarlo: nunca es un cargo automático.",
  ],

  sealNote:
    "«Gestionado por Praetoria» describe cómo trabajamos. No es una certificación ni un sello " +
    "otorgado por un tercero.",
};

/** The commitments to repeat next to the quote and the acceptance (issue #21). */
export function commitmentsAtAcceptance(): TrustCommitment[] {
  return TRUST_CHARTER.commitments.filter((c) => c.atAcceptance);
}
