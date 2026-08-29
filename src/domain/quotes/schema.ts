import { z } from "zod";

/** Shared quote validation (issue #12, benchmark D4). Amounts are euro strings from the form. */

export const quoteLineSchema = z.object({
  kind: z
    .enum([
      "VISITA",
      "DESPLAZAMIENTO",
      "MANO_OBRA",
      "MATERIALES",
      "PREPARACION",
      "RETIRADA_LIMPIEZA",
      "OTRO",
    ])
    .default("OTRO"),
  concept: z.string().trim().min(1).max(300),
  amount: z.string().trim(), // parsed with parseEuros
  included: z.boolean().default(true),
});

export const quoteDraftSchema = z.object({
  workDescription: z.string().trim().max(4000).optional().default(""),
  lines: z.array(quoteLineSchema).max(40).default([]),
  taxRateBps: z.coerce.number().int().min(0).max(10000).default(2100),
  isEstimate: z.boolean().default(false),
  maxTotal: z.string().trim().optional(),
  visitFee: z.string().trim().optional(),
  visitFeeDiscounted: z.boolean().default(false),
  exclusionsNote: z.string().trim().max(2000).optional(),
  assumptions: z.array(z.string().trim().max(400)).max(20).default([]),
  extrasApprovalNote: z.string().trim().max(2000).optional(),
  preparatoryNote: z.string().trim().max(2000).optional(),
  professionalRef: z.string().trim().max(200).optional(),
  verificationScope: z.string().trim().max(500).optional(),
  scheduledFor: z.string().trim().optional(), // ISO date/datetime
  durationEstimate: z.string().trim().max(200).optional(),
  warrantyText: z.string().trim().max(2000).optional(),
  warrantyResponsible: z.string().trim().max(200).optional(),
  estimatedTimeframe: z.string().trim().max(200).optional(),
  validUntil: z.string().trim().optional(),
  observations: z.string().trim().max(4000).optional(),
});

export type QuoteDraftInput = z.infer<typeof quoteDraftSchema>;
