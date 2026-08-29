/**
 * Mailer — transactional email via a configurable adapter (issue #13).
 * A failure here never loses the request; the caller records the failed
 * Communication row and retries.
 */
export interface EmailMessage {
  to: string;
  subject: string;
  text: string;
  html?: string;
  /** correlate with a Communication row — never contains secrets */
  tag?: string;
}

export interface DeliveryReceipt {
  ok: boolean;
  providerId?: string;
  error?: string;
}

export interface Mailer {
  send(message: EmailMessage): Promise<DeliveryReceipt>;
}

export { createMemoryMailer } from "./memory";
export { createConsoleMailer } from "./console";
