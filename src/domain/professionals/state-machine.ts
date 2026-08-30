/**
 * Professional (network member) lifecycle — issue #22.
 *
 * Every applied transition is recorded as an AdminActionLog row with the acting
 * admin (persistence layer). Suspension is immediate and never deletes history;
 * a suspended professional simply cannot be assigned.
 */

export const PROFESSIONAL_STATUSES = [
  "CANDIDATO",
  "DOCUMENTACION_PENDIENTE",
  "VERIFICANDO",
  "APROBADO",
  "SUSPENDIDO",
  "RECHAZADO",
] as const;

export type ProfessionalStatus = (typeof PROFESSIONAL_STATUSES)[number];

const TRANSITIONS: Record<ProfessionalStatus, ProfessionalStatus[]> = {
  CANDIDATO: ["DOCUMENTACION_PENDIENTE", "RECHAZADO"],
  DOCUMENTACION_PENDIENTE: ["VERIFICANDO", "RECHAZADO"],
  VERIFICANDO: ["APROBADO", "DOCUMENTACION_PENDIENTE", "RECHAZADO"],
  APROBADO: ["SUSPENDIDO"],
  SUSPENDIDO: ["APROBADO", "RECHAZADO"],
  RECHAZADO: [],
};

/** Transitions that must carry a human reason. */
const REASON_REQUIRED: readonly `${ProfessionalStatus}->${ProfessionalStatus}`[] = [
  "CANDIDATO->RECHAZADO",
  "DOCUMENTACION_PENDIENTE->RECHAZADO",
  "VERIFICANDO->RECHAZADO",
  "APROBADO->SUSPENDIDO",
  "SUSPENDIDO->RECHAZADO",
];

export const TERMINAL_PROFESSIONAL_STATUSES: readonly ProfessionalStatus[] = ["RECHAZADO"];

export function isProfessionalTerminal(status: ProfessionalStatus): boolean {
  return TERMINAL_PROFESSIONAL_STATUSES.includes(status);
}

export function allowedNextProfessionalStatuses(from: ProfessionalStatus): ProfessionalStatus[] {
  return [...TRANSITIONS[from]];
}

/** Only an APROBADO professional may be assigned work. */
export function isAssignable(status: ProfessionalStatus): boolean {
  return status === "APROBADO";
}

export type ProfessionalTransitionError =
  | { kind: "invalid_transition"; from: ProfessionalStatus; to: ProfessionalStatus }
  | { kind: "reason_required"; from: ProfessionalStatus; to: ProfessionalStatus };

export function validateProfessionalTransition(input: {
  from: ProfessionalStatus;
  to: ProfessionalStatus;
  reason?: string;
}): { ok: true } | { ok: false; error: ProfessionalTransitionError } {
  const { from, to, reason } = input;
  if (!TRANSITIONS[from]?.includes(to)) {
    return { ok: false, error: { kind: "invalid_transition", from, to } };
  }
  if (
    REASON_REQUIRED.includes(
      `${from}->${to}` as `${ProfessionalStatus}->${ProfessionalStatus}`,
    ) &&
    !reason?.trim()
  ) {
    return { ok: false, error: { kind: "reason_required", from, to } };
  }
  return { ok: true };
}
