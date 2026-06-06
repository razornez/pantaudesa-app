import { describe, expect, it } from "vitest";
import { buildRuntimeTemplateManifest } from "@/lib/village-data/runtime-template-manifest";
import type { ResolvedTemplate } from "@/lib/village-data/template-resolver";

describe("runtime template manifest", () => {
  it("hydrates component render metadata from resolved catalog values", () => {
    const manifest = buildRuntimeTemplateManifest({
      templateId: "template-1",
      templateKey: "CUSTOM",
      templateName: "Custom",
      visibleComponents: [
        {
          componentId: "component-1",
          componentKey: "kinerja",
          label: "Kinerja",
          displayOrder: 1,
          rendererType: "kinerja_breakdown",
          previewVariant: "kinerja",
          detailSlot: "transparansi",
          navLabel: "Kinerja",
          anchorId: "kinerja-transparansi",
          publicGroupKey: "transparansi",
          publicTabKey: "kinerja",
          highlightFieldKeys: ["outputFisik"],
          renderConfig: { density: "compact" },
          fields: [
            {
              componentId: "component-1",
              fieldStandardId: "field-1",
              fieldKey: "outputFisik",
              label: "Output fisik",
              valueType: "json",
              isPublishableNow: true,
              componentKey: "kinerja",
              componentLabel: "Kinerja",
            },
          ],
        },
      ],
      hiddenComponents: [],
    } satisfies ResolvedTemplate);

    expect(manifest.visibleComponents[0]).toMatchObject({
      rendererType: "kinerja_breakdown",
      previewVariant: "kinerja",
      detailSlot: "transparansi",
      publicGroupKey: "transparansi",
      publicTabKey: "kinerja",
      anchorId: "kinerja-transparansi",
      highlightFieldKeys: ["outputFisik"],
      renderConfig: { density: "compact" },
    });
    expect(manifest.totalFieldCount).toBe(1);
  });

  it("falls back to catalog manifest metadata when DB metadata is not present", () => {
    const manifest = buildRuntimeTemplateManifest({
      templateId: "template-1",
      templateKey: "TEMPLATE_UMUM_DESA",
      templateName: "Default",
      visibleComponents: [
        {
          componentId: "component-1",
          componentKey: "profil_desa",
          label: "Profil & Kelengkapan Desa",
          displayOrder: 1,
          fields: [],
        },
      ],
      hiddenComponents: [],
    });

    expect(manifest.visibleComponents[0]).toMatchObject({
      rendererType: "kelengkapan_tabs",
      previewVariant: "kelengkapan",
      detailSlot: "kelengkapan_desa",
      navLabel: "Profil & Kelengkapan Desa",
      publicTabKey: "profil_desa",
    });
  });
});
