-- CreateEnum
CREATE TYPE "ProfessionalStatus" AS ENUM ('CANDIDATO', 'DOCUMENTACION_PENDIENTE', 'VERIFICANDO', 'APROBADO', 'SUSPENDIDO', 'RECHAZADO');

-- CreateEnum
CREATE TYPE "VerificationKind" AS ENUM ('IDENTITY', 'FISCAL', 'RC_INSURANCE', 'CREDENTIAL', 'REFERENCES', 'BANK_ACCOUNT', 'CONTACT');

-- AlterTable
ALTER TABLE "AdminActionLog" ADD COLUMN     "professionalId" TEXT;

-- CreateTable
CREATE TABLE "Professional" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "status" "ProfessionalStatus" NOT NULL DEFAULT 'CANDIDATO',
    "legalName" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "taxId" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "trades" TEXT[],
    "municipalities" TEXT[],
    "availabilityNote" TEXT,
    "experienceNote" TEXT,
    "referencesNote" TEXT,
    "rcInsurer" TEXT,
    "rcPolicyNumber" TEXT,
    "rcExpiresAt" TIMESTAMP(3),
    "bankIbanLast4" TEXT,
    "photoStorageKey" TEXT,
    "photoConsent" BOOLEAN NOT NULL DEFAULT false,
    "internalRating" INTEGER,
    "approvedAt" TIMESTAMP(3),
    "suspendedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Professional_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProfessionalCredential" (
    "id" TEXT NOT NULL,
    "professionalId" TEXT NOT NULL,
    "trade" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "reference" TEXT,
    "issuedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProfessionalCredential_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProfessionalVerification" (
    "id" TEXT NOT NULL,
    "professionalId" TEXT NOT NULL,
    "kind" "VerificationKind" NOT NULL,
    "checkedByAdminId" TEXT NOT NULL,
    "checkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "passed" BOOLEAN NOT NULL,
    "note" TEXT,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "ProfessionalVerification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProfessionalDocument" (
    "id" TEXT NOT NULL,
    "professionalId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "byteSize" INTEGER NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProfessionalDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Assignment" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "professionalId" TEXT NOT NULL,
    "assignedByAdminId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "endedAt" TIMESTAMP(3),
    "endedReason" TEXT,

    CONSTRAINT "Assignment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Professional_reference_key" ON "Professional"("reference");

-- CreateIndex
CREATE INDEX "Professional_status_idx" ON "Professional"("status");

-- CreateIndex
CREATE INDEX "ProfessionalCredential_professionalId_idx" ON "ProfessionalCredential"("professionalId");

-- CreateIndex
CREATE INDEX "ProfessionalCredential_expiresAt_idx" ON "ProfessionalCredential"("expiresAt");

-- CreateIndex
CREATE INDEX "ProfessionalVerification_professionalId_checkedAt_idx" ON "ProfessionalVerification"("professionalId", "checkedAt");

-- CreateIndex
CREATE INDEX "ProfessionalVerification_expiresAt_idx" ON "ProfessionalVerification"("expiresAt");

-- CreateIndex
CREATE INDEX "ProfessionalDocument_professionalId_idx" ON "ProfessionalDocument"("professionalId");

-- CreateIndex
CREATE INDEX "ProfessionalDocument_expiresAt_idx" ON "ProfessionalDocument"("expiresAt");

-- CreateIndex
CREATE INDEX "Assignment_requestId_active_idx" ON "Assignment"("requestId", "active");

-- CreateIndex
CREATE INDEX "Assignment_professionalId_idx" ON "Assignment"("professionalId");

-- CreateIndex
CREATE INDEX "AdminActionLog_professionalId_createdAt_idx" ON "AdminActionLog"("professionalId", "createdAt");

-- AddForeignKey
ALTER TABLE "ProfessionalCredential" ADD CONSTRAINT "ProfessionalCredential_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "Professional"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfessionalVerification" ADD CONSTRAINT "ProfessionalVerification_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "Professional"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfessionalDocument" ADD CONSTRAINT "ProfessionalDocument_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "Professional"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "Request"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "Professional"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
