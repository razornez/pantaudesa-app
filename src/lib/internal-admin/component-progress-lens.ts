export type ComponentCompletionStatus = "empty" | "partial" | "complete";

export interface ComponentProgressFieldSource {
  fieldKey: string;
  label: string;
}

export interface ComponentProgressSource {
  componentId: string;
  componentKey: string;
  label: string;
  displayOrder: number;
  isVisible: boolean;
  fields: ComponentProgressFieldSource[];
}

export interface ComponentProgressLensInput {
  components: ComponentProgressSource[];
  publishedFieldKeys: Iterable<string>;
  sourceCount?: number;
  documentCount?: number;
  voiceCount?: number;
}

export interface PublishedFieldRowSource {
  fieldKey: string;
  componentId: string | null;
  fieldStandardId?: string | null;
}

export interface ComponentProgressEntry {
  componentId: string;
  componentKey: string;
  label: string;
  displayOrder: number;
  isVisible: boolean;
  fieldCount: number;
  filledFieldCount: number;
  totalFieldCount: number;
  completionStatus: ComponentCompletionStatus;
  filledFieldLabels: string[];
  missingFieldLabels: string[];
  teaserLabels: string[];
  derivedSignals: string[];
}

export interface ComponentProgressLens {
  components: ComponentProgressEntry[];
  aggregateFilledFieldCount: number;
  aggregateTotalFieldCount: number;
  aggregateFilledSignalCount: number;
  aggregateTotalSignalCount: number;
}

export interface PublishedFieldMatchSnapshot {
  validFieldKeys: Set<string>;
  mismatchRows: PublishedFieldRowSource[];
  unknownRows: PublishedFieldRowSource[];
}

const NON_FIELD_COMPONENT_LABELS = {
  sumber_dokumen: ["Sumber publik", "Dokumen pendukung"],
  panduan_warga: ["Panduan warga"],
  suara_warga: ["Suara warga"],
} as const;

function toStatus(filled: number, total: number): ComponentCompletionStatus {
  if (total <= 0 || filled <= 0) return "empty";
  if (filled >= total) return "complete";
  return "partial";
}

function toPluralLabel(count: number, singular: string, plural: string) {
  return `${count} ${count === 1 ? singular : plural}`;
}

export function matchPublishedRowsToComponents(input: {
  components: ComponentProgressSource[];
  publishedRows: PublishedFieldRowSource[];
}): PublishedFieldMatchSnapshot {
  const componentFieldMap = new Map<string, Set<string>>();
  const fieldToComponentMap = new Map<string, string>();

  for (const component of input.components) {
    componentFieldMap.set(
      component.componentId,
      new Set(component.fields.map((field) => field.fieldKey)),
    );
    for (const field of component.fields) {
      fieldToComponentMap.set(field.fieldKey, component.componentId);
    }
  }

  const validFieldKeys = new Set<string>();
  const mismatchRows: PublishedFieldRowSource[] = [];
  const unknownRows: PublishedFieldRowSource[] = [];

  for (const row of input.publishedRows) {
    const expectedComponentId = fieldToComponentMap.get(row.fieldKey);
    if (!expectedComponentId) {
      unknownRows.push(row);
      continue;
    }

    const validFieldsForComponent = row.componentId
      ? componentFieldMap.get(row.componentId)
      : undefined;

    if (row.componentId === expectedComponentId && validFieldsForComponent?.has(row.fieldKey)) {
      validFieldKeys.add(row.fieldKey);
      continue;
    }

    mismatchRows.push(row);
  }

  return {
    validFieldKeys,
    mismatchRows,
    unknownRows,
  };
}

