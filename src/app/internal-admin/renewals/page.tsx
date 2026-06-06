import InternalRenewalQueue from "@/components/internal-admin/InternalRenewalQueue";
import { loadRenewalQueue } from "@/lib/internal-admin/renewals-page";
import { parseRenewalStateFilter } from "@/lib/internal-admin/page-params";
import { perfLog, perfStart } from "@/lib/perf";

export const dynamic = "force-dynamic";

export default async function InternalAdminRenewalsPage({
  searchParams,
}: {
  searchParams: Promise<{ state?: string }>;
}) {
  const state = parseRenewalStateFilter((await searchParams).state);
  const tQuery = perfStart();
  const result = await loadRenewalQueue(state);
  perfLog("internal-admin.renewals", "loadRenewalQueue", tQuery);

  return <InternalRenewalQueue members={result.members} stateFilter={result.stateFilter} />;
}
