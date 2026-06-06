import type { FieldSourcePolicy } from "@/lib/village-data/source-policy";

export interface TemplateFieldViewModel {
  componentId: string | null;
  fieldStandardId: string | null;
  componentKey: string;
  componentLabel: string;
  fieldKey: string;
  label: string;
  valueType: string;
  isPublishableNow: boolean;
  isRequired: boolean;
  isPublicVisible: boolean;
  sourcePolicy: FieldSourcePolicy;
}

export interface TemplateFieldSectionViewModel {
  componentId: string;
  componentKey: string;
  label: string;
  displayOrder: number;
  fields: TemplateFieldViewModel[];
}

export interface TemplateFieldEngineViewModel {
  templateId: string;
  templateKey: string;
  templateName: string;
  visibleFieldCount: number;
  totalFieldCount: number;
  publishableCount: number;
  visibleComponents: TemplateFieldSectionViewModel[];
  hiddenComponents: Array<{
    componentId: string;
    componentKey: string;
    label: string;
    displayOrder: number;
  }>;
}
