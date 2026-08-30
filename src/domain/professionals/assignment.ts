import { isRegulatedTrade } from "@/config/trades";
import type { ProfessionalStatus } from "./state-machine";
import { isAssignable } from "./state-machine";

/**
 * Assignment compatibility (issue #22).
 *
 * `checkAssignment` is the single gate the admin panel calls before offering — or
 * confirming — a professional for a request. It reports EVERY incompatibility at
 * once so an operator sees the whole picture, and it is the only place the
 * "no regulated trade without a current credential" rule lives.
 */

export interface ProfessionalCredential {
  trade: string;
  /** null = credential with no stated expiry (e.g. a lifetime carné) */
  expiresAt: Date | null;
}

export interface AssignableProfessional {
  status: ProfessionalStatus;
  /** trade keys this professional is admitted for */
  trades: string[];
  /** municipalities this professional covers (matched accent-insensitively) */
  municipalities: string[];
  credentials: ProfessionalCredential[];
}

export interface AssignmentRequest {
  trade: string | null;
  municipality: string | null;
  postalCode: string | null;
}

export type AssignmentBlockKind = "status" | "trade" | "zone" | "credential";

export interface AssignmentBlock {
  kind: AssignmentBlockKind;
  detail: string;
}

export type AssignmentCheck = { ok: true } | { ok: false; reasons: AssignmentBlock[] };

const norm = (s: string) =>
  s.trim().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

export function checkAssignment(
  professional: AssignableProfessional,
  request: AssignmentRequest,
  now: Date = new Date(),
): AssignmentCheck {
  const reasons: AssignmentBlock[] = [];

  if (!isAssignable(professional.status)) {
    reasons.push({
      kind: "status",
      detail: `El profesional está en estado ${professional.status}; solo se puede asignar un profesional APROBADO.`,
    });
  }

  if (!request.trade) {
    reasons.push({ kind: "trade", detail: "La solicitud no tiene un oficio resuelto todavía." });
  } else if (!professional.trades.includes(request.trade)) {
    reasons.push({
      kind: "trade",
      detail: `El profesional no está admitido para el oficio «${request.trade}».`,
    });
  }

  if (request.municipality) {
    const wanted = norm(request.municipality);
    const covers = professional.municipalities.some((m) => norm(m) === wanted);
    if (!covers) {
      reasons.push({
        kind: "zone",
        detail: `El profesional no cubre «${request.municipality}».`,
      });
    }
  }

  if (request.trade && isRegulatedTrade(request.trade)) {
    const cred = professional.credentials.find((c) => c.trade === request.trade);
    if (!cred) {
      reasons.push({
        kind: "credential",
        detail: `«${request.trade}» es un oficio regulado y el profesional no tiene acreditación registrada.`,
      });
    } else if (cred.expiresAt && cred.expiresAt.getTime() <= now.getTime()) {
      reasons.push({
        kind: "credential",
        detail: `La acreditación para «${request.trade}» está caducada (${cred.expiresAt.toISOString().slice(0, 10)}).`,
      });
    }
  }

  return reasons.length ? { ok: false, reasons } : { ok: true };
}
