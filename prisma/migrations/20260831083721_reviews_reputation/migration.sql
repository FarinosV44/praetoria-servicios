-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ReviewStatus" ADD VALUE 'RETENIDA_PII';
ALTER TYPE "ReviewStatus" ADD VALUE 'RETIRADA';

-- AlterTable
ALTER TABLE "Review" ADD COLUMN     "clarity" INTEGER,
ADD COLUMN     "cleanliness" INTEGER,
ADD COLUMN     "duplicateFlagged" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "incidenceId" TEXT,
ADD COLUMN     "moderatedAt" TIMESTAMP(3),
ADD COLUMN     "moderatedByAdminId" TEXT,
ADD COLUMN     "moderationReason" TEXT,
ADD COLUMN     "originalComment" TEXT,
ADD COLUMN     "piiFlagged" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "piiKinds" TEXT[],
ADD COLUMN     "praetoriaResponse" TEXT,
ADD COLUMN     "professionalId" TEXT,
ADD COLUMN     "publishedAt" TIMESTAMP(3),
ADD COLUMN     "punctuality" INTEGER,
ADD COLUMN     "respondedAt" TIMESTAMP(3),
ADD COLUMN     "respondedByAdminId" TEXT,
ADD COLUMN     "result" INTEGER,
ADD COLUMN     "spamFlagged" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "withdrawalReason" TEXT,
ADD COLUMN     "withdrawnAt" TIMESTAMP(3);
