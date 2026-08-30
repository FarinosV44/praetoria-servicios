import { z } from "zod";
import { toSlug } from "./slug";

/**
 * Block-based article body (issue #24). Stored as a validated JSON array; one
 * server component renders it. No raw HTML is ever accepted or emitted, so
 * there is no injection surface.
 */

const heading = z.object({
  type: z.literal("heading"),
  level: z.union([z.literal(2), z.literal(3)]),
  text: z.string().trim().min(1).max(200),
});
const text = z.object({
  type: z.literal("text"),
  // lightweight inline formatting only: **bold**, *italic*, [t](url)
  md: z.string().trim().min(1).max(8000),
});
const list = z.object({
  type: z.literal("list"),
  ordered: z.boolean().default(false),
  items: z.array(z.string().trim().min(1).max(500)).min(1).max(50),
});
const quote = z.object({
  type: z.literal("quote"),
  text: z.string().trim().min(1).max(1000),
  cite: z.string().trim().max(200).optional(),
});
const cta = z.object({
  type: z.literal("cta"),
  label: z.string().trim().min(1).max(80),
  href: z.string().trim().max(300).default("/solicitar"),
});
const table = z.object({
  type: z.literal("table"),
  headers: z.array(z.string().trim().max(120)).min(1).max(8),
  rows: z.array(z.array(z.string().trim().max(400)).min(1).max(8)).min(1).max(50),
});
const image = z.object({
  type: z.literal("image"),
  src: z.string().trim().min(1).max(500),
  alt: z.string().trim().max(300), // required (may be "" — the quality check flags empty)
  caption: z.string().trim().max(300).optional(),
  credit: z.string().trim().max(200).optional(),
});
const notice = z.object({
  type: z.literal("notice"),
  tone: z.enum(["info", "warning"]),
  text: z.string().trim().min(1).max(1000),
});
const faq = z.object({
  type: z.literal("faq"),
  items: z
    .array(
      z.object({
        q: z.string().trim().min(3).max(300),
        a: z.string().trim().min(3).max(2000),
      }),
    )
    .min(1)
    .max(30),
});

export const blockSchema = z.discriminatedUnion("type", [
  heading,
  text,
  list,
  quote,
  cta,
  table,
  image,
  notice,
  faq,
]);
export type Block = z.infer<typeof blockSchema>;

export const bodySchema = z.array(blockSchema).max(200);
export type ArticleBody = z.infer<typeof bodySchema>;

/** Headings for the table of contents, each with a stable anchor id. */
export function headingsOf(body: unknown): { level: number; text: string; id: string }[] {
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) return [];
  return parsed.data
    .filter((b): b is Extract<Block, { type: "heading" }> => b.type === "heading")
    .map((b) => ({ level: b.level, text: b.text, id: toSlug(b.text) }));
}

/** FAQ items across every faq block — for FAQPage JSON-LD. */
export function faqItemsOf(body: unknown): { q: string; a: string }[] {
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) return [];
  return parsed.data
    .filter((b): b is Extract<Block, { type: "faq" }> => b.type === "faq")
    .flatMap((b) => b.items);
}

/** Images referenced by the body (for the missing-alt quality check). */
export function imagesOf(body: unknown): { src: string; alt: string }[] {
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) return [];
  return parsed.data
    .filter((b): b is Extract<Block, { type: "image" }> => b.type === "image")
    .map((b) => ({ src: b.src, alt: b.alt }));
}
