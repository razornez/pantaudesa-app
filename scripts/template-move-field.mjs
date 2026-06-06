import { createPrismaClient } from "./template-ops-utils.mjs";

const [fieldKey, targetComponentKey] = process.argv.slice(2);

if (!fieldKey || !targetComponentKey) {
  console.error("Usage: npm run template:move-field -- <fieldKey> <targetComponentKey>");
  process.exit(1);
}

const db = createPrismaClient();

async function getActiveCatalogField(componentId, key) {
  return db.villageComponentCatalogField.findFirst({
    where: {
      catalogComponentId: componentId,
      fieldKey: key,
      status: "ACTIVE",
    },
    select: {
      id: true,
      fieldKey: true,
      label: true,
      valueType: true,
      isPublishableNow: true,
      displayOrder: true,
    },
  });
}

try {
  const targetComponent = await db.villageComponentCatalog.findUnique({
    where: { componentKey: targetComponentKey },
    select: { id: true, componentKey: true, label: true },
  });

  if (!targetComponent) {
    throw new Error(`Target component ${targetComponentKey} is not registered.`);
  }

  const sourceFields = await db.villageComponentCatalogField.findMany({
    where: {
      fieldKey,
      status: "ACTIVE",
      component: { componentKey: { not: targetComponentKey } },
    },
    select: {
      id: true,
      fieldKey: true,
      label: true,
      valueType: true,
      isPublishableNow: true,
      displayOrder: true,
      component: { select: { id: true, componentKey: true } },
    },
  });

  const existingTargetField = await getActiveCatalogField(targetComponent.id, fieldKey);
  const sourceField = sourceFields[0] ?? null;

  if (!sourceField && existingTargetField) {
    console.log(`Field ${fieldKey} is already owned by ${targetComponentKey}.`);
    process.exit(0);
  }

  if (!sourceField) {
    throw new Error(`Field ${fieldKey} is not registered in any active source component.`);
  }

  const targetField = await db.$transaction(async (tx) => {
    let field = existingTargetField;

    if (!field) {
      field = await tx.villageComponentCatalogField.update({
        where: { id: sourceField.id },
        data: { catalogComponentId: targetComponent.id },
        select: {
          id: true,
          fieldKey: true,
          label: true,
          valueType: true,
          isPublishableNow: true,
          displayOrder: true,
        },
      });
    } else {
      await tx.villageComponentCatalogField.update({
        where: { id: sourceField.id },
        data: { status: "ARCHIVED" },
      });
    }

    const targetPlacements = await tx.villageDetailComponent.findMany({
      where: { componentKey: targetComponentKey, status: "ACTIVE" },
      select: { id: true, templateId: true },
    });
    const targetPlacementByTemplate = new Map(
      targetPlacements.map((placement) => [placement.templateId, placement]),
    );

    const sourceStandards = await tx.detailFieldStandard.findMany({
      where: {
        fieldKey,
        status: "ACTIVE",
        component: { componentKey: { not: targetComponentKey } },
      },
      select: {
        id: true,
        templateId: true,
        componentId: true,
        label: true,
        valueType: true,
        isPublishableNow: true,
        displayOrder: true,
      },
    });

    for (const standard of sourceStandards) {
      const targetPlacement = targetPlacementByTemplate.get(standard.templateId);
      if (!targetPlacement) continue;

      const existingTargetStandard = await tx.detailFieldStandard.findFirst({
        where: {
          templateId: standard.templateId,
          componentId: targetPlacement.id,
          fieldKey,
        },
        select: { id: true },
      });

      let targetStandardId = existingTargetStandard?.id ?? null;
      if (existingTargetStandard) {
        await tx.detailFieldStandard.update({
          where: { id: standard.id },
          data: { status: "ARCHIVED" },
        });
      } else {
        const updated = await tx.detailFieldStandard.update({
          where: { id: standard.id },
          data: {
            componentId: targetPlacement.id,
            catalogFieldId: field.id,
            label: field.label,
            valueType: field.valueType,
            isPublishableNow: field.isPublishableNow,
            displayOrder: field.displayOrder,
          },
          select: { id: true },
        });
        targetStandardId = updated.id;
      }

      await tx.dataDesa.updateMany({
        where: {
          templateId: standard.templateId,
          fieldKey,
          componentId: standard.componentId,
        },
        data: {
          componentId: targetPlacement.id,
          fieldStandardId: targetStandardId,
        },
      });
    }

    return field;
  });

  console.log(
    `Moved field ${fieldKey} from ${sourceField.component.componentKey} to ${targetComponentKey} using catalog field ${targetField.id}.`,
  );
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  await db.$disconnect();
}
