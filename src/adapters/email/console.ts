import { log } from "@/lib/logging";
import type { DeliveryReceipt, EmailMessage, Mailer } from "./index";

/** Dev mailer — logs a redacted summary instead of sending. */
export function createConsoleMailer(): Mailer {
  return {
    async send(message: EmailMessage): Promise<DeliveryReceipt> {
      log.info("email (console adapter)", {
        to: message.to,
        subject: message.subject,
        tag: message.tag,
        bytes: message.text.length,
      });
      return { ok: true, providerId: `console-${Date.now()}` };
    },
  };
}
