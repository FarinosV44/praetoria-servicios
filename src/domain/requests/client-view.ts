import type { RequestStatus } from "./state-machine";

/**
 * Client-facing view of a request (issue #16). The internal state machine has
 * eleven states; a client should never see a raw enum
 * ("La interfaz no muestra estados internos incomprensibles"). This maps each
 * internal status to a short label, a plain-language explanation, and what (if
 * anything) the client can do next.
 */

export type ClientTone = "info" | "action" | "good" | "ended";

export type ClientStatusView = {
  label: string;
  description: string;
  tone: ClientTone;
  /** the client is expected to do something now */
  awaitingClient: boolean;
};

const VIEWS: Record<RequestStatus, ClientStatusView> = {
  BORRADOR: {
    label: "Solicitud sin enviar",
    description: "Tu solicitud aún no se ha enviado. Complétala para que podamos revisarla.",
    tone: "action",
    awaitingClient: true,
  },
  PENDIENTE_ANALISIS: {
    label: "En revisión",
    description:
      "Hemos recibido tu solicitud y la estamos analizando. Te responderemos en menos de 24 horas laborables.",
    tone: "info",
    awaitingClient: false,
  },
  REQUIERE_INFORMACION: {
    label: "Necesitamos un dato más",
    description:
      "Para continuar necesitamos que nos aclares algo o añadas alguna foto. Puedes hacerlo desde esta página.",
    tone: "action",
    awaitingClient: true,
  },
  VALIDADA_CLIENTE: {
    label: "Confirmada, preparando propuesta",
    description:
      "Has confirmado el análisis. Nuestro equipo está preparando el presupuesto y el plazo.",
    tone: "info",
    awaitingClient: false,
  },
  EN_REVISION: {
    label: "Preparando tu presupuesto",
    description: "Un responsable de Praetoria está preparando tu presupuesto.",
    tone: "info",
    awaitingClient: false,
  },
  PRESUPUESTO_PREPARADO: {
    label: "Presupuesto casi listo",
    description: "Tu presupuesto está en las últimas comprobaciones. Lo recibirás muy pronto.",
    tone: "info",
    awaitingClient: false,
  },
  PRESUPUESTO_ENVIADO: {
    label: "Presupuesto disponible",
    description:
      "Ya puedes consultar el presupuesto con el alcance, el total, el plazo y la garantía. Revísalo y dinos si quieres seguir adelante.",
    tone: "action",
    awaitingClient: true,
  },
  ACEPTADA: {
    label: "Presupuesto aceptado",
    description:
      "Has aceptado el presupuesto. Nos pondremos en contacto contigo para coordinar la intervención.",
    tone: "good",
    awaitingClient: false,
  },
  RECHAZADA: {
    label: "Presupuesto rechazado",
    description:
      "Has rechazado el presupuesto. Si cambias de opinión o quieres una alternativa, escríbenos desde esta página.",
    tone: "ended",
    awaitingClient: false,
  },
  CANCELADA: {
    label: "Solicitud cancelada",
    description: "Esta solicitud se ha cancelado. Si crees que es un error, ponte en contacto con nosotros.",
    tone: "ended",
    awaitingClient: false,
  },
  CERRADA: {
    label: "Solicitud cerrada",
    description: "Este servicio está cerrado. Gracias por confiar en Praetoria.",
    tone: "ended",
    awaitingClient: false,
  },
};

export function clientStatusView(status: RequestStatus): ClientStatusView {
  return VIEWS[status];
}

/** True while the client can still submit a quote decision. */
export function canDecideQuote(status: RequestStatus): boolean {
  return status === "PRESUPUESTO_ENVIADO";
}

/** True while the client can add information / photos. */
export function canAddInfo(status: RequestStatus): boolean {
  return status === "REQUIERE_INFORMACION";
}
