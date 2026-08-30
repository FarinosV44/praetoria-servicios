import "server-only";
import { db } from "@/lib/db";
import { log } from "@/lib/logging";
import { LIMITS } from "@/config/limits";
import { COPY } from "@/config/copy";
import { getAdapters } from "@/server/container";
import { err, ok, type Result } from "@/lib/result";
import {
  canSend,
  channelForContact,
  type ConsentMap,
} from "@/domain/communications/schema";
import { renderTemplate, bodyPreview, wrapStoredText } from "@/domain/communications/templates";
import type { CommKind, Communication } from "@prisma/client";

/**
 * Communications service (issue #13). Creates `Communication` rows, runs a
 * simple email queue with bounded retries, and prepares WhatsApp deep links for
 * an admin to send manually. A failure here never rolls back the request.
 *
 * Simulated mode: `EMAIL_ADAPTER=memory|console`, `WHATSAPP_ADAPTER=link` —
 * all resolved in `src/server/container.ts`; no real provider is required.
 */

export type CommError =
  | { kind: "request_not_found" }
  | { kind: "no_contact" }
  | { kind: "unreachable" } // no email and no phone
  | { kind: "consent_denied" };

export type EnqueueInput = {
  requestId: string;
  kind: CommKind;
  /** admin-authored text for INFO_REQUEST / GENERIC (never client PII) */
  message?: string;
  /** client status URL for QUOTE_AVAILABLE (the signed link — issue #16) */
  url?: string;
};

const MAX_ATTEMPTS = LIMITS.communications.maxAttempts;

function consentMap(rows: { type: string; granted: boolean }[]): ConsentMap {
  const m: ConsentMap = {};
  for (const r of rows) m[r.type as keyof ConsentMap] = r.granted;
  return m;
}

