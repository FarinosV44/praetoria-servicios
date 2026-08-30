import { z } from "zod";
import { isKnownTrade } from "@/config/trades";
import { PROFESSIONAL_STATUSES } from "./state-machine";

/** Shared validation for the professional-network admin forms (issue #22). */

const tradeKey = z.string().refine(isKnownTrade, "Oficio no reconocido");

export const professionalCreateSchema = z.object({
  legalName: z.string().trim().min(2).max(160),
  displayName: z.string().trim().min(2).max(120),
  taxId: z.string().trim().max(40).optional().or(z.literal("")),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  email: z.string().trim().email().optional().or(z.literal("")),
  trades: z.array(tradeKey).max(20).default([]),
  municipalities: z.array(z.string().trim().min(2).max(80)).max(80).default([]),
});

export const professionalUpdateSchema = professionalCreateSchema.partial().extend({
  availabilityNote: z.string().trim().max(500).optional(),
  experienceNote: z.string().trim().max(1000).optional(),
  referencesNote: z.string().trim().max(1000).optional(),
  rcInsurer: z.string().trim().max(120).optional(),
  rcPolicyNumber: z.string().trim().max(80).optional(),
  rcExpiresAt: z.coerce.date().optional().nullable(),
  bankIbanLast4: z
    .string()
    .trim()
    .regex(/^\d{4}$/, "Solo los últimos 4 dígitos")
    .optional()
    .or(z.literal("")),
  internalRating: z.number().int().min(1).max(5).optional().nullable(),
});

export const transitionSchema = z.object({
  to: z.enum(PROFESSIONAL_STATUSES),
  reason: z.string().trim().max(500).optional(),
});

export const verificationSchema = z.object({
  kind: z.enum([
    "IDENTITY",
    "FISCAL",
    "RC_INSURANCE",
    "CREDENTIAL",
    "REFERENCES",
    "BANK_ACCOUNT",
    "CONTACT",
  ]),
  passed: z.boolean(),
  note: z.string().trim().max(500).optional(),
  expiresAt: z.coerce.date().optional().nullable(),
});

export const credentialSchema = z.object({
  trade: tradeKey,
  label: z.string().trim().min(2).max(160),
  reference: z.string().trim().max(80).optional().or(z.literal("")),
  issuedAt: z.coerce.date().optional().nullable(),
  expiresAt: z.coerce.date().optional().nullable(),
});

export type ProfessionalCreateInput = z.infer<typeof professionalCreateSchema>;
export type ProfessionalUpdateInput = z.infer<typeof professionalUpdateSchema>;
export type VerificationInput = z.infer<typeof verificationSchema>;
export type CredentialInput = z.infer<typeof credentialSchema>;
