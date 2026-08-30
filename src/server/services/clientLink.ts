import "server-only";
import { db } from "@/lib/db";
import { log } from "@/lib/logging";
import { env } from "@/lib/env";
import { LIMITS } from "@/config/limits";
import { COPY } from "@/config/copy";
import { findTrade } from "@/config/trades";
import { TRUST_CHARTER } from "@/config/trust-charter";
import { formatEuros, type Cents } from "@/lib/money";
import { phoneLast4Matches } from "@/lib/phone";
import { issueClientLink, parseClientLink, hashToken } from "@/lib/signed-link";
import { clientStatusView, canAddInfo, canDecideQuote } from "@/domain/requests/client-view";
import { err, ok, type Result } from "@/lib/result";
import { quoteService } from "./quotes";
import type { RequestStatus } from "@/domain/requests/state-machine";

/**
 * Signed client status link (issue #16). No client account: the client reaches
 * their request through a random, revocable, expiring token. Only the token's
 * SHA-256 hash is stored, and the token itself is HMAC-signed so a tampered or
 * guessed value fails before any DB read.
 */

export type ClientLinkError =
  | { kind: "invalid" } // malformed / bad signature / unknown
  | { kind: "expired" }
  | { kind: "revoked" }
  | { kind: "not_configured" }
  | { kind: "request_not_found" }
  | { kind: "verification_failed" }
  | { kind: "not_allowed" } // action not valid in the current status
  | { kind: "quote_error"; detail: string };

function ttlHours(): number {
  return LIMITS.signedLink.defaultTtlHours;
}

function baseUrl(): string {
  return env.APP_URL.replace(/\/$/, "");
}

