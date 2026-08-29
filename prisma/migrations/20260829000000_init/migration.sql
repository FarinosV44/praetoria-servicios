warn The configuration property `package.json#prisma` is deprecated and will be removed in Prisma 7. Please migrate to a Prisma config file (e.g., `prisma.config.ts`).
For more information, see: https://pris.ly/prisma-config

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "RequestStatus" AS ENUM ('BORRADOR', 'PENDIENTE_ANALISIS', 'REQUIERE_INFORMACION', 'VALIDADA_CLIENTE', 'EN_REVISION', 'PRESUPUESTO_PREPARADO', 'PRESUPUESTO_ENVIADO', 'ACEPTADA', 'RECHAZADA', 'CANCELADA', 'CERRADA');

-- CreateEnum
CREATE TYPE "Urgency" AS ENUM ('BAJA', 'MEDIA', 'ALTA', 'EMERGENCIA');

-- CreateEnum
CREATE TYPE "ContactChannel" AS ENUM ('WHATSAPP', 'EMAIL');

-- CreateEnum
CREATE TYPE "AnalysisOutcome" AS ENUM ('OK', 'NEEDS_MORE_INFO', 'PROVIDER_ERROR');

-- CreateEnum
CREATE TYPE "QuoteStatus" AS ENUM ('BORRADOR', 'ENVIADO', 'ACEPTADO', 'RECHAZADO', 'CADUCADO');

-- CreateEnum
CREATE TYPE "CommChannel" AS ENUM ('EMAIL', 'WHATSAPP');

-- CreateEnum
CREATE TYPE "CommKind" AS ENUM ('CONFIRMATION', 'INFO_REQUEST', 'QUOTE_AVAILABLE', 'GENERIC');

-- CreateEnum
CREATE TYPE "CommStatus" AS ENUM ('PENDING', 'SENT', 'FAILED', 'LINK_PREPARED');

-- CreateEnum
CREATE TYPE "ConsentType" AS ENUM ('REQUEST_HANDLING', 'OPERATIONAL_COMMS', 'MARKETING', 'INSURANCE_DOC_ANALYSIS', 'ANALYTICS');

-- CreateEnum
CREATE TYPE "ActorType" AS ENUM ('CLIENT', 'ADMIN', 'SYSTEM');

-- CreateEnum
CREATE TYPE "InsuranceExtractionStatus" AS ENUM ('PENDING', 'PARTIAL', 'DONE', 'UNREADABLE');

-- CreateEnum
CREATE TYPE "CoverageVerdict" AS ENUM ('COBERTURA_PROBABLE', 'EXCLUSION_PROBABLE', 'DUDOSA', 'INFORMACION_INSUFICIENTE');

-- CreateEnum
CREATE TYPE "DraftReviewStatus" AS ENUM ('BORRADOR_PENDIENTE_REVISION', 'REVISADO_PRAETORIA');

-- CreateEnum
CREATE TYPE "AdminRole" AS ENUM ('OPERATOR', 'ADMIN');

-- CreateTable
CREATE TABLE "Request" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "status" "RequestStatus" NOT NULL DEFAULT 'BORRADOR',
    "trade" TEXT,
    "clientChoseUnsure" BOOLEAN NOT NULL DEFAULT false,
    "urgency" "Urgency",
    "problemText" TEXT,
    "municipality" TEXT,
    "postalCode" TEXT,
    "withinCoverage" BOOLEAN,
    "submittedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Request_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contact" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "preferredChannel" "ContactChannel" NOT NULL,
    "availabilityNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Contact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RequestLocation" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "municipality" TEXT NOT NULL,
    "postalCode" TEXT NOT NULL,
    "approxNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RequestLocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Photo" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "byteSize" INTEGER NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "position" INTEGER NOT NULL DEFAULT 0,
    "hint" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Photo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnalysisVersion" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "outcome" "AnalysisOutcome" NOT NULL,
    "promptVersion" TEXT NOT NULL,
    "result" JSONB NOT NULL,
    "confidence" INTEGER,
    "requiresOnSiteInspection" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnalysisVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClientCorrection" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "wrongSections" TEXT[],
    "clarification" TEXT,
    "addedPhotoIds" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClientCorrection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Quote" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "status" "QuoteStatus" NOT NULL DEFAULT 'BORRADOR',
    "workDescription" TEXT NOT NULL,
    "subtotalCents" INTEGER NOT NULL,
    "taxRateBps" INTEGER NOT NULL DEFAULT 2100,
    "taxCents" INTEGER NOT NULL,
    "totalCents" INTEGER NOT NULL,
    "extrasNote" TEXT,
    "exclusionsNote" TEXT,
    "professionalRef" TEXT,
    "estimatedTimeframe" TEXT,
    "validUntil" TIMESTAMP(3),
    "observations" TEXT,
    "attachmentKey" TEXT,
    "sentAt" TIMESTAMP(3),
    "acceptedAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Quote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Communication" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "channel" "CommChannel" NOT NULL,
    "kind" "CommKind" NOT NULL,
    "status" "CommStatus" NOT NULL DEFAULT 'PENDING',
    "subject" TEXT,
    "bodyPreview" TEXT,
    "providerId" TEXT,
    "error" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Communication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Consent" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "type" "ConsentType" NOT NULL,
    "granted" BOOLEAN NOT NULL,
    "textVersion" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Consent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StatusEvent" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "from" "RequestStatus",
    "to" "RequestStatus" NOT NULL,
    "actorType" "ActorType" NOT NULL,
    "actorId" TEXT,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StatusEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InsuranceCase" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "consentGiven" BOOLEAN NOT NULL DEFAULT false,
    "extractionStatus" "InsuranceExtractionStatus" NOT NULL DEFAULT 'PENDING',
    "insurerName" TEXT,
    "policyNumber" TEXT,
    "validFrom" TIMESTAMP(3),
    "validTo" TIMESTAMP(3),
    "extraction" JSONB,
    "missingDocsNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InsuranceCase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InsuranceDocument" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "byteSize" INTEGER NOT NULL,
    "kind" TEXT,
    "ocrUsed" BOOLEAN NOT NULL DEFAULT false,
    "pageCount" INTEGER,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InsuranceDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CoverageAnalysis" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "verdict" "CoverageVerdict" NOT NULL,
    "result" JSONB NOT NULL,
    "confidence" INTEGER,
    "draftText" TEXT,
    "draftStatus" "DraftReviewStatus" NOT NULL DEFAULT 'BORRADOR_PENDIENTE_REVISION',
    "reviewedByAdminId" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CoverageAnalysis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CoverageDraftRevision" (
    "id" TEXT NOT NULL,
    "coverageId" TEXT NOT NULL,
    "adminId" TEXT,
    "note" TEXT,
    "draftText" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CoverageDraftRevision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminUser" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "AdminRole" NOT NULL DEFAULT 'OPERATOR',
    "disabledAt" TIMESTAMP(3),
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminActionLog" (
    "id" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "requestId" TEXT,
    "action" TEXT NOT NULL,
    "detail" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminActionLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClientLink" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "lastUsedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClientLink_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Request_reference_key" ON "Request"("reference");

