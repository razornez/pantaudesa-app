import { describe, expect, it } from "vitest";
import {
  DEFAULT_COMPONENT_CATALOG_MANIFEST,
  DEFAULT_PUBLISHED_TEMPLATE_FIELD_COUNT,
} from "@/lib/village-data/component-catalog-manifest";

describe("component catalog manifest", () => {
  it("keeps perangkat as its own component without changing total field count", () => {
    const componentKeys = DEFAULT_COMPONENT_CATALOG_MANIFEST.map(
      (component) => component.componentKey,
    );
    const profilComponent = DEFAULT_COMPONENT_CATALOG_MANIFEST.find(
      (component) => component.componentKey === "profil_desa",
    );
    const perangkatComponent = DEFAULT_COMPONENT_CATALOG_MANIFEST.find(
      (component) => component.componentKey === "perangkat",
    );

    expect(componentKeys).toContain("perangkat");
    expect(DEFAULT_PUBLISHED_TEMPLATE_FIELD_COUNT).toBe(
      DEFAULT_COMPONENT_CATALOG_MANIFEST.reduce(
        (sum, component) => sum + component.fields.length,
        0,
      ),
    );
    expect(perangkatComponent?.fields.map((field) => field.fieldKey)).toEqual(
      expect.arrayContaining(["kepalaDesa", "perangkatDesa"]),
    );
    expect(profilComponent?.fields.map((field) => field.fieldKey)).not.toContain("kepalaDesa");
    expect(profilComponent?.fields.map((field) => field.fieldKey)).not.toContain("perangkatDesa");
  });

  it("gives every component a stable slot and preview contract", () => {
    for (const component of DEFAULT_COMPONENT_CATALOG_MANIFEST) {
      expect(component.rendererType.length).toBeGreaterThan(0);
      expect(component.previewVariant.length).toBeGreaterThan(0);
      expect(component.detailSlot.length).toBeGreaterThan(0);
      expect(component.navLabel ?? component.label).toBeTruthy();
      expect(component.anchorId ?? component.componentKey.replaceAll("_", "-")).toBeTruthy();
    }
  });

  it("makes agenda desa a template-backed component with fillable fields", () => {
    const agendaComponent = DEFAULT_COMPONENT_CATALOG_MANIFEST.find(
      (component) => component.componentKey === "agenda_desa",
    );

    expect(agendaComponent).toBeTruthy();
    expect(agendaComponent?.fields.map((field) => field.fieldKey)).toEqual([
      "agendaDesa",
      "agendaRingkasan",
      "agendaKontak",
    ]);
    expect(agendaComponent?.detailSlot).toBe("panduan_warga");
  });
});
