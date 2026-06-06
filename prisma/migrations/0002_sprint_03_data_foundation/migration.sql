-- CreateEnum
CREATE TYPE "DataStatus" AS ENUM ('demo', 'imported', 'needs_review', 'verified', 'outdated', 'rejected');

-- CreateEnum
CREATE TYPE "SourceType" AS ENUM ('demo', 'manual', 'official_website', 'official_document', 'kecamatan_page', 'article_page', 'archive_page', 'other');

-- CreateEnum
CREATE TYPE "ScopeType" AS ENUM ('desa', 'kecamatan', 'kabupaten', 'provinsi', 'national', 'other');

-- CreateEnum
CREATE TYPE "AccessStatus" AS ENUM ('accessible', 'unreachable', 'broken', 'unknown', 'requires_review');

-- CreateEnum
CREATE TYPE "DataAvailability" AS ENUM ('none', 'profile_only', 'documents_only', 'budget_summary', 'budget_detail', 'mixed', 'unknown');

-- CreateEnum
CREATE TYPE "StatusSerapan" AS ENUM ('baik', 'sedang', 'rendah', 'unknown');

-- CreateEnum
CREATE TYPE "DocumentStatus" AS ENUM ('tersedia', 'belum', 'unknown', 'needs_review');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('apbdes', 'realisasi', 'rkpdes', 'rpjmdes', 'perdes', 'lppd', 'profile', 'other');

