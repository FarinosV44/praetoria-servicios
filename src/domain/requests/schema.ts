import { z } from "zod";
import { LIMITS } from "@/config/limits";
import { isKnownTrade, UNSURE_KEY } from "@/config/trades";
import { normalizeSpanishPhone } from "@/lib/phone";

/**
 * Shared validation schemas for the request domain (issue #9, #10).
 * Used by server actions and the assistant. Client and server validate against
 * the same shapes.
 */

export const tradeSelectionSchema = z
  .string()
  .refine((v) => v === UNSURE_KEY || isKnownTrade(v), "Oficio no reconocido");

export const problemTextSchema = z
  .string()
  .trim()
  .min(LIMITS.problemText.minChars, "Cuéntanos un poco más sobre el problema")
  .max(LIMITS.problemText.maxChars, "El texto es demasiado largo");

export const spanishPhoneSchema = z.string().refine((v) => normalizeSpanishPhone(v).ok, {
  message: "Introduce un teléfono español válido",
});

export const municipalitySchema = z.string().trim().min(2).max(80);
export const postalCodeSchema = z
  .string()
  .trim()
  .regex(/^\d{5}$/, "El código postal debe tener 5 dígitos");

export const contactChannelSchema = z.enum(["WHATSAPP", "EMAIL"]);

/** Create a draft (assistant step 1). Everything optional except a trade choice. */
export const createDraftSchema = z.object({
  trade: tradeSelectionSchema.optional(),
  clientChoseUnsure: z.boolean().default(false),
});

/** Attach the problem description + location. */
export const describeProblemSchema = z.object({
  problemText: problemTextSchema,
  municipality: municipalitySchema,
  postalCode: postalCodeSchema,
});

export const consentInputSchema = z.object({
  requestHandling: z.literal(true, {
    message: "Necesitamos este consentimiento para gestionar tu solicitud",
  }),
  operationalComms: z.boolean(),
  marketing: z.boolean().default(false),
  textVersion: z.string().min(1),
});

/** Contact + consent (assistant final step, issue #10). */
export const contactSchema = z
  .object({
    name: z.string().trim().min(2, "Indícanos tu nombre").max(120),
    phone: spanishPhoneSchema.optional().or(z.literal("")),
    email: z.string().trim().email("Correo electrónico no válido").optional().or(z.literal("")),
    preferredChannel: contactChannelSchema,
    availabilityNote: z.string().trim().max(300).optional(),
    consent: consentInputSchema,
  })
  .refine((v) => !!v.phone || !!v.email, {
    message: "Necesitamos un teléfono o un correo para responderte",
    path: ["phone"],
  })
  .refine((v) => v.preferredChannel !== "WHATSAPP" || !!v.phone, {
    message: "Para contactar por WhatsApp necesitamos tu teléfono",
    path: ["phone"],
  })
  .refine((v) => v.preferredChannel !== "EMAIL" || !!v.email, {
    message: "Para contactar por correo necesitamos tu email",
    path: ["email"],
  });

export type CreateDraftInput = z.infer<typeof createDraftSchema>;
export type DescribeProblemInput = z.infer<typeof describeProblemSchema>;
export type ContactInput = z.infer<typeof contactSchema>;
