-- CreateEnum
CREATE TYPE "LocalPageStatus" AS ENUM ('BORRADOR', 'PUBLICADO', 'ARCHIVADO');

-- CreateTable
CREATE TABLE "LocalPage" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "municipality" TEXT NOT NULL,
    "serviceKey" TEXT,
    "intro" TEXT,
    "coverageNote" TEXT NOT NULL DEFAULT '',
    "typicalServices" TEXT[],
    "responseTimeNote" TEXT,
    "localFaq" JSONB NOT NULL DEFAULT '[]',
    "completedJobsNote" TEXT,
    "casePhotoNote" TEXT,
    "status" "LocalPageStatus" NOT NULL DEFAULT 'BORRADOR',
    "noindex" BOOLEAN NOT NULL DEFAULT false,
    "metaTitle" TEXT,
    "metaDescription" TEXT,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LocalPage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LocalPage_slug_key" ON "LocalPage"("slug");

-- CreateIndex
CREATE INDEX "LocalPage_status_idx" ON "LocalPage"("status");