-- CreateTable
CREATE TABLE "desa" (
    "id" TEXT NOT NULL,
    "kodeDesa" TEXT,
    "nama" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "kecamatan" TEXT NOT NULL,
    "kabupaten" TEXT NOT NULL,
    "provinsi" TEXT NOT NULL,
    "tahunData" INTEGER,
    "jumlahPenduduk" INTEGER,
    "kategori" TEXT,
    "websiteUrl" TEXT,
    "dataStatus" "DataStatus" NOT NULL DEFAULT 'demo',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "desa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "data_sources" (
    "id" TEXT NOT NULL,
    "desaId" TEXT,
    "scopeType" "ScopeType" NOT NULL,
    "scopeName" TEXT NOT NULL,
    "sourceName" TEXT NOT NULL,
    "sourceUrl" TEXT,
    "sourceType" "SourceType" NOT NULL,
    "accessStatus" "AccessStatus" NOT NULL DEFAULT 'unknown',
    "dataAvailability" "DataAvailability" NOT NULL DEFAULT 'unknown',
    "lastCheckedAt" TIMESTAMP(3),
    "notes" TEXT,
    "dataStatus" "DataStatus" NOT NULL DEFAULT 'needs_review',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "data_sources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "anggaran_desa_summaries" (
    "id" TEXT NOT NULL,
    "desaId" TEXT NOT NULL,
    "tahun" INTEGER NOT NULL,
    "totalAnggaran" BIGINT,
    "totalRealisasi" BIGINT,
    "persentaseRealisasi" DECIMAL(5,2),
    "statusSerapan" "StatusSerapan" NOT NULL DEFAULT 'unknown',
    "sourceId" TEXT,
    "dataStatus" "DataStatus" NOT NULL DEFAULT 'demo',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "anggaran_desa_summaries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "apbdes_items" (
    "id" TEXT NOT NULL,
    "desaId" TEXT NOT NULL,
    "tahun" INTEGER NOT NULL,
    "kodeBidang" TEXT,
    "namaBidang" TEXT NOT NULL,
    "anggaran" BIGINT,
    "realisasi" BIGINT,
    "persentase" DECIMAL(5,2),
    "sourceId" TEXT,
    "dataStatus" "DataStatus" NOT NULL DEFAULT 'demo',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "apbdes_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dokumen_publik" (
    "id" TEXT NOT NULL,
    "desaId" TEXT NOT NULL,
    "tahun" INTEGER,
    "namaDokumen" TEXT NOT NULL,
    "jenisDokumen" "DocumentType" NOT NULL DEFAULT 'other',
    "status" "DocumentStatus" NOT NULL DEFAULT 'unknown',
    "url" TEXT,
    "fileType" TEXT,
    "sourceId" TEXT,
    "publishedAt" TIMESTAMP(3),
    "lastCheckedAt" TIMESTAMP(3),
    "dataStatus" "DataStatus" NOT NULL DEFAULT 'demo',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dokumen_publik_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "desa_kodeDesa_key" ON "desa"("kodeDesa");

-- CreateIndex
CREATE UNIQUE INDEX "desa_slug_key" ON "desa"("slug");

-- CreateIndex
CREATE INDEX "desa_kecamatan_kabupaten_provinsi_idx" ON "desa"("kecamatan", "kabupaten", "provinsi");

-- CreateIndex
CREATE INDEX "desa_dataStatus_idx" ON "desa"("dataStatus");

-- CreateIndex
CREATE INDEX "data_sources_desaId_idx" ON "data_sources"("desaId");

-- CreateIndex
CREATE INDEX "data_sources_scopeType_scopeName_idx" ON "data_sources"("scopeType", "scopeName");

-- CreateIndex
CREATE INDEX "data_sources_sourceType_idx" ON "data_sources"("sourceType");

-- CreateIndex
CREATE INDEX "data_sources_accessStatus_idx" ON "data_sources"("accessStatus");

-- CreateIndex
CREATE INDEX "data_sources_dataStatus_idx" ON "data_sources"("dataStatus");

-- CreateIndex
CREATE INDEX "anggaran_desa_summaries_tahun_idx" ON "anggaran_desa_summaries"("tahun");

-- CreateIndex
CREATE INDEX "anggaran_desa_summaries_sourceId_idx" ON "anggaran_desa_summaries"("sourceId");

-- CreateIndex
CREATE INDEX "anggaran_desa_summaries_dataStatus_idx" ON "anggaran_desa_summaries"("dataStatus");

-- CreateIndex
CREATE UNIQUE INDEX "anggaran_desa_summaries_desaId_tahun_key" ON "anggaran_desa_summaries"("desaId", "tahun");

-- CreateIndex
CREATE INDEX "apbdes_items_desaId_tahun_idx" ON "apbdes_items"("desaId", "tahun");

-- CreateIndex
CREATE INDEX "apbdes_items_sourceId_idx" ON "apbdes_items"("sourceId");

-- CreateIndex
CREATE INDEX "apbdes_items_dataStatus_idx" ON "apbdes_items"("dataStatus");

-- CreateIndex
CREATE INDEX "dokumen_publik_desaId_tahun_idx" ON "dokumen_publik"("desaId", "tahun");

-- CreateIndex
CREATE INDEX "dokumen_publik_jenisDokumen_idx" ON "dokumen_publik"("jenisDokumen");

-- CreateIndex
CREATE INDEX "dokumen_publik_status_idx" ON "dokumen_publik"("status");

-- CreateIndex
CREATE INDEX "dokumen_publik_sourceId_idx" ON "dokumen_publik"("sourceId");

-- CreateIndex
CREATE INDEX "dokumen_publik_dataStatus_idx" ON "dokumen_publik"("dataStatus");

-- AddForeignKey
ALTER TABLE "data_sources" ADD CONSTRAINT "data_sources_desaId_fkey" FOREIGN KEY ("desaId") REFERENCES "desa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "anggaran_desa_summaries" ADD CONSTRAINT "anggaran_desa_summaries_desaId_fkey" FOREIGN KEY ("desaId") REFERENCES "desa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "anggaran_desa_summaries" ADD CONSTRAINT "anggaran_desa_summaries_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "data_sources"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "apbdes_items" ADD CONSTRAINT "apbdes_items_desaId_fkey" FOREIGN KEY ("desaId") REFERENCES "desa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "apbdes_items" ADD CONSTRAINT "apbdes_items_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "data_sources"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dokumen_publik" ADD CONSTRAINT "dokumen_publik_desaId_fkey" FOREIGN KEY ("desaId") REFERENCES "desa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dokumen_publik" ADD CONSTRAINT "dokumen_publik_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "data_sources"("id") ON DELETE SET NULL ON UPDATE CASCADE;
