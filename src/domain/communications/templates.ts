import type { CommKind } from "@prisma/client";
import { COPY } from "@/config/copy";

/**
 * Template rendering for communications (issue #13). Pure: takes a context,
 * returns a rendered message. Every user-facing string comes from
 * `src/config/copy` so an operator can change wording (and the brand name)
 * without a code change.
 */

export type TemplateContext = {
  /** brand name — defaults to the configured "Praetoria Servicios" */
  brand?: string;
  clientName: string;
  reference: string;
  /** admin-authored text for INFO_REQUEST / GENERIC (never client PII) */
  message?: string;
  /** client status URL for QUOTE_AVAILABLE (the signed `/s/<token>` link, issue #16) */
  url?: string;
};

export type RenderedMessage = {
  subject: string;
  text: string;
  html: string;
};

function fill(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (whole, key: string) =>
    key in vars ? vars[key] : whole,
  );
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Minimal responsive HTML wrapper — inline styles only, safe for email clients. */
function wrapHtml(brand: string, bodyText: string, footer: string): string {
  const paragraphs = bodyText
    .split(/\n{2,}/)
    .map((p) => `<p style="margin:0 0 16px;">${escapeHtml(p).replace(/\n/g, "<br>")}</p>`)
    .join("");
  return [
    `<!doctype html><html lang="es"><head><meta charset="utf-8">`,
    `<meta name="viewport" content="width=device-width,initial-scale=1"></head>`,
    `<body style="margin:0;background:#f4f4f5;">`,
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:24px 0;">`,
    `<tr><td align="center">`,
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:12px;padding:32px;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;font-size:16px;line-height:1.5;color:#1f2937;">`,
    `<tr><td>`,
    `<p style="margin:0 0 24px;font-weight:700;font-size:18px;color:#111827;">${escapeHtml(brand)}</p>`,
    paragraphs,
    `<hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;">`,
    `<p style="margin:0;font-size:13px;color:#6b7280;">${escapeHtml(footer)}</p>`,
    `</td></tr></table></td></tr></table></body></html>`,
  ].join("");
}

export function renderTemplate(kind: CommKind, ctx: TemplateContext): RenderedMessage {
  const brand = ctx.brand?.trim() || COPY.brand.name;
  const c = COPY.comms;
  const base: Record<string, string> = {
    brand,
    name: ctx.clientName,
    reference: ctx.reference,
    message: ctx.message ?? "",
    signature: fill(c.signature, { brand }),
  };

  let subjectTpl: string;
  let bodyTpl: string;

  switch (kind) {
    case "CONFIRMATION":
      subjectTpl = c.confirmation.subject;
      bodyTpl = c.confirmation.body;
      base.url = ctx.url?.trim()
        ? fill(c.confirmation.urlLine, { url: ctx.url.trim() })
        : c.confirmation.noUrlLine;
      break;
    case "INFO_REQUEST":
      subjectTpl = c.infoRequest.subject;
      bodyTpl = c.infoRequest.body;
      break;
    case "QUOTE_AVAILABLE":
      subjectTpl = c.quoteAvailable.subject;
      bodyTpl = c.quoteAvailable.body;
      base.url = ctx.url?.trim()
        ? fill(c.quoteAvailable.urlLine, { url: ctx.url.trim() })
        : c.quoteAvailable.noUrlLine;
      break;
    case "GENERIC":
      subjectTpl = c.generic.subject;
      bodyTpl = c.generic.body;
      break;
  }

  const subject = fill(subjectTpl, base);
  const text = fill(bodyTpl, base).trim();
  return { subject, text, html: wrapStoredText(brand, ctx.reference, text) };
}

/**
 * Rebuild the HTML wrapper from a stored plain-text body — used when a queued
 * message is sent (the plain text is persisted on the `Communication` row; the
 * HTML is regenerated rather than stored twice).
 */
export function wrapStoredText(brand: string, reference: string, text: string): string {
  const footer = fill(COPY.comms.footer, { brand, reference });
  return wrapHtml(brand || COPY.brand.name, text, footer);
}

/** Truncated plain-text preview for compact UI display (never a token). */
export function bodyPreview(text: string, max = 240): string {
  const oneLine = text.replace(/\s+/g, " ").trim();
  return oneLine.length > max ? oneLine.slice(0, max - 1) + "…" : oneLine;
}
