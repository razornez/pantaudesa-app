import type { RuntimeComponentContract } from "@/lib/village-data/runtime-template-manifest";

export type PublicDetailSlotKey =
  | "first_view"
  | "sumber_dokumen"
  | "transparansi"
  | "ringkasan_anggaran"
  | "kinerja_anggaran"
  | "kelengkapan_desa"
  | "panduan_warga"
  | "suara_warga";

const LEGACY_PUBLIC_DETAIL_RENDERER_TYPES = new Set([
  "identity_grid",
  "demography_metrics",
  "perangkat_contacts",
  "source_snapshot",
  "transparency_metrics",
  "budget_summary",
  "pendapatan_breakdown",
  "kinerja_breakdown",
  "kelengkapan_tabs",
  "citizen_guide",
  "voice_preview",
]);

export function isLegacyPublicDetailRenderer(rendererType: string) {
  return LEGACY_PUBLIC_DETAIL_RENDERER_TYPES.has(rendererType);
}

export type PublicDetailRenderItem =
  | {
      kind: "legacy_slot";
      slot: PublicDetailSlotKey;
    }
  | {
      kind: "registry_component";
      componentKey: string;
      rendererType: string;
      slot: PublicDetailSlotKey;
    };

export function getOrderedVisibleSlots(
  components: Array<Pick<RuntimeComponentContract, "detailSlot">>,
): PublicDetailSlotKey[] {
  const slots: PublicDetailSlotKey[] = [];
  const seen = new Set<PublicDetailSlotKey>();

  for (const component of components) {
    const slot = component.detailSlot as PublicDetailSlotKey | undefined;
    if (!slot || seen.has(slot)) continue;
    seen.add(slot);
    slots.push(slot);
  }

  return slots;
}

export function buildPublicDetailRenderPlan(
  components: Array<
    Pick<RuntimeComponentContract, "componentKey" | "rendererType" | "detailSlot">
  >,
): PublicDetailRenderItem[] {
  const plan: PublicDetailRenderItem[] = [];
  const emittedLegacySlots = new Set<PublicDetailSlotKey>();

  for (const component of components) {
    const slot = component.detailSlot as PublicDetailSlotKey | undefined;
    if (!slot) continue;

    if (isLegacyPublicDetailRenderer(component.rendererType)) {
      if (emittedLegacySlots.has(slot)) continue;
      emittedLegacySlots.add(slot);
      plan.push({ kind: "legacy_slot", slot });
      continue;
    }

    plan.push({
      kind: "registry_component",
      componentKey: component.componentKey,
      rendererType: component.rendererType,
      slot,
    });
  }

  return plan;
}
