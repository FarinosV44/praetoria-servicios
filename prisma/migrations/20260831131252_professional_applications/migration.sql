-- CreateEnum
CREATE TYPE "ProfessionalApplicationStatus" AS ENUM ('NUEVA', 'CONTACTADA', 'EN_VALIDACION', 'APROBADA', 'RECHAZADA');

-- CreateTable
CREATE TABLE "ProfessionalApplication" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isCompany" BOOLEAN NOT NULL DEFAULT false,
    "trades" TEXT[],
    "municipalities" TEXT[],
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "availabilityNote" TEXT,
    "experienceNote" TEXT,
    "observations" TEXT,
    "consentAt" TIMESTAMP(3) NOT NULL,
    "status" "ProfessionalApplicationStatus" NOT NULL DEFAULT 'NUEVA',
    "internalNotes" TEXT,
    "reviewReason" TEXT,
    "spamFlagged" BOOLEAN NOT NULL DEFAULT false,
    "fingerprint" TEXT NOT NULL,
    "professionalId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProfessionalApplication_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProfessionalApplication_status_idx" ON "ProfessionalApplication"("status");

-- CreateIndex
CREATE INDEX "ProfessionalApplication_fingerprint_idx" ON "ProfessionalApplication"("fingerprint");
