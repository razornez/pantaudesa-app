import { describe, expect, it } from "vitest";
import { renderTemplateComponentPreview } from "@/components/desa/public-template-preview-registry";
import { DEFAULT_COMPONENT_CATALOG_MANIFEST } from "@/lib/village-data/component-catalog-manifest";

describe("public template preview registry", () => {
  it("renders a preview node for every catalog component", () => {
    for (const component of DEFAULT_COMPONENT_CATALOG_MANIFEST) {
      const preview = renderTemplateComponentPreview({
        componentKey: component.componentKey,
        label: component.label,
        description: component.description,
        fields: component.fields.map((field) => ({
          fieldKey: field.fieldKey,
          label: field.label,
        })),
        highlightFieldKeys: component.highlightFieldKeys,
      });

      expect(preview).toBeTruthy();
    }
  });
});
