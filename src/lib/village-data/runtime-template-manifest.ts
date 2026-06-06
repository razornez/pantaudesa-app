import type {
  ResolvedComponent,
  ResolvedField,
  ResolvedTemplate,
} from "@/lib/village-data/template-resolver";
import {
  DEFAULT_COMPONENT_CATALOG_BY_KEY,
  type RegisteredVillageComponentKey,
} from "@/lib/village-data/component-catalog-manifest";

export interface RuntimeTemplateManifestComponent extends ResolvedComponent {
  isVisible: boolean;
  fieldCount: number;
  rendererType: string;
  previewVariant: string;
  detailSlot: string;
  navLabel: string;
  anchorId: string;
  publicGroupKey: string | null;
  publicTabKey: string | null;
  highlightFieldKeys: string[];
  renderConfig: Record<string, unknown>;
}

export interface RuntimeTemplateManifest {
  templateId: string;
  templateKey: string;
  templateName: string;
  componentOrder: string[];
  components: RuntimeTemplateManifestComponent[];
  visibleComponents: RuntimeTemplateManifestComponent[];
  hiddenComponents: RuntimeTemplateManifestComponent[];
  fieldMap: Map<string, ResolvedField>;
  visibleFieldCount: number;
  totalFieldCount: number;
  publishableCount: number;
}

export type TemplateRuntimeContract = RuntimeTemplateManifest;
export type RuntimeComponentContract = RuntimeTemplateManifestComponent;
export type RuntimeFieldContract = ResolvedField;

export function mergeResolvedFieldsWithCatalogManifest(input: {
  componentId: string;
  componentKey: RegisteredVillageComponentKey | string;
  componentLabel: string;
  fields: ResolvedField[];
}): ResolvedField[] {
  const fallbackComponent = DEFAULT_COMPONENT_CATALOG_BY_KEY.get(
    input.componentKey as RegisteredVillageComponentKey,
  );
  if (!fallbackComponent) return input.fields;

  const existingByFieldKey = new Map(
    input.fields.map((field) => [field.fieldKey, field]),
  );

  return fallbackComponent.fields.map((fieldDef) => {
    const existing = existingByFieldKey.get(fieldDef.fieldKey);
    if (existing) return existing;

    return {
      componentId: input.componentId,
      fieldStandardId: undefined,
      fieldKey: fieldDef.fieldKey,
      label: fieldDef.label,
      valueType: fieldDef.valueType,
      validationRules: null,
      sourcePolicy: null,
      isRequired: false,
      isPublicVisible: true,
      isPublishableNow: fieldDef.isPublishableNow,
      componentKey: input.componentKey,
      componentLabel: input.componentLabel,
    } satisfies ResolvedField;
  });
}

function sortComponents(
  components: RuntimeTemplateManifestComponent[],
): RuntimeTemplateManifestComponent[] {
  return [...components].sort((left, right) => left.displayOrder - right.displayOrder);
}

function componentWithContractMetadata(
  component: ResolvedComponent,
  isVisible: boolean,
): RuntimeTemplateManifestComponent {
  const fallback = DEFAULT_COMPONENT_CATALOG_BY_KEY.get(
    component.componentKey as RegisteredVillageComponentKey,
  );

  return {
    ...component,
    isVisible,
    fieldCount: component.fields.length,
    rendererType: component.rendererType ?? fallback?.rendererType ?? "identity_grid",
    previewVariant: component.previewVariant ?? fallback?.previewVariant ?? "identity",
    detailSlot: component.detailSlot ?? fallback?.detailSlot ?? "first_view",
    navLabel: component.navLabel ?? fallback?.navLabel ?? component.label,
    anchorId:
      component.anchorId ??
      fallback?.anchorId ??
      component.componentKey.replaceAll("_", "-"),
    publicGroupKey:
      component.publicGroupKey ??
      fallback?.publicGroupKey ??
      component.detailSlot ??
      fallback?.detailSlot ??
      null,
    publicTabKey: component.publicTabKey ?? fallback?.publicTabKey ?? component.componentKey,
    highlightFieldKeys: component.highlightFieldKeys ?? fallback?.highlightFieldKeys ?? [],
    renderConfig: component.renderConfig ?? fallback?.renderConfig ?? {},
  };
}

export function buildRuntimeTemplateManifest(
  resolvedTemplate: ResolvedTemplate,
): RuntimeTemplateManifest {
  const visibleComponents = sortComponents(
    resolvedTemplate.visibleComponents.map((component) =>
      componentWithContractMetadata(component, true),
    ),
  );
  const hiddenComponents = sortComponents(
    resolvedTemplate.hiddenComponents.map((component) =>
      componentWithContractMetadata(component, false),
    ),
  );
  const components = [...visibleComponents, ...hiddenComponents];
  const fieldMap = new Map<string, ResolvedField>();

  for (const component of components) {
    for (const field of component.fields) {
      fieldMap.set(field.fieldKey, field);
    }
  }

  return {
    templateId: resolvedTemplate.templateId,
    templateKey: resolvedTemplate.templateKey,
    templateName: resolvedTemplate.templateName,
    componentOrder: components.map((component) => component.componentKey),
    components,
    visibleComponents,
    hiddenComponents,
    fieldMap,
    visibleFieldCount: visibleComponents.reduce(
      (sum, component) => sum + component.fieldCount,
      0,
    ),
    totalFieldCount: components.reduce(
      (sum, component) => sum + component.fieldCount,
      0,
    ),
    publishableCount: [...fieldMap.values()].filter(
      (field) => field.isPublishableNow,
    ).length,
  };
}

export function toRuntimeProgressSources(manifest: RuntimeTemplateManifest) {
  return manifest.components.map((component) => ({
    componentId: component.componentId,
    componentKey: component.componentKey,
    label: component.label,
    displayOrder: component.displayOrder,
    isVisible: component.isVisible,
    fields: component.fields.map((field) => ({
      fieldKey: field.fieldKey,
      label: field.label,
    })),
  }));
}
