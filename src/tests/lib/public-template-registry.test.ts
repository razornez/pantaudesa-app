import { describe, expect, it } from "vitest";
import { DEFAULT_COMPONENT_CATALOG_MANIFEST } from "@/lib/village-data/component-catalog-manifest";
import {
  PUBLIC_TEMPLATE_COMPONENT_REGISTRY,
  PUBLIC_TEMPLATE_RENDERER_REGISTRY,
} from "@/components/desa/public-template-registry";
import { PUBLIC_TEMPLATE_PREVIEW_REGISTRY } from "@/components/desa/public-template-preview-registry";

describe("public template component registry", () => {
  it("covers every renderer type from the manifest", () => {
    const manifestKeys = DEFAULT_COMPONENT_CATALOG_MANIFEST.map(
      (component) => component.rendererType,
    ).sort();
    const registryKeys = Object.keys(PUBLIC_TEMPLATE_RENDERER_REGISTRY).sort();

    expect(registryKeys).toEqual(manifestKeys);
  });

  it("covers every preview variant from the manifest", () => {
    const manifestKeys = DEFAULT_COMPONENT_CATALOG_MANIFEST.map(
      (component) => component.previewVariant,
    ).sort();
    const registryKeys = Object.keys(PUBLIC_TEMPLATE_PREVIEW_REGISTRY).sort();

    expect(registryKeys).toEqual(manifestKeys);
  });

  it("keeps compatibility component registry aligned with catalog contract", () => {
    for (const component of DEFAULT_COMPONENT_CATALOG_MANIFEST) {
      const entry = PUBLIC_TEMPLATE_COMPONENT_REGISTRY[component.componentKey];

      expect(entry).toBeDefined();
      expect(entry.componentKey).toBe(component.componentKey);
      expect(entry.rendererType).toBe(component.rendererType);
      expect(entry.anchorId.length).toBeGreaterThan(0);
      expect(entry.detailSlot).toBe(component.detailSlot);
      expect(entry.navLabel.length).toBeGreaterThan(0);
      expect(typeof entry.render).toBe("function");
      expect(typeof entry.preview).toBe("function");
    }
  });
});
