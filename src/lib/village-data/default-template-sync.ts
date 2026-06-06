import { Prisma } from "@/generated/prisma";
import { db } from "@/lib/db";
import {
  DEFAULT_COMPONENT_CATALOG_MANIFEST,
  type ComponentCatalogManifestEntry,
} from "@/lib/village-data/component-catalog-manifest";
import {
  DEFAULT_TEMPLATE_KEY,
  DEFAULT_TEMPLATE_NAME,
} from "@/lib/village-data/template-constants";

const DEFAULT_TEMPLATE_DESCRIPTION =
  "Template publik aktif yang menjadi source of truth runtime untuk desa detail, intake, dan pusat data desa.";

let syncPromise: Promise<void> | null = null;
let lastSyncAt = 0;
const SYNC_TTL_MS = 30_000;

function componentAnchorId(componentKey: string) {
  return componentKey.replaceAll("_", "-");
}

function catalogRuntimeMetadata(component: ComponentCatalogManifestEntry) {
  return {
    isDefaultVisible: component.isDefaultVisible,
    displayOrder: component.displayOrder,
    rendererType: component.rendererType,
    previewVariant: component.previewVariant,
    detailSlot: component.detailSlot,
    navLabel: component.navLabel ?? component.label,
    anchorId: component.anchorId ?? componentAnchorId(component.componentKey),
    publicGroupKey: component.publicGroupKey ?? component.detailSlot,
    publicTabKey: component.publicTabKey ?? component.componentKey,
    highlightFieldKeys: component.highlightFieldKeys
      ? (component.highlightFieldKeys as Prisma.InputJsonValue)
      : Prisma.JsonNull,
    renderConfigJson: component.renderConfig
      ? (component.renderConfig as Prisma.InputJsonValue)
      : Prisma.JsonNull,
  };
}

function canSynchronizeDefaultTemplate() {
  const runtimeDb = db as unknown as Record<string, unknown> | null;
  if (!runtimeDb) return false;

  return (
    "villageDetailTemplate" in runtimeDb &&
    "villageDetailComponent" in runtimeDb &&
    "detailFieldStandard" in runtimeDb
  );
}

async function supportsCatalogRelations() {
  if (!db) return false;
  try {
    await db.$queryRawUnsafe("SELECT 1 FROM village_component_catalog LIMIT 1");
    return true;
  } catch {
    return false;
  }
}

async function ensureDefaultTemplateRecord() {
  if (!db) return null;
  return db.villageDetailTemplate.upsert({
    where: { key: DEFAULT_TEMPLATE_KEY },
    create: {
      key: DEFAULT_TEMPLATE_KEY,
      name: DEFAULT_TEMPLATE_NAME,
      description: DEFAULT_TEMPLATE_DESCRIPTION,
      isDefault: true,
      status: "ACTIVE",
    },
    update: {
      name: DEFAULT_TEMPLATE_NAME,
      description: DEFAULT_TEMPLATE_DESCRIPTION,
      isDefault: true,
      status: "ACTIVE",
    },
    select: { id: true, key: true, name: true },
  });
}

async function syncCatalogComponent(
  component: ComponentCatalogManifestEntry,
  withCatalogTables: boolean,
) {
  if (!db || !withCatalogTables) return null;
  const runtimeMetadata = catalogRuntimeMetadata(component);

  const catalogComponent = await db.villageComponentCatalog.upsert({
    where: { componentKey: component.componentKey },
    create: {
      componentKey: component.componentKey,
      label: component.label,
      description: component.description,
      componentType: component.componentType,
      ...runtimeMetadata,
      status: "ACTIVE",
    },
    update: {
      label: component.label,
      description: component.description,
      componentType: component.componentType,
      ...runtimeMetadata,
      status: "ACTIVE",
    },
    select: { id: true },
  });

  for (const field of component.fields) {
    await db.villageComponentCatalogField.upsert({
      where: {
        catalogComponentId_fieldKey: {
          catalogComponentId: catalogComponent.id,
          fieldKey: field.fieldKey,
        },
      },
      create: {
        catalogComponentId: catalogComponent.id,
        fieldKey: field.fieldKey,
        label: field.label,
        valueType: field.valueType,
        isPublishableNow: field.isPublishableNow,
        isPublicVisible: true,
        isRequired: false,
        displayOrder: field.displayOrder,
        status: "ACTIVE",
      },
      update: {
        label: field.label,
        valueType: field.valueType,
        isPublishableNow: field.isPublishableNow,
        isPublicVisible: true,
        isRequired: false,
        displayOrder: field.displayOrder,
        status: "ACTIVE",
      },
    });
  }

  return catalogComponent.id;
}

