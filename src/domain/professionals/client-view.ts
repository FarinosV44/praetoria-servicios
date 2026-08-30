import type { VerificationKind } from "@prisma/client";

/**
 * What the CLIENT is shown about their assigned professional, before the visit
 * (issue #22 / D6). Deliberately minimal: name, trades, the honest scope of what
 * was verified, and the photo only when consent was given.
 *
 * Rule (issue #22): never present the professional as "verificado" when the only
 * check was phone/email (`CONTACT`).
 */

export interface VerificationLike {
  kind: VerificationKind;
  passed: boolean;
}

const SCOPE_LABELS: Partial<Record<VerificationKind, string>> = {
  IDENTITY: "Identidad",
  FISCAL: "Datos fiscales",
  RC_INSURANCE: "Seguro de responsabilidad civil",
  CREDENTIAL: "Habilitación profesional",
  REFERENCES: "Referencias",
  BANK_ACCOUNT: "Cuenta bancaria",
  // CONTACT is intentionally absent — it never appears in the client scope.
};

export interface ClientProfessionalView {
  displayName: string;
  trades: string[];
  /** human labels of what was actually verified (never just "contacto") */
  verifiedScope: string[];
  /** true only if at least one non-CONTACT check passed */
  isVerified: boolean;
  photoUrl: string | null;
}

export function buildClientProfessionalView(input: {
  displayName: string;
  trades: string[];
  verifications: VerificationLike[];
  photoConsent: boolean;
  photoUrl: string | null;
}): ClientProfessionalView {
  const verifiedScope = input.verifications
    .filter((v) => v.passed && v.kind !== "CONTACT")
    .map((v) => SCOPE_LABELS[v.kind])
    .filter((x): x is string => !!x);
  // de-dup, keep order
  const seen = new Set<string>();
  const scope = verifiedScope.filter((s) => (seen.has(s) ? false : (seen.add(s), true)));

  return {
    displayName: input.displayName,
    trades: input.trades,
    verifiedScope: scope,
    isVerified: scope.length > 0,
    photoUrl: input.photoConsent ? input.photoUrl : null,
  };
}
