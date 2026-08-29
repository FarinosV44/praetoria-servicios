import "server-only";
import { env } from "@/lib/env";

import { createMockAiAnalyzer, type AiAnalyzer } from "@/adapters/ai";
import { createFsBlobStore, createMemoryBlobStore, type BlobStore } from "@/adapters/storage";
import { createConsoleMailer, createMemoryMailer, type Mailer } from "@/adapters/email";
import { createLinkWhatsappSender, type WhatsappSender } from "@/adapters/whatsapp";
import { createMockOcrEngine, type OcrEngine } from "@/adapters/ocr";

/**
 * The composition root — the ONLY place that maps env selectors to concrete
 * adapter implementations (docs/03-technical-plan.md). Domain code receives
 * interfaces from here and never imports a concrete provider.
 *
 * Real providers (claude / s3 / smtp / provider / tesseract|cloud) are wired in
 * by their own issues; until then selecting them throws a clear error rather
 * than silently degrading.
 */
export interface Adapters {
  ai: AiAnalyzer;
  storage: BlobStore;
  mailer: Mailer;
  whatsapp: WhatsappSender;
  ocr: OcrEngine;
}

function notImplemented(what: string): never {
  throw new Error(
    `${what} adapter is selected but not implemented yet. Use a development/mock value or wait for its issue.`,
  );
}

let cached: Adapters | undefined;

export function getAdapters(): Adapters {
  if (cached) return cached;

  const ai: AiAnalyzer =
    env.AI_ADAPTER === "claude" ? notImplemented("claude AI") : createMockAiAnalyzer();

  const storage: BlobStore =
    env.STORAGE_ADAPTER === "s3"
      ? notImplemented("s3 storage")
      : env.STORAGE_ADAPTER === "memory"
        ? createMemoryBlobStore()
        : createFsBlobStore();

  const mailer: Mailer =
    env.EMAIL_ADAPTER === "smtp"
      ? notImplemented("smtp email")
      : env.EMAIL_ADAPTER === "memory"
        ? createMemoryMailer()
        : createConsoleMailer();

  const whatsapp: WhatsappSender =
    env.WHATSAPP_ADAPTER === "provider"
      ? notImplemented("whatsapp provider")
      : createLinkWhatsappSender();

  const ocr: OcrEngine =
    env.OCR_ADAPTER === "mock" ? createMockOcrEngine() : notImplemented(`${env.OCR_ADAPTER} OCR`);

  cached = { ai, storage, mailer, whatsapp, ocr };
  return cached;
}

/** Test helper — force a specific adapter set. */
export function __setAdapters(a: Adapters | undefined) {
  cached = a;
}
