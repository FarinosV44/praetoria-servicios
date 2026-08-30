import type { CommChannel, CommKind, ConsentType } from "@prisma/client";

/**
 * Communications domain (issue #13) — pure logic shared by the service and tests.
 * No database, no adapters, no next/*.
 */

export type ContactShape = {
  email: string | null;
  phone: string | null;
  preferredChannel: CommChannel;
};

/**
 * Purpose classification per message kind. This is what enforces
 * "no se envía marketing bajo consentimiento operativo" (issue #13): a
 * `marketing` message needs explicit MARKETING consent, which operational
 * consent never grants. v1 ships no marketing kind.
 */
export type CommPurpose = "transactional" | "operational" | "marketing";

export const KIND_PURPOSE: Record<CommKind, CommPurpose> = {
  CONFIRMATION: "transactional",
  INFO_REQUEST: "operational",
  QUOTE_AVAILABLE: "operational",
  GENERIC: "operational",
};

export type ConsentMap = Partial<Record<ConsentType, boolean>>;

/**
 * Whether a message of this kind may be sent given the request's consents.
 * - transactional: always (it is the receipt of an action the client just took)
 * - operational: allowed under REQUEST_HANDLING (granted for every request) —
 *   service delivery, not promotion
 * - marketing: only with an explicit MARKETING consent
 */
export function canSend(kind: CommKind, consents: ConsentMap): boolean {
  switch (KIND_PURPOSE[kind]) {
    case "transactional":
      return true;
    case "operational":
      return consents.REQUEST_HANDLING !== false;
    case "marketing":
      return consents.MARKETING === true;
  }
}

/**
 * Pick the channel for a message: honour the client's preferred channel when the
 * matching contact detail exists, otherwise fall back to whatever detail we have.
 * Returns null when there is no way to reach the client.
 */
export function channelForContact(contact: ContactShape): CommChannel | null {
  const hasEmail = !!contact.email?.trim();
  const hasPhone = !!contact.phone?.trim();
  if (contact.preferredChannel === "EMAIL" && hasEmail) return "EMAIL";
  if (contact.preferredChannel === "WHATSAPP" && hasPhone) return "WHATSAPP";
  if (hasEmail) return "EMAIL";
  if (hasPhone) return "WHATSAPP";
  return null;
}

/**
 * Idempotency key for a (request, kind) pair. The service uses it to avoid
 * enqueuing a second confirmation / quote-available message for the same event.
 */
export function idempotencyKey(requestId: string, kind: CommKind): string {
  return `${requestId}:${kind}`;
}
