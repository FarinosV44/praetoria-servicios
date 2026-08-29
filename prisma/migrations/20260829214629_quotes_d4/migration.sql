/*
  Warnings:

  - You are about to drop the column `extrasNote` on the `Quote` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "QuoteLineKind" AS ENUM ('VISITA', 'DESPLAZAMIENTO', 'MANO_OBRA', 'MATERIALES', 'PREPARACION', 'RETIRADA_LIMPIEZA', 'OTRO');

-- AlterTable
ALTER TABLE "Quote" DROP COLUMN "extrasNote",
ADD COLUMN     "assumptions" TEXT[],
ADD COLUMN     "decisionEvidence" JSONB,
ADD COLUMN     "durationEstimate" TEXT,
ADD COLUMN     "extrasApprovalNote" TEXT,
ADD COLUMN     "isEstimate" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "maxTotalCents" INTEGER,
ADD COLUMN     "preparatoryNote" TEXT,
ADD COLUMN     "scheduledFor" TIMESTAMP(3),
ADD COLUMN     "verificationScope" TEXT,
ADD COLUMN     "visitFeeCents" INTEGER,
ADD COLUMN     "visitFeeDiscounted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "warrantyResponsible" TEXT,
ADD COLUMN     "warrantyText" TEXT;

-- CreateTable
CREATE TABLE "QuoteLine" (
    "id" TEXT NOT NULL,
    "quoteId" TEXT NOT NULL,
    "kind" "QuoteLineKind" NOT NULL DEFAULT 'OTRO',
    "concept" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "included" BOOLEAN NOT NULL DEFAULT true,
    "position" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "QuoteLine_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "QuoteLine_quoteId_position_idx" ON "QuoteLine"("quoteId", "position");

-- AddForeignKey
ALTER TABLE "QuoteLine" ADD CONSTRAINT "QuoteLine_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote"("id") ON DELETE CASCADE ON UPDATE CASCADE;
