import {
  DOCUMENT_CATEGORIES,
  type DocumentCategory,
} from "@/lib/storage/upload-validation";
export interface DocumentCategoryOption {
  value: string;
  label: string;
}

export interface TemplateDocumentCategorySource {
  visibleComponents: Array<{
    componentKey: string;
    label: string;
  }>;
}

const FALLBACK_CATEGORY = { value: "LAINNYA", label: "Lainnya" } as const;

function dedupeCategories(categories: DocumentCategoryOption[]): DocumentCategoryOption[] {
  const seen = new Set<string>();
  const result: DocumentCategoryOption[] = [];

  for (const category of categories) {
    if (!category.value || seen.has(category.value)) continue;
    seen.add(category.value);
    result.push(category);
  }

  return result;
}

export function buildTemplateDocumentCategories(
  template: TemplateDocumentCategorySource | null | undefined,
): DocumentCategoryOption[] {
  const componentCategories =
    template?.visibleComponents.map((component) => ({
      value: component.componentKey,
      label: component.label,
    })) ?? [];

  if (componentCategories.length === 0) {
    return [...DOCUMENT_CATEGORIES];
  }

  return dedupeCategories([...componentCategories, FALLBACK_CATEGORY]);
}

export function isValidTemplateDocumentCategory(
  category: string,
  template: TemplateDocumentCategorySource | null | undefined,
): category is DocumentCategory | string {
  return buildTemplateDocumentCategories(template).some((option) => option.value === category);
}