async function migratePerangkatFieldsToDedicatedComponent(input: {
  templateId: string;
  sourceComponentIds: string[];
  perangkatComponentId: string | null;
  perangkatFieldIdMap: Map<string, string>;
}) {
  if (!db || !input.perangkatComponentId) return;

  const migratedFieldKeys = ["kepalaDesa", "perangkatDesa"] as const;
  const sourceComponentIds = [...new Set(input.sourceComponentIds)].filter(
    (componentId) => componentId && componentId !== input.perangkatComponentId,
  );
  if (sourceComponentIds.length === 0) return;

  const sourceRows = await db.dataDesa.findMany({
    where: {
      templateId: input.templateId,
      componentId: { in: sourceComponentIds },
      fieldKey: { in: [...migratedFieldKeys] },
    },
    select: {
      id: true,
      desaId: true,
      fieldKey: true,
    },
  });

  for (const row of sourceRows) {
    const targetFieldStandardId = input.perangkatFieldIdMap.get(row.fieldKey) ?? null;
    const existingTargetRow = await db.dataDesa.findFirst({
      where: {
        templateId: input.templateId,
        componentId: input.perangkatComponentId,
        desaId: row.desaId,
        fieldKey: row.fieldKey,
        isActive: true,
        NOT: { id: row.id },
      },
      select: { id: true },
    });

    if (existingTargetRow) {
      await db.dataDesa.updateMany({
        where: { id: row.id },
        data: {
          status: "ARCHIVED",
          isActive: false,
          reviewNote:
            "Archived during template sync after perangkat fields moved into the dedicated perangkat component.",
        },
      });
      continue;
    }

    await db.dataDesa.updateMany({
      where: { id: row.id },
      data: {
        componentId: input.perangkatComponentId,
        fieldStandardId: targetFieldStandardId,
      },
    });
  }
}

