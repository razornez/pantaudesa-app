CREATE TABLE "village_component_catalog" (
  "id" TEXT NOT NULL,
  "componentKey" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "description" TEXT,
  "componentType" TEXT NOT NULL DEFAULT 'section',
  "status" TEXT NOT NULL DEFAULT 'ACTIVE',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "village_component_catalog_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "village_component_catalog_fields" (
  "id" TEXT NOT NULL,
  "catalogComponentId" TEXT NOT NULL,
  "fieldKey" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "valueType" TEXT NOT NULL,
  "sourcePolicyJson" JSONB,
  "validationRules" JSONB,
  "isRequired" BOOLEAN NOT NULL DEFAULT false,
  "isPublicVisible" BOOLEAN NOT NULL DEFAULT true,
  "isPublishableNow" BOOLEAN NOT NULL DEFAULT false,
  "displayOrder" INTEGER NOT NULL DEFAULT 0,
  "status" TEXT NOT NULL DEFAULT 'ACTIVE',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "village_component_catalog_fields_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "village_detail_components"
  ADD COLUMN "catalogComponentId" TEXT;

ALTER TABLE "detail_field_standards"
  ADD COLUMN "catalogFieldId" TEXT;

CREATE UNIQUE INDEX "village_component_catalog_componentKey_key"
  ON "village_component_catalog"("componentKey");

CREATE UNIQUE INDEX "village_component_catalog_fields_catalogComponentId_fieldKey_key"
  ON "village_component_catalog_fields"("catalogComponentId", "fieldKey");

ALTER TABLE "village_component_catalog_fields"
  ADD CONSTRAINT "village_component_catalog_fields_catalogComponentId_fkey"
  FOREIGN KEY ("catalogComponentId") REFERENCES "village_component_catalog"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "village_detail_components"
  ADD CONSTRAINT "village_detail_components_catalogComponentId_fkey"
  FOREIGN KEY ("catalogComponentId") REFERENCES "village_component_catalog"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "detail_field_standards"
  ADD CONSTRAINT "detail_field_standards_catalogFieldId_fkey"
  FOREIGN KEY ("catalogFieldId") REFERENCES "village_component_catalog_fields"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
