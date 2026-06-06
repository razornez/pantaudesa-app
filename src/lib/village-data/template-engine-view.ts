import {
  resolveEffectiveTemplateFieldEngine,
  type EffectiveTemplateField,
} from "@/lib/village-data/field-engine";
import { buildRuntimeTemplateManifest } from "@/lib/village-data/runtime-template-manifest";
import type {
  TemplateFieldEngineViewModel,
  TemplateFieldSectionViewModel,
  TemplateFieldViewModel,
} from "@/lib/village-data/template-field-contract";

function toFieldViewModel(field: EffectiveTemplateField): TemplateFieldViewModel {
  return {
    componentId: field.componentId ?? null,
    fieldStandardId: field.fieldStandardId ?? null,
    componentKey: field.componentKey,
    componentLabel: field.componentLabel,
    fieldKey: field.fieldKey,
    label: field.label,
    valueType: field.valueType,
    isPublishableNow: field.isPublishableNow,
    isRequired: Boolean(field.isRequired),
    isPublicVisible: field.isPublicVisible !== false,
    sourcePolicy: field.sourcePolicyResolved,
  };
}

export async function buildTemplateFieldEngineViewModel(
  desaId: string,
): Promise<TemplateFieldEngineViewModel> {
  const engine = await resolveEffectiveTemplateFieldEngine(desaId);
  const runtimeManifest = buildRuntimeTemplateManifest(engine.resolvedTemplate);
  const fieldMap = new Map(engine.fields.map((field) => [field.fieldKey, field]));

  const visibleComponents: TemplateFieldSectionViewModel[] =
    engine.resolvedTemplate.visibleComponents.map((component) => ({
      componentId: component.componentId,
      componentKey: component.componentKey,
      label: component.label,
      displayOrder: component.displayOrder,
      fields: component.fields
        .map((field) => fieldMap.get(field.fieldKey))
        .filter((field): field is EffectiveTemplateField => Boolean(field))
        .map(toFieldViewModel),
    }));

  return {
    templateId: engine.resolvedTemplate.templateId,
    templateKey: engine.resolvedTemplate.templateKey,
    templateName: engine.resolvedTemplate.templateName,
    visibleFieldCount: runtimeManifest.visibleFieldCount,
    totalFieldCount: runtimeManifest.totalFieldCount,
    publishableCount: runtimeManifest.publishableCount,
    visibleComponents,
    hiddenComponents: engine.resolvedTemplate.hiddenComponents,
  };
}
