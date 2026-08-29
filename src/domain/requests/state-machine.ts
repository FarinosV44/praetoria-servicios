/**
 * Request (Solicitud) state machine — issue #9.
 * Server-validated transitions; every applied transition must be recorded as an
 * immutable StatusEvent with actor, timestamp and reason (persistence layer).
 */

export const REQUEST_STATUSES = [
  "BORRADOR",
  "PENDIENTE_ANALISIS",
  "REQUIERE_INFORMACION",
  "VALIDADA_CLIENTE",
  "EN_REVISION",
  "PRESUPUESTO_PREPARADO",
  "PRESUPUESTO_ENVIADO",
  "ACEPTADA",
  "RECHAZADA",
  "CANCELADA",
  "CERRADA",
] as const;

export type RequestStatus = (typeof REQUEST_STATUSES)[number];

export type ActorType = "CLIENT" | "ADMIN" | "SYSTEM";

const TRANSITIONS: Record<RequestStatus, RequestStatus[]> = {
  BORRADOR: ["PENDIENTE_ANALISIS", "CANCELADA"],
  PENDIENTE_ANALISIS: ["REQUIERE_INFORMACION", "VALIDADA_CLIENTE", "EN_REVISION", "CANCELADA"],
  REQUIERE_INFORMACION: ["PENDIENTE_ANALISIS", "VALIDADA_CLIENTE", "CANCELADA"],
  VALIDADA_CLIENTE: ["EN_REVISION", "CANCELADA"],
  EN_REVISION: ["REQUIERE_INFORMACION", "PRESUPUESTO_PREPARADO", "RECHAZADA", "CANCELADA"],
  PRESUPUESTO_PREPARADO: ["PRESUPUESTO_ENVIADO", "EN_REVISION", "CANCELADA"],
  PRESUPUESTO_ENVIADO: ["ACEPTADA", "RECHAZADA", "CANCELADA"],
  ACEPTADA: ["CERRADA", "CANCELADA"],
  RECHAZADA: ["EN_REVISION", "CERRADA"],
  CANCELADA: [],
  CERRADA: [],
};

/** Who is allowed to drive a given transition. Anything not listed = ADMIN/SYSTEM only. */
const ACTOR_RULES: Partial<Record<`${RequestStatus}->${RequestStatus}`, ActorType[]>> = {
  "BORRADOR->PENDIENTE_ANALISIS": ["CLIENT", "SYSTEM"],
  "BORRADOR->CANCELADA": ["CLIENT", "ADMIN", "SYSTEM"],
  "PENDIENTE_ANALISIS->REQUIERE_INFORMACION": ["SYSTEM", "ADMIN"],
  "PENDIENTE_ANALISIS->VALIDADA_CLIENTE": ["CLIENT"],
  "REQUIERE_INFORMACION->PENDIENTE_ANALISIS": ["CLIENT", "SYSTEM"],
  "REQUIERE_INFORMACION->VALIDADA_CLIENTE": ["CLIENT"],
  "PRESUPUESTO_ENVIADO->ACEPTADA": ["CLIENT"],
  "PRESUPUESTO_ENVIADO->RECHAZADA": ["CLIENT", "ADMIN"],
};

export const TERMINAL_STATUSES: readonly RequestStatus[] = ["CANCELADA", "CERRADA"];

export function isTerminal(status: RequestStatus): boolean {
  return TERMINAL_STATUSES.includes(status);
}

export function allowedNextStatuses(from: RequestStatus): RequestStatus[] {
  return [...TRANSITIONS[from]];
}

export function canTransition(from: RequestStatus, to: RequestStatus, actor: ActorType): boolean {
  if (!TRANSITIONS[from]?.includes(to)) return false;
  const rule = ACTOR_RULES[`${from}->${to}`];
  if (!rule) return actor === "ADMIN" || actor === "SYSTEM";
  return rule.includes(actor);
}

export type TransitionError =
  | { kind: "invalid_transition"; from: RequestStatus; to: RequestStatus }
  | { kind: "forbidden_actor"; from: RequestStatus; to: RequestStatus; actor: ActorType }
  | { kind: "reason_required"; from: RequestStatus; to: RequestStatus };

/** Transitions that must carry a human reason. */
const REASON_REQUIRED: readonly `${RequestStatus}->${RequestStatus}`[] = [
  "EN_REVISION->RECHAZADA",
  "PRESUPUESTO_ENVIADO->RECHAZADA",
  "PENDIENTE_ANALISIS->CANCELADA",
  "EN_REVISION->CANCELADA",
];

export function validateTransition(input: {
  from: RequestStatus;
  to: RequestStatus;
  actor: ActorType;
  reason?: string;
}): { ok: true } | { ok: false; error: TransitionError } {
  const { from, to, actor, reason } = input;
  if (!TRANSITIONS[from]?.includes(to)) {
    return { ok: false, error: { kind: "invalid_transition", from, to } };
  }
  if (!canTransition(from, to, actor)) {
    return { ok: false, error: { kind: "forbidden_actor", from, to, actor } };
  }
  if (
    REASON_REQUIRED.includes(`${from}->${to}` as `${RequestStatus}->${RequestStatus}`) &&
    !reason?.trim()
  ) {
    return { ok: false, error: { kind: "reason_required", from, to } };
  }
  return { ok: true };
}