function buildDerivedEntry(
  component: ComponentProgressSource,
  input: Pick<ComponentProgressLensInput, "sourceCount" | "documentCount" | "voiceCount">,
): Omit<ComponentProgressEntry, "teaserLabels"> {
  if (component.componentKey === "sumber_dokumen") {
    const sourceCount = input.sourceCount ?? 0;
    const documentCount = input.documentCount ?? 0;
    const labels = [...NON_FIELD_COMPONENT_LABELS.sumber_dokumen];
    const filledFieldLabels = [
      ...(sourceCount > 0 ? [labels[0]] : []),
      ...(documentCount > 0 ? [labels[1]] : []),
    ];

    return {
      componentId: component.componentId,
      componentKey: component.componentKey,
      label: component.label,
      displayOrder: component.displayOrder,
      isVisible: component.isVisible,
      fieldCount: labels.length,
      filledFieldCount: filledFieldLabels.length,
      totalFieldCount: labels.length,
      completionStatus: toStatus(filledFieldLabels.length, labels.length),
      filledFieldLabels,
      missingFieldLabels: labels.filter((label) => !filledFieldLabels.includes(label)),
      derivedSignals: [
        toPluralLabel(sourceCount, "sumber", "sumber"),
        toPluralLabel(documentCount, "dokumen", "dokumen"),
      ],
    };
  }

  if (component.componentKey === "panduan_warga") {
    const labels = [...NON_FIELD_COMPONENT_LABELS.panduan_warga];

    return {
      componentId: component.componentId,
      componentKey: component.componentKey,
      label: component.label,
      displayOrder: component.displayOrder,
      isVisible: component.isVisible,
      fieldCount: labels.length,
      filledFieldCount: labels.length,
      totalFieldCount: labels.length,
      completionStatus: "complete",
      filledFieldLabels: labels,
      missingFieldLabels: [],
      derivedSignals: ["Konten sistem siap tampil"],
    };
  }

  if (component.componentKey === "suara_warga") {
    const labels = [...NON_FIELD_COMPONENT_LABELS.suara_warga];
    const voiceCount = input.voiceCount ?? 0;
    const filledFieldLabels = voiceCount > 0 ? labels : [];

    return {
      componentId: component.componentId,
      componentKey: component.componentKey,
      label: component.label,
      displayOrder: component.displayOrder,
      isVisible: component.isVisible,
      fieldCount: labels.length,
      filledFieldCount: filledFieldLabels.length,
      totalFieldCount: labels.length,
      completionStatus: toStatus(filledFieldLabels.length, labels.length),
      filledFieldLabels,
      missingFieldLabels: labels.filter((label) => !filledFieldLabels.includes(label)),
      derivedSignals: [
        voiceCount > 0
          ? toPluralLabel(voiceCount, "suara warga", "suara warga")
          : "Belum ada suara warga",
      ],
    };
  }

  return {
    componentId: component.componentId,
    componentKey: component.componentKey,
    label: component.label,
    displayOrder: component.displayOrder,
    isVisible: component.isVisible,
    fieldCount: 0,
    filledFieldCount: 0,
    totalFieldCount: 0,
    completionStatus: "empty",
    filledFieldLabels: [],
    missingFieldLabels: [],
    derivedSignals: [],
  };
}

export function buildComponentProgressLens(
  input: ComponentProgressLensInput,
): ComponentProgressLens {
  const publishedKeys = new Set(input.publishedFieldKeys);

  const components = input.components
    .map<ComponentProgressEntry>((component) => {
      if (component.fields.length === 0) {
        const derived = buildDerivedEntry(component, input);
        return {
          ...derived,
          teaserLabels: derived.filledFieldLabels.slice(0, 3),
        };
      }

      const filledFieldLabels = component.fields
        .filter((field) => publishedKeys.has(field.fieldKey))
        .map((field) => field.label);
      const missingFieldLabels = component.fields
        .filter((field) => !publishedKeys.has(field.fieldKey))
        .map((field) => field.label);
      const totalFieldCount = component.fields.length;
      const filledFieldCount = filledFieldLabels.length;

      return {
        componentId: component.componentId,
        componentKey: component.componentKey,
        label: component.label,
        displayOrder: component.displayOrder,
        isVisible: component.isVisible,
        fieldCount: totalFieldCount,
        filledFieldCount,
        totalFieldCount,
        completionStatus: toStatus(filledFieldCount, totalFieldCount),
        filledFieldLabels,
        missingFieldLabels,
        teaserLabels: filledFieldLabels.slice(0, 3),
        derivedSignals: [],
      };
    })
    .sort((left, right) => left.displayOrder - right.displayOrder);

  const aggregate = components.reduce(
    (acc, component) => {
      if (!component.isVisible) return acc;
      const sourceComponent = input.components.find(
        (item) => item.componentId === component.componentId,
      );
      if (!sourceComponent) return acc;
      if (sourceComponent.fields.length === 0) {
        acc.aggregateFilledSignalCount += component.filledFieldCount;
        acc.aggregateTotalSignalCount += component.totalFieldCount;
        return acc;
      }
      acc.aggregateFilledFieldCount += component.filledFieldCount;
      acc.aggregateTotalFieldCount += component.totalFieldCount;
      return acc;
    },
    {
      aggregateFilledFieldCount: 0,
      aggregateTotalFieldCount: 0,
      aggregateFilledSignalCount: 0,
      aggregateTotalSignalCount: 0,
    },
  );

  return {
    components,
    ...aggregate,
  };
}
