-- CreateEnum
CREATE TYPE "WarrantyKind" AS ENUM ('LEGAL', 'COMERCIAL', 'CORTESIA');

-- CreateEnum
CREATE TYPE "IncidenceStatus" AS ENUM ('ABIERTA', 'EN_CLASIFICACION', 'EN_CURSO', 'RESUELTA', 'DESESTIMADA');

-- CreateEnum
CREATE TYPE "ReviewStatus" AS ENUM ('PENDIENTE', 'AUTORIZADA', 'RECHAZADA');

-- CreateTable
CREATE TABLE "ServiceCompletion" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL,
    "workDone" TEXT NOT NULL,
    "materialsNote" TEXT,
    "finalPhotosNote" TEXT,
    "executedByProfessionalId" TEXT,
    "acceptedQuoteVersion" INTEGER,
    "approvedExtrasNote" TEXT,
    "warrantyKind" "WarrantyKind",
    "warrantyText" TEXT,
    "warrantyExclusions" TEXT,
    "warrantyResponsible" TEXT,
    "clientConfirmedAt" TIMESTAMP(3),
    "recordedByAdminId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServiceCompletion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Incidence" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "status" "IncidenceStatus" NOT NULL DEFAULT 'ABIERTA',
    "openedBy" "ActorType" NOT NULL,
    "kind" TEXT,
    "description" TEXT NOT NULL,
    "assignedToAdminId" TEXT,
    "firstResponseDueAt" TIMESTAMP(3),
    "firstRespondedAt" TIMESTAMP(3),
    "resolutionNote" TEXT,
    "closedReason" TEXT,
    "evidenceNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Incidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IncidenceEvent" (
    "id" TEXT NOT NULL,
    "incidenceId" TEXT NOT NULL,
    "actorType" "ActorType" NOT NULL,
    "actorId" TEXT,
    "fromStatus" "IncidenceStatus",
    "toStatus" "IncidenceStatus",
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IncidenceEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "authorDisplayName" TEXT,
    "publishConsent" BOOLEAN NOT NULL DEFAULT false,
    "status" "ReviewStatus" NOT NULL DEFAULT 'PENDIENTE',
    "authorizedByAdminId" TEXT,
    "authorizedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ServiceCompletion_requestId_key" ON "ServiceCompletion"("requestId");

-- CreateIndex
CREATE UNIQUE INDEX "Incidence_reference_key" ON "Incidence"("reference");

-- CreateIndex
CREATE INDEX "Incidence_status_idx" ON "Incidence"("status");

-- CreateIndex
CREATE INDEX "Incidence_requestId_idx" ON "Incidence"("requestId");

-- CreateIndex
CREATE INDEX "Incidence_firstResponseDueAt_idx" ON "Incidence"("firstResponseDueAt");

-- CreateIndex
CREATE INDEX "IncidenceEvent_incidenceId_createdAt_idx" ON "IncidenceEvent"("incidenceId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Review_requestId_key" ON "Review"("requestId");

-- CreateIndex
CREATE INDEX "Review_status_idx" ON "Review"("status");

-- AddForeignKey
ALTER TABLE "ServiceCompletion" ADD CONSTRAINT "ServiceCompletion_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "Request"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Incidence" ADD CONSTRAINT "Incidence_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "Request"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IncidenceEvent" ADD CONSTRAINT "IncidenceEvent_incidenceId_fkey" FOREIGN KEY ("incidenceId") REFERENCES "Incidence"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "Request"("id") ON DELETE CASCADE ON UPDATE CASCADE;