export const clientLinkService = {
  /** Issue a fresh link for a request. Returns the token URL (shown/sent once). */
  async issue(requestId: string, opts: { ttlHours?: number } = {}): Promise<{ token: string; url: string; expiresAt: Date }> {
    const issued = issueClientLink(requestId, opts.ttlHours ?? ttlHours());
    await db.clientLink.create({
      data: { requestId, tokenHash: issued.tokenHash, expiresAt: issued.expiresAt },
    });
    log.info("client link issued", { requestId });
    return { token: issued.token, url: `${baseUrl()}/s/${issued.token}`, expiresAt: issued.expiresAt };
  },

  /** Resolve a token to a request id, enforcing signature, hash, expiry and revocation. */
  async resolve(token: string): Promise<Result<{ requestId: string }, ClientLinkError>> {
    const parsed = parseClientLink(token);
    if (!parsed.ok) {
      if (parsed.reason === "not_configured") return err({ kind: "not_configured" });
      if (parsed.reason === "expired") return err({ kind: "expired" });
      return err({ kind: "invalid" });
    }
    const row = await db.clientLink.findUnique({ where: { tokenHash: hashToken(token) } });
    if (!row || row.requestId !== parsed.requestId) return err({ kind: "invalid" });
    if (row.revokedAt) return err({ kind: "revoked" });
    if (row.expiresAt.getTime() < Date.now()) return err({ kind: "expired" });

    await db.clientLink.update({ where: { id: row.id }, data: { lastUsedAt: new Date() } });
    return ok({ requestId: row.requestId });
  },

  /** Revoke every active link for a request (issue #16: "revocable"). */
  async revokeAll(requestId: string): Promise<number> {
    const { count } = await db.clientLink.updateMany({
      where: { requestId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    return count;
  },

  /**
   * Regenerate access from a verified contact (issue #16). The client proves
   * ownership with the request reference + the last 4 digits of the contact
   * phone; old links are revoked and a new one is issued.
   */
  async regenerate(
    reference: string,
    phoneLast4: string,
  ): Promise<Result<{ url: string }, ClientLinkError>> {
    const request = await db.request.findUnique({
      where: { reference },
      include: { contact: true },
    });
    if (!request || !request.contact) return err({ kind: "request_not_found" });
    if (!phoneLast4Matches(request.contact.phone, phoneLast4)) {
      log.warn("client link regenerate: verification failed", { reference });
      return err({ kind: "verification_failed" });
    }
    await this.revokeAll(request.id);
    const issued = await this.issue(request.id);
    return ok({ url: issued.url });
  },

  /** The comprehensible client view of a request — never another client's data. */
  async getClientView(requestId: string) {
    const request = await db.request.findUnique({
      where: { id: requestId },
      include: {
        contact: { select: { name: true, phone: true } },
        photos: { where: { deletedAt: null }, select: { id: true } },
        analyses: { where: { isActive: true }, orderBy: { version: "desc" }, take: 1 },
        quotes: {
          where: { status: { in: ["ENVIADO", "ACEPTADO", "RECHAZADO", "CADUCADO"] } },
          orderBy: { version: "desc" },
          take: 1,
          include: { lines: { orderBy: { position: "asc" } } },
        },
      },
    });
    if (!request) return null;

    const status = request.status as RequestStatus;
    const analysis = request.analyses[0];
    const analysisResult =
      analysis && analysis.outcome !== "PROVIDER_ERROR"
        ? (analysis.result as Record<string, unknown>)
        : null;

    const quote = request.quotes[0];

    return {
      reference: request.reference,
      status: clientStatusView(status),
      rawStatus: status,
      clientName: request.contact?.name ?? null,
      hasPhone: !!request.contact?.phone,
      trade: findTrade(request.trade)?.label ?? null,
      municipality: request.municipality ?? null,
      submittedAt: request.submittedAt,
      photoCount: request.photos.length,
      canAddInfo: canAddInfo(status),
      canDecideQuote: canDecideQuote(status),
      analysis: analysisResult
        ? {
            plainSummary: String(analysisResult.plainSummary ?? ""),
            orientativeSolution: String(analysisResult.orientativeSolution ?? ""),
            disclaimer: COPY.disclaimers.aiOrientative,
          }
        : null,
      quote: quote
        ? {
            id: quote.id,
            version: quote.version,
            status: quote.status,
            workDescription: quote.workDescription,
            isEstimate: quote.isEstimate,
            lines: quote.lines.map((l) => ({
              concept: l.concept,
              amount: formatEuros(l.amountCents as Cents),
              included: l.included,
            })),
            subtotal: formatEuros(quote.subtotalCents as Cents),
            tax: formatEuros(quote.taxCents as Cents),
            total: formatEuros(quote.totalCents as Cents),
            maxTotal: quote.maxTotalCents != null ? formatEuros(quote.maxTotalCents as Cents) : null,
            visitFee: quote.visitFeeCents != null ? formatEuros(quote.visitFeeCents as Cents) : null,
            visitFeeDiscounted: quote.visitFeeDiscounted,
            exclusionsNote: quote.exclusionsNote,
            assumptions: quote.assumptions,
            extrasApprovalNote: quote.extrasApprovalNote,
            preparatoryNote: quote.preparatoryNote,
            professionalRef: quote.professionalRef,
            verificationScope: quote.verificationScope,
            scheduledFor: quote.scheduledFor,
            durationEstimate: quote.durationEstimate,
            warrantyText: quote.warrantyText,
            warrantyResponsible: quote.warrantyResponsible,
            estimatedTimeframe: quote.estimatedTimeframe,
            validUntil: quote.validUntil,
            observations: quote.observations,
          }
        : null,
    };
  },

  /**
   * Client adds information / a clarification message (issue #16). Stored as a
   * ClientCorrection; when the request was waiting for info, it moves back into
   * the analysis queue.
   */
  async addClientInfo(
    requestId: string,
    message: string,
    kind: "info" | "clarification",
  ): Promise<Result<null, ClientLinkError>> {
    const request = await db.request.findUnique({
      where: { id: requestId },
      select: { id: true, status: true },
    });
    if (!request) return err({ kind: "request_not_found" });

    await db.clientCorrection.create({
      data: {
        requestId,
        wrongSections: [],
        clarification:
          kind === "clarification" ? `[Solicitud de aclaración] ${message}` : message,
        addedPhotoIds: [],
      },
    });

    if (kind === "info" && request.status === "REQUIERE_INFORMACION") {
      const { requestService } = await import("./requests");
      await requestService.applyTransition({
        requestId,
        to: "PENDIENTE_ANALISIS",
        actor: "CLIENT",
        reason: "El cliente aportó la información solicitada",
      });
    }
    log.info("client info added", { requestId, kind });
    return ok(null);
  },

  /**
   * Client accepts or rejects the active quote from the link (issue #16).
   * Requires the last-4 phone check; records the evidence on the quote.
   */
  async decideQuote(
    requestId: string,
    quoteId: string,
    decision: "ACEPTADO" | "RECHAZADO",
    phoneLast4: string,
    evidence: { ip?: string; userAgent?: string },
  ): Promise<Result<null, ClientLinkError>> {
    const request = await db.request.findUnique({
      where: { id: requestId },
      include: { contact: { select: { phone: true } } },
    });
    if (!request) return err({ kind: "request_not_found" });
    if (!canDecideQuote(request.status as RequestStatus)) return err({ kind: "not_allowed" });
    if (!phoneLast4Matches(request.contact?.phone, phoneLast4)) {
      log.warn("quote decision: verification failed", { reference: request.reference });
      return err({ kind: "verification_failed" });
    }

    const quote = await db.quote.findFirst({
      where: { id: quoteId, requestId, status: "ENVIADO" },
      select: { id: true, version: true },
    });
    if (!quote) return err({ kind: "not_allowed" });

    const r = await quoteService.recordDecision(quoteId, decision, {
      via: "signed-link",
      decidedAt: new Date().toISOString(),
      quoteVersion: quote.version,
      // The Carta de Confianza version in effect at acceptance (issue #21): a
      // later change to the charter never alters an already-accepted request.
      charterVersion: TRUST_CHARTER.version,
      ip: evidence.ip ?? null,
      userAgent: evidence.userAgent?.slice(0, 300) ?? null,
    });
    if (!r.ok) return err({ kind: "quote_error", detail: r.error.kind });
    log.info("client quote decision", { reference: request.reference, decision });
    return ok(null);
  },
};

export type ClientLinkService = typeof clientLinkService;