export const communicationService = {
  /**
   * Create a pending communication for a request event. Idempotent per
   * (request, kind): a second call while a non-failed row already exists is a
   * no-op that returns the existing row.
   */
  async enqueue(
    input: EnqueueInput,
  ): Promise<Result<{ id: string; status: string; skipped?: true }, CommError>> {
    const request = await db.request.findUnique({
      where: { id: input.requestId },
      include: { contact: true, consents: true },
    });
    if (!request) return err({ kind: "request_not_found" });
    if (!request.contact) return err({ kind: "no_contact" });

    if (!canSend(input.kind, consentMap(request.consents))) {
      return err({ kind: "consent_denied" });
    }

    const channel = channelForContact({
      email: request.contact.email,
      phone: request.contact.phone,
      preferredChannel: request.contact.preferredChannel,
    });
    if (!channel) return err({ kind: "unreachable" });

    const existing = await db.communication.findFirst({
      where: { requestId: request.id, kind: input.kind, status: { not: "FAILED" } },
      orderBy: { createdAt: "desc" },
    });
    if (existing) return ok({ id: existing.id, status: existing.status, skipped: true });

    const rendered = renderTemplate(input.kind, {
      clientName: request.contact.name,
      reference: request.reference,
      message: input.message,
      // The stored body never carries the signed token; the real URL is applied
      // only when the email is actually sent (see sendPending). #16 wires this.
      url: undefined,
    });

    // WhatsApp is never auto-sent — the row is LINK_PREPARED and an admin sends
    // the deep link manually (issue #13: "No afirmar envío automático").
    const status = channel === "WHATSAPP" ? "LINK_PREPARED" : "PENDING";

    const row = await db.communication.create({
      data: {
        requestId: request.id,
        channel,
        kind: input.kind,
        status,
        subject: rendered.subject,
        bodyPreview: rendered.text.slice(0, 4000),
      },
    });
    log.info("communication enqueued", {
      requestId: request.id,
      kind: input.kind,
      channel,
      status,
    });
    return ok({ id: row.id, status });
  },

  /**
   * Process the email queue: render is already persisted as plain text; send it,
   * regenerate the HTML, and record delivery or failure. Called by an admin
   * action now; a scheduled runner is wired in issue #19.
   */
  async sendPending(opts: { max?: number } = {}): Promise<{ sent: number; failed: number }> {
    const max = opts.max ?? LIMITS.communications.batchSize;
    const rows = await db.communication.findMany({
      where: { channel: "EMAIL", status: "PENDING", attempts: { lt: MAX_ATTEMPTS } },
      orderBy: { createdAt: "asc" },
      take: max,
      include: { request: { include: { contact: true } } },
    });

    const { mailer } = getAdapters();
    let sent = 0;
    let failed = 0;

    for (const row of rows) {
      const to = row.request.contact?.email;
      const brand = COPY.brand.name;
      if (!to) {
        await db.communication.update({
          where: { id: row.id },
          data: { status: "FAILED", error: "no email on contact", attempts: { increment: 1 } },
        });
        failed++;
        continue;
      }
      const text = row.bodyPreview ?? "";
      const receipt = await mailer.send({
        to,
        subject: row.subject ?? `${brand} · ${row.request.reference}`,
        text,
        html: wrapStoredText(brand, row.request.reference, text),
        tag: `${row.kind}:${row.request.reference}`,
      });
      if (receipt.ok) {
        await db.communication.update({
          where: { id: row.id },
          data: {
            status: "SENT",
            providerId: receipt.providerId ?? null,
            error: null,
            attempts: { increment: 1 },
          },
        });
        sent++;
      } else {
        await db.communication.update({
          where: { id: row.id },
          data: {
            status: "FAILED",
            error: (receipt.error ?? "send failed").slice(0, 500),
            attempts: { increment: 1 },
          },
        });
        failed++;
      }
    }
    if (sent || failed) log.info("communication queue processed", { sent, failed });
    return { sent, failed };
  },

  /** Move FAILED rows that still have retries left back to PENDING. */
  async retry(requestId?: string): Promise<number> {
    const { count } = await db.communication.updateMany({
      where: {
        ...(requestId ? { requestId } : {}),
        channel: "EMAIL",
        status: "FAILED",
        attempts: { lt: MAX_ATTEMPTS },
      },
      data: { status: "PENDING", error: null },
    });
    return count;
  },

  /**
   * Build the WhatsApp deep link for a LINK_PREPARED row so an admin can send it.
   * The link carries no secret; the row stays LINK_PREPARED (never SENT).
   */
  async whatsappLink(
    communicationId: string,
  ): Promise<Result<{ url: string }, CommError>> {
    const row = await db.communication.findUnique({
      where: { id: communicationId },
      include: { request: { select: { reference: true, contact: { select: { phone: true } } } } },
    });
    if (!row) return err({ kind: "request_not_found" });
    const phone = row.request.contact?.phone;
    if (!phone) return err({ kind: "unreachable" });

    // Use the body rendered at enqueue time (it carries the admin's message for
    // INFO_REQUEST); it never contains a secret.
    const text =
      row.bodyPreview ??
      renderTemplate(row.kind, { clientName: "", reference: row.request.reference }).text;
    const { whatsapp } = getAdapters();
    const prepared = await whatsapp.prepare({
      to: phone.replace(/[^\d]/g, ""),
      text,
      tag: `${row.kind}:${row.request.reference}`,
    });
    await db.communication.update({ where: { id: row.id }, data: { updatedAt: new Date() } });
    return ok({ url: prepared.url });
  },

  listForRequest(requestId: string): Promise<Communication[]> {
    return db.communication.findMany({
      where: { requestId },
      orderBy: { createdAt: "desc" },
    });
  },

  /**
   * Best-effort enqueue + immediate flush, used from flow wiring. Never throws
   * and never blocks the caller's result — issue #13: "Un fallo de comunicación
   * no pierde la solicitud."
   */
  async notify(input: EnqueueInput): Promise<void> {
    try {
      const r = await this.enqueue(input);
      if (!r.ok) {
        log.warn("communication enqueue skipped", { kind: input.kind, reason: r.error.kind });
        return;
      }
      if (!r.value.skipped && r.value.status === "PENDING") {
        await this.sendPending({ max: 3 });
      }
    } catch (e) {
      log.error("communication notify failed", { kind: input.kind, error: String(e) });
    }
  },
};

export { bodyPreview };
export type CommunicationService = typeof communicationService;
