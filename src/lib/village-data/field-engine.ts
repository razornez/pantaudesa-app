import { resolveDesaTemplate, type ResolvedField, type ResolvedTemplate } from "@/lib/village-data/template-resolver";
import { resolveFieldSourcePolicy, type FieldSourcePolicy } from "@/lib/village-data/source-policy";

export interface EffectiveTemplateField extends ResolvedField {
  sourcePolicyResolved: FieldSourcePolicy;
}

export interface EffectiveTemplateFieldEngine {
  resolvedTemplate: ResolvedTemplate;
  fields: EffectiveTemplateField[];
}

export interface PersistedTemplateFieldSnapshot {
  template: Pick<ResolvedTemplate, "templateId" | "templateKey" | "templateName">;
  visibleComponents: ResolvedTemplate["visibleComponents"];
  hiddenComponents: ResolvedTemplate["hiddenComponents"];
  fields: Array<{
    componentId: string | null;
    fieldStandardId: string | null;
    fieldKey: string;
    label: string;
    valueType: string;
    validationRules?: unknown;
    sourcePolicy?: unknown;
    isRequired?: boolean;
    isPublicVisible?: boolean;
    isPublishableNow: boolean;
    componentKey: string;
    componentLabel: string;
    sourcePolicyResolved: FieldSourcePolicy;
  }>;
}

export interface ActiveTemplateFieldBinding {
  templateId: string;
  fieldKey: string;
  componentId: string | null;
  fieldStandardId: string | null;
  componentKey: string;
  componentLabel: string;
  valueType: string;
  isPublishableNow: boolean;
}

function isRecord(input: unknown): input is Record<string, unknown> {
  return typeof input === "object" && input !== null && !Array.isArray(input);
}

export function createTemplateFieldEngineSnapshot(
  engine: EffectiveTemplateFieldEngine,
): PersistedTemplateFieldSnapshot {
  return {
    template: {
      templateId: engine.resolvedTemplate.templateId,
      templateKey: engine.resolvedTemplate.templateKey,
      templateName: engine.resolvedTemplate.templateName,
    },
    visibleComponents: engine.resolvedTemplate.visibleComponents,
    hiddenComponents: engine.resolvedTemplate.hiddenComponents,
    fields: engine.fields.map((field) => ({
      componentId: field.componentId ?? null,
      fieldStandardId: field.fieldStandardId ?? null,
      fieldKey: field.fieldKey,
      label: field.label,
      valueType: field.valueType,
      validationRules: field.validationRules,
      sourcePolicy: field.sourcePolicy,
      isRequired: field.isRequired,
      isPublicVisible: field.isPublicVisible,
      isPublishableNow: field.isPublishableNow,
      componentKey: field.componentKey,
      componentLabel: field.componentLabel,
      sourcePolicyResolved: field.sourcePolicyResolved,
    })),
  };
}

export function restoreTemplateFieldEngineFromSnapshot(
  snapshot: unknown,
): EffectiveTemplateFieldEngine | null {
  if (!isRecord(snapshot)) return null;
  const template = isRecord(snapshot.template) ? snapshot.template : null;
  const visibleComponents = Array.isArray(snapshot.visibleComponents) ? snapshot.visibleComponents : null;
  const hiddenComponents = Array.isArray(snapshot.hiddenComponents) ? snapshot.hiddenComponents : null;
  const fields = Array.isArray(snapshot.fields) ? snapshot.fields : null;

  if (!template || !visibleComponents || !hiddenComponents || !fields) return null;
  if (
    typeof template.templateId !== "string" ||
    typeof template.templateKey !== "string" ||
    typeof template.templateName !== "string"
  ) {
    return null;
  }

  const restoredFields: EffectiveTemplateField[] = [];
  for (const candidate of fields.filter(isRecord)) {
    const sourcePolicyResolved = isRecord(candidate.sourcePolicyResolved)
      ? (candidate.sourcePolicyResolved as unknown as FieldSourcePolicy)
      : null;
    if (
      typeof candidate.fieldKey !== "string" ||
      typeof candidate.label !== "string" ||
      typeof candidate.valueType !== "string" ||
      typeof candidate.componentKey !== "string" ||
      typeof candidate.componentLabel !== "string" ||
      !sourcePolicyResolved
    ) {
      continue;
    }

    restoredFields.push({
      componentId: typeof candidate.componentId === "string" ? candidate.componentId : undefined,
      fieldStandardId:
        typeof candidate.fieldStandardId === "string"
          ? candidate.fieldStandardId
          : undefined,
      fieldKey: candidate.fieldKey,
      label: candidate.label,
      valueType: candidate.valueType,
      validationRules: candidate.validationRules,
      sourcePolicy: candidate.sourcePolicy,
      isRequired: candidate.isRequired === true,
      isPublicVisible: candidate.isPublicVisible !== false,
      isPublishableNow: candidate.isPublishableNow === true,
      componentKey: candidate.componentKey,
      componentLabel: candidate.componentLabel,
      sourcePolicyResolved,
    });
  }

  if (restoredFields.length === 0) return null;

  return {
    resolvedTemplate: {
      templateId: template.templateId,
      templateKey: template.templateKey,
      templateName: template.templateName,
      visibleComponents: visibleComponents as ResolvedTemplate["visibleComponents"],
      hiddenComponents: hiddenComponents as ResolvedTemplate["hiddenComponents"],
    },
    fields: restoredFields,
  };
}

export function reconcileTemplateFieldEngineSnapshot(
  snapshotEngine: EffectiveTemplateFieldEngine,
  currentEngine: EffectiveTemplateFieldEngine,
): EffectiveTemplateFieldEngine {
  const currentFieldMap = new Map(
    currentEngine.fields.map((field) => [
      field.fieldStandardId ?? `field:${field.fieldKey}`,
      field,
    ]),
  );

  const fields = snapshotEngine.fields.map((field) => {
    const currentField =
      currentFieldMap.get(field.fieldStandardId ?? `field:${field.fieldKey}`) ?? null;
    if (!currentField) return field;

    return {
      ...field,
      validationRules: currentField.validationRules,
      sourcePolicy: currentField.sourcePolicy,
      isRequired: currentField.isRequired,
      isPublicVisible: currentField.isPublicVisible,
      isPublishableNow: currentField.isPublishableNow,
      sourcePolicyResolved: currentField.sourcePolicyResolved,
    };
  });

  return {
    resolvedTemplate: snapshotEngine.resolvedTemplate,
    fields,
  };
}

export function createActiveTemplateFieldBindingMap(
  engine: EffectiveTemplateFieldEngine,
): Map<string, ActiveTemplateFieldBinding> {
  return new Map(
    engine.fields.map((field) => [
      field.fieldKey,
      {
        templateId: engine.resolvedTemplate.templateId,
        fieldKey: field.fieldKey,
        componentId: field.componentId ?? null,
        fieldStandardId: field.fieldStandardId ?? null,
        componentKey: field.componentKey,
        componentLabel: field.componentLabel,
        valueType: field.valueType,
        isPublishableNow: field.isPublishableNow,
      } satisfies ActiveTemplateFieldBinding,
    ]),
  );
}

export async function resolveEffectiveTemplateFieldEngine(
  desaId: string,
): Promise<EffectiveTemplateFieldEngine> {
  const resolvedTemplate = await resolveDesaTemplate(desaId);
  const fields = resolvedTemplate.visibleComponents.flatMap((component) =>
    component.fields.map((field) => ({
      ...field,
      sourcePolicyResolved: resolveFieldSourcePolicy(field),
    })),
  );

  return {
    resolvedTemplate,
    fields,
  };
}
