import type { DeliveryReceipt, EmailMessage, Mailer } from "./index";

export interface MemoryMailer extends Mailer {
  readonly outbox: EmailMessage[];
  clear(): void;
}

/** In-memory mailer for tests — assert against `outbox`. */
export function createMemoryMailer(): MemoryMailer {
  const outbox: EmailMessage[] = [];
  return {
    outbox,
    clear() {
      outbox.length = 0;
    },
    async send(message: EmailMessage): Promise<DeliveryReceipt> {
      outbox.push(message);
      return { ok: true, providerId: `mem-${outbox.length}` };
    },
  };
}
