-- CreateEnum
CREATE TYPE "VillageDetailTemplateStatus" AS ENUM ('DRAFT', 'ACTIVE', 'DEPRECATED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "DataDesaStatus" AS ENUM ('DRAFT', 'IN_REVIEW', 'PUBLISHED', 'REJECTED', 'ARCHIVED');

-- AlterTable
ALTER TABLE "desa_data_audit_events" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "village_data_versions" ALTER COLUMN "changedFields" DROP DEFAULT,
ALTER COLUMN "updatedAt" DROP DEFAULT;

-- CreateTable
CREATE TABLE "village_detail_templates" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "status" "VillageDetailTemplateStatus" NOT NULL DEFAULT 'ACTIVE',
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "village_detail_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "village_detail_components" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "componentKey" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "componentType" TEXT NOT NULL DEFAULT 'section',
    "isDefaultVisible" BOOLEAN NOT NULL DEFAULT true,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "village_detail_components_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "detail_field_standards" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "componentId" TEXT NOT NULL,
    "fieldKey" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "valueType" TEXT NOT NULL,
    "validationRules" JSONB,
    "isRequired" BOOLEAN NOT NULL DEFAULT false,
    "isPublicVisible" BOOLEAN NOT NULL DEFAULT true,
    "isPublishableNow" BOOLEAN NOT NULL DEFAULT false,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "detail_field_standards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "desa_detail_template_assignments" (
    "id" TEXT NOT NULL,
    "desaId" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reason" TEXT,

    CONSTRAINT "desa_detail_template_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "desa_detail_component_visibility" (
    "id" TEXT NOT NULL,
    "desaId" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "componentId" TEXT NOT NULL,
    "isVisible" BOOLEAN NOT NULL,
    "reason" TEXT,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "desa_detail_component_visibility_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "data_desa" (
    "id" TEXT NOT NULL,
    "desaId" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "componentId" TEXT NOT NULL,
    "fieldStandardId" TEXT,
    "fieldKey" TEXT NOT NULL,
    "valueJson" JSONB,
    "valueText" TEXT,
    "sourceId" TEXT,
    "status" "DataDesaStatus" NOT NULL DEFAULT 'DRAFT',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "publishedAt" TIMESTAMP(3),
    "reviewedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "data_desa_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "village_detail_templates_key_key" ON "village_detail_templates"("key");

-- CreateIndex
CREATE UNIQUE INDEX "village_detail_components_templateId_componentKey_key" ON "village_detail_components"("templateId", "componentKey");

-- CreateIndex
CREATE UNIQUE INDEX "detail_field_standards_templateId_componentId_fieldKey_key" ON "detail_field_standards"("templateId", "componentId", "fieldKey");

-- CreateIndex
CREATE UNIQUE INDEX "desa_detail_template_assignments_desaId_key" ON "desa_detail_template_assignments"("desaId");

-- CreateIndex
CREATE UNIQUE INDEX "desa_detail_component_visibility_desaId_componentId_key" ON "desa_detail_component_visibility"("desaId", "componentId");

-- CreateIndex
CREATE INDEX "data_desa_desaId_fieldKey_status_idx" ON "data_desa"("desaId", "fieldKey", "status");

-- CreateIndex
CREATE INDEX "data_desa_desaId_componentId_idx" ON "data_desa"("desaId", "componentId");

-- AddForeignKey
ALTER TABLE "village_detail_components" ADD CONSTRAINT "village_detail_components_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "village_detail_templates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detail_field_standards" ADD CONSTRAINT "detail_field_standards_componentId_fkey" FOREIGN KEY ("componentId") REFERENCES "village_detail_components"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "desa_detail_template_assignments" ADD CONSTRAINT "desa_detail_template_assignments_desaId_fkey" FOREIGN KEY ("desaId") REFERENCES "desa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "desa_detail_template_assignments" ADD CONSTRAINT "desa_detail_template_assignments_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "village_detail_templates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "desa_detail_component_visibility" ADD CONSTRAINT "desa_detail_component_visibility_desaId_fkey" FOREIGN KEY ("desaId") REFERENCES "desa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "desa_detail_component_visibility" ADD CONSTRAINT "desa_detail_component_visibility_componentId_fkey" FOREIGN KEY ("componentId") REFERENCES "village_detail_components"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "data_desa" ADD CONSTRAINT "data_desa_desaId_fkey" FOREIGN KEY ("desaId") REFERENCES "desa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "data_desa" ADD CONSTRAINT "data_desa_componentId_fkey" FOREIGN KEY ("componentId") REFERENCES "village_detail_components"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