async function synchronizeDefaultTemplateInternal() {
  if (!db) return;

  const template = await ensureDefaultTemplateRecord();
  if (!template) return;

  const withCatalogTables = await supportsCatalogRelations();
  const existingComponents = await db.villageDetailComponent.findMany({
    where: { templateId: template.id },
    select: {
      id: true,
      componentKey: true,
      fieldStandards: {
        select: { id: true, fieldKey: true },
      },
    },
  });

  const existingByKey = new Map(
    existingComponents.map((component) => [component.componentKey, component]),
  );
  const nextKeys = new Set(
    DEFAULT_COMPONENT_CATALOG_MANIFEST.map((component) => component.componentKey),
  );
  const placementIdByKey = new Map<string, string>();
  const fieldStandardIdByComponentKey = new Map<string, Map<string, string>>();

  for (const [index, component] of DEFAULT_COMPONENT_CATALOG_MANIFEST.entries()) {
    const catalogComponentId = await syncCatalogComponent(component, withCatalogTables);
    const placement = await db.villageDetailComponent.upsert({
      where: {
        templateId_componentKey: {
          templateId: template.id,
          componentKey: component.componentKey,
        },
      },
      create: {
        templateId: template.id,
        componentKey: component.componentKey,
        label: component.label,
        description: component.description,
        componentType: component.componentType,
        isDefaultVisible: component.isDefaultVisible,
        displayOrder: index + 1,
        status: "ACTIVE",
        ...(catalogComponentId ? { catalogComponentId } : {}),
      },
      update: {
        label: component.label,
        description: component.description,
        componentType: component.componentType,
        isDefaultVisible: component.isDefaultVisible,
        displayOrder: index + 1,
        status: "ACTIVE",
        ...(catalogComponentId ? { catalogComponentId } : {}),
      },
      select: { id: true },
    });
    placementIdByKey.set(component.componentKey, placement.id);

    const previous = existingByKey.get(component.componentKey);
    const nextFieldKeys = new Set(component.fields.map((field) => field.fieldKey));

    for (const staleField of previous?.fieldStandards ?? []) {
      if (nextFieldKeys.has(staleField.fieldKey)) continue;
      await db.detailFieldStandard.updateMany({
        where: { id: staleField.id },
        data: { status: "ARCHIVED" },
      });
    }

    const catalogFieldRows =
      withCatalogTables && catalogComponentId
        ? await db.villageComponentCatalogField.findMany({
            where: { catalogComponentId, status: "ACTIVE" },
            select: { id: true, fieldKey: true },
          })
        : [];
    const catalogFieldIdMap = new Map(
      catalogFieldRows.map((field) => [field.fieldKey, field.id]),
    );

    for (const field of component.fields) {
      const fieldStandard = await db.detailFieldStandard.upsert({
        where: {
          templateId_componentId_fieldKey: {
            templateId: template.id,
            componentId: placement.id,
            fieldKey: field.fieldKey,
          },
        },
        create: {
          templateId: template.id,
          componentId: placement.id,
          fieldKey: field.fieldKey,
          label: field.label,
          valueType: field.valueType,
          sourcePolicyJson: Prisma.JsonNull,
          validationRules: Prisma.JsonNull,
          isRequired: false,
          isPublicVisible: true,
          isPublishableNow: field.isPublishableNow,
          displayOrder: field.displayOrder,
          status: "ACTIVE",
          ...(catalogFieldIdMap.has(field.fieldKey)
            ? { catalogFieldId: catalogFieldIdMap.get(field.fieldKey) }
            : {}),
        },
        update: {
          label: field.label,
          valueType: field.valueType,
          sourcePolicyJson: Prisma.JsonNull,
          validationRules: Prisma.JsonNull,
          isRequired: false,
          isPublicVisible: true,
          isPublishableNow: field.isPublishableNow,
          displayOrder: field.displayOrder,
          status: "ACTIVE",
          ...(catalogFieldIdMap.has(field.fieldKey)
            ? { catalogFieldId: catalogFieldIdMap.get(field.fieldKey) }
            : {}),
        },
        select: {
          id: true,
        },
      });

      const fieldMap = fieldStandardIdByComponentKey.get(component.componentKey) ?? new Map();
      fieldMap.set(field.fieldKey, fieldStandard.id);
      fieldStandardIdByComponentKey.set(component.componentKey, fieldMap);
    }
  }

  await migratePerangkatFieldsToDedicatedComponent({
    templateId: template.id,
    sourceComponentIds: [existingByKey.get("profil_desa")?.id ?? ""],
    perangkatComponentId: placementIdByKey.get("perangkat") ?? null,
    perangkatFieldIdMap: fieldStandardIdByComponentKey.get("perangkat") ?? new Map(),
  });

  for (const component of existingComponents) {
    if (nextKeys.has(component.componentKey as ComponentCatalogManifestEntry["componentKey"])) {
      continue;
    }
    await db.villageDetailComponent.updateMany({
      where: { id: component.id },
      data: { status: "ARCHIVED" },
    });
    await db.detailFieldStandard.updateMany({
      where: { componentId: component.id },
      data: { status: "ARCHIVED" },
    });
  }
}

export async function ensureDefaultTemplateSynchronized() {
  if (!db || !canSynchronizeDefaultTemplate()) return;
  if (Date.now() - lastSyncAt < SYNC_TTL_MS) return;
  if (syncPromise) return syncPromise;

  syncPromise = synchronizeDefaultTemplateInternal()
    .then(() => {
      lastSyncAt = Date.now();
    })
    .finally(() => {
      syncPromise = null;
    });

  return syncPromise;
}
