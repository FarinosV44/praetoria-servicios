-- AlterTable
ALTER TABLE "Request" ADD COLUMN     "entryPath" TEXT,
ADD COLUMN     "entryReferrerHost" TEXT;

-- CreateTable
CREATE TABLE "SeoMetricImport" (
    "id" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "note" TEXT,
    "rowCount" INTEGER NOT NULL DEFAULT 0,
    "skippedCount" INTEGER NOT NULL DEFAULT 0,
    "createdByAdminId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SeoMetricImport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SeoMetricRow" (
    "id" TEXT NOT NULL,
    "importId" TEXT NOT NULL,
    "query" TEXT NOT NULL,
    "page" TEXT,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "ctr" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "position" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "device" TEXT,
    "municipality" TEXT,

    CONSTRAINT "SeoMetricRow_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SeoMetricRow_importId_idx" ON "SeoMetricRow"("importId");

-- CreateIndex
CREATE INDEX "SeoMetricRow_page_idx" ON "SeoMetricRow"("page");

-- AddForeignKey
ALTER TABLE "SeoMetricRow" ADD CONSTRAINT "SeoMetricRow_importId_fkey" FOREIGN KEY ("importId") REFERENCES "SeoMetricImport"("id") ON DELETE CASCADE ON UPDATE CASCADE;