-- CreateIndex
CREATE INDEX "Request_status_idx" ON "Request"("status");

-- CreateIndex
CREATE INDEX "Request_trade_idx" ON "Request"("trade");

-- CreateIndex
CREATE INDEX "Request_municipality_idx" ON "Request"("municipality");

-- CreateIndex
CREATE INDEX "Request_createdAt_idx" ON "Request"("createdAt");

-- CreateIndex
CREATE INDEX "Request_submittedAt_idx" ON "Request"("submittedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Contact_requestId_key" ON "Contact"("requestId");

-- CreateIndex
CREATE UNIQUE INDEX "RequestLocation_requestId_key" ON "RequestLocation"("requestId");

-- CreateIndex
CREATE INDEX "Photo_requestId_position_idx" ON "Photo"("requestId", "position");

-- CreateIndex
CREATE INDEX "AnalysisVersion_requestId_isActive_idx" ON "AnalysisVersion"("requestId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "AnalysisVersion_requestId_version_key" ON "AnalysisVersion"("requestId", "version");

-- CreateIndex
CREATE INDEX "ClientCorrection_requestId_idx" ON "ClientCorrection"("requestId");

-- CreateIndex
CREATE INDEX "Quote_requestId_status_idx" ON "Quote"("requestId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Quote_requestId_version_key" ON "Quote"("requestId", "version");

-- CreateIndex
CREATE INDEX "Communication_requestId_status_idx" ON "Communication"("requestId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Consent_requestId_type_key" ON "Consent"("requestId", "type");

-- CreateIndex
CREATE INDEX "StatusEvent_requestId_createdAt_idx" ON "StatusEvent"("requestId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "InsuranceCase_requestId_key" ON "InsuranceCase"("requestId");

-- CreateIndex
CREATE INDEX "InsuranceDocument_caseId_idx" ON "InsuranceDocument"("caseId");

-- CreateIndex
CREATE UNIQUE INDEX "CoverageAnalysis_caseId_key" ON "CoverageAnalysis"("caseId");

-- CreateIndex
CREATE INDEX "CoverageDraftRevision_coverageId_createdAt_idx" ON "CoverageDraftRevision"("coverageId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "AdminUser_email_key" ON "AdminUser"("email");

-- CreateIndex
CREATE INDEX "AdminActionLog_requestId_createdAt_idx" ON "AdminActionLog"("requestId", "createdAt");

-- CreateIndex
CREATE INDEX "AdminActionLog_adminId_createdAt_idx" ON "AdminActionLog"("adminId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ClientLink_tokenHash_key" ON "ClientLink"("tokenHash");

-- CreateIndex
CREATE INDEX "ClientLink_requestId_idx" ON "ClientLink"("requestId");

-- AddForeignKey
ALTER TABLE "Contact" ADD CONSTRAINT "Contact_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "Request"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequestLocation" ADD CONSTRAINT "RequestLocation_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "Request"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Photo" ADD CONSTRAINT "Photo_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "Request"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnalysisVersion" ADD CONSTRAINT "AnalysisVersion_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "Request"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientCorrection" ADD CONSTRAINT "ClientCorrection_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "Request"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "Request"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Communication" ADD CONSTRAINT "Communication_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "Request"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Consent" ADD CONSTRAINT "Consent_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "Request"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StatusEvent" ADD CONSTRAINT "StatusEvent_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "Request"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InsuranceCase" ADD CONSTRAINT "InsuranceCase_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "Request"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InsuranceDocument" ADD CONSTRAINT "InsuranceDocument_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "InsuranceCase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoverageAnalysis" ADD CONSTRAINT "CoverageAnalysis_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "InsuranceCase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoverageDraftRevision" ADD CONSTRAINT "CoverageDraftRevision_coverageId_fkey" FOREIGN KEY ("coverageId") REFERENCES "CoverageAnalysis"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdminActionLog" ADD CONSTRAINT "AdminActionLog_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "AdminUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
┌─────────────────────────────────────────────────────────┐
│  Update available 6.19.3 -> 8.0.0-rc.12                 │
│                                                         │
│  This is a major update - please follow the guide at    │
│  https://pris.ly/d/major-version-upgrade                │
│                                                         │
│  Run the following to update                            │
│    npm i --save-dev prisma@latest                       │
│    npm i @prisma/client@latest                          │
└─────────────────────────────────────────────────────────┘

