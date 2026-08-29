import { env } from "@/lib/env";

/**
 * WhatsappSender — MVP is a pre-filled link an admin sends manually (issue #13:
 * "No afirmar envío automático si solo se ha generado el enlace"). The interface
 * leaves room for a future Business API provider.
 */
export interface WhatsappMessage {
  /** recipient phone in E.164 without '+' */
  to: string;
  text: string;
  tag?: string;
}

export interface WhatsappPrepared {
  /** wa.me deep link with the message pre-filled */
  url: string;
  /** true only if an actual API send happened */
  autoSent: boolean;
}

export interface WhatsappSender {
  prepare(message: WhatsappMessage): Promise<WhatsappPrepared>;
}

export function createLinkWhatsappSender(): WhatsappSender {
  return {
    async prepare(message: WhatsappMessage): Promise<WhatsappPrepared> {
      const to = message.to.replace(/[^\d]/g, "");
      const url = `https://wa.me/${to}?text=${encodeURIComponent(message.text)}`;
      return { url, autoSent: false };
    },
  };
}

/** Deep link FROM the client TO the business (used on the "contact us" surfaces). */
export function businessWhatsappLink(text: string): string | null {
  if (!env.WHATSAPP_BUSINESS_NUMBER) return null;
  return `https://wa.me/${env.WHATSAPP_BUSINESS_NUMBER}?text=${encodeURIComponent(text)}`;
}
