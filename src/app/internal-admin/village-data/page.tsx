import { VillageDataCenter } from "@/components/internal-admin/VillageDataCenter";

export const dynamic = "force-dynamic";

const VALID_TABS = ["standards", "desa-data", "versions", "activity"] as const;
type VillageDataTab = (typeof VALID_TABS)[number];

export default async function VillageDataPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const params = await searchParams;
  const tab: VillageDataTab = VALID_TABS.includes(params.tab as VillageDataTab)
    ? (params.tab as VillageDataTab)
    : "desa-data";

  return <VillageDataCenter initialTab={tab} />;
}
