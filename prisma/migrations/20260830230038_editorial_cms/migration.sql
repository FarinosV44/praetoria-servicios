-- CreateEnum
CREATE TYPE "ArticleStatus" AS ENUM ('BORRADOR', 'REVISION', 'PROGRAMADO', 'PUBLICADO', 'ARCHIVADO');

-- CreateEnum
CREATE TYPE "ArticleKind" AS ENUM ('GUIA', 'ARTICULO', 'FAQ', 'SEGURIDAD', 'SEGUROS', 'CASO', 'PROBLEMA', 'OTRO');

-- CreateTable
CREATE TABLE "Article" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "excerpt" TEXT,
    "body" JSONB NOT NULL,
    "kind" "ArticleKind" NOT NULL DEFAULT 'ARTICULO',
    "status" "ArticleStatus" NOT NULL DEFAULT 'BORRADOR',
    "author" TEXT,
    "expertReviewer" TEXT,
    "reviewedByHuman" BOOLEAN NOT NULL DEFAULT false,
    "coverImageSrc" TEXT,
    "coverImageAlt" TEXT,
    "coverCaption" TEXT,
    "coverCredit" TEXT,
    "metaTitle" TEXT,
    "metaDescription" TEXT,
    "canonicalUrl" TEXT,
    "noindex" BOOLEAN NOT NULL DEFAULT false,
    "socialImage" TEXT,
    "targetKeywords" TEXT[],
    "sources" TEXT,
    "internalNotes" TEXT,
    "publishAt" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "nextReviewAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Article_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ArticleRevision" (
    "id" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,
    "editedByAdminId" TEXT,
    "snapshot" JSONB NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ArticleRevision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SlugRedirect" (
    "id" TEXT NOT NULL,
    "fromSlug" TEXT NOT NULL,
    "toSlug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SlugRedirect_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Article_slug_key" ON "Article"("slug");

-- CreateIndex
CREATE INDEX "Article_status_idx" ON "Article"("status");

-- CreateIndex
CREATE INDEX "Article_publishAt_idx" ON "Article"("publishAt");

-- CreateIndex
CREATE INDEX "Article_kind_idx" ON "Article"("kind");

-- CreateIndex
CREATE INDEX "ArticleRevision_articleId_createdAt_idx" ON "ArticleRevision"("articleId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "SlugRedirect_fromSlug_key" ON "SlugRedirect"("fromSlug");

-- AddForeignKey
ALTER TABLE "ArticleRevision" ADD CONSTRAINT "ArticleRevision_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE CASCADE ON UPDATE CASCADE;
