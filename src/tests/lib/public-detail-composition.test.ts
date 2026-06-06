import { describe, expect, it } from "vitest";
import {
  buildPublicDetailRenderPlan,
  getOrderedVisibleSlots,
} from "@/lib/village-data/public-detail-composition";
import type { RuntimeComponentContract } from "@/lib/village-data/runtime-template-manifest";

function component(input: {
  componentKey: string;
  rendererType: string;
  detailSlot: RuntimeComponentContract["detailSlot"];
  displayOrder?: number;
}): RuntimeComponentContract {
  return {
    componentId: input.componentKey,
    componentKey: input.componentKey,
    label: input.componentKey,
    componentType: "section",
    description: null,
    isDefaultVisible: true,
    status: "ACTIVE",
    displayOrder: input.displayOrder ?? 1,
    fields: [],
    isVisible: true,
    fieldCount: 0,
    rendererType: input.rendererType,
    previewVariant: input.componentKey,
    detailSlot: input.detailSlot,
    navLabel: input.componentKey,
    anchorId: input.componentKey,
    publicGroupKey: input.detailSlot,
    publicTabKey: input.componentKey,
    highlightFieldKeys: [],
    renderConfig: {},
  } as RuntimeComponentContract;
}

describe("public detail composition", () => {
  it("renders registry-only components according to contract component order", () => {
    const components = [
      component({
        componentKey: "panduan_warga",
        rendererType: "citizen_guide",
        detailSlot: "panduan_warga",
      }),
      component({
        componentKey: "suara_warga",
        rendererType: "voice_preview",
        detailSlot: "suara_warga",
      }),
      component({
        componentKey: "agenda_desa",
        rendererType: "agenda_preview",
        detailSlot: "panduan_warga",
      }),
    ];

    expect(getOrderedVisibleSlots(components)).toEqual([
      "panduan_warga",
      "suara_warga",
    ]);
    expect(buildPublicDetailRenderPlan(components)).toEqual([
      { kind: "legacy_slot", slot: "panduan_warga" },
      { kind: "legacy_slot", slot: "suara_warga" },
      {
        kind: "registry_component",
        componentKey: "agenda_desa",
        rendererType: "agenda_preview",
        slot: "panduan_warga",
      },
    ]);
  });

  it("keeps registry-only components renderable even when legacy slot owner is hidden", () => {
    const components = [
      component({
        componentKey: "agenda_desa",
        rendererType: "agenda_preview",
        detailSlot: "panduan_warga",
      }),
      component({
        componentKey: "suara_warga",
        rendererType: "voice_preview",
        detailSlot: "suara_warga",
      }),
    ];

    expect(getOrderedVisibleSlots(components)).toEqual([
      "panduan_warga",
      "suara_warga",
    ]);
    expect(buildPublicDetailRenderPlan(components)).toEqual([
      {
        kind: "registry_component",
        componentKey: "agenda_desa",
        rendererType: "agenda_preview",
        slot: "panduan_warga",
      },
      { kind: "legacy_slot", slot: "suara_warga" },
    ]);
  });

  it("classifies legacy public shell by renderer type, not component key", () => {
    const components = [
      component({
        componentKey: "custom_identity",
        rendererType: "identity_grid",
        detailSlot: "first_view",
      }),
    ];

    expect(buildPublicDetailRenderPlan(components)).toEqual([
      { kind: "legacy_slot", slot: "first_view" },
    ]);
  });
});
