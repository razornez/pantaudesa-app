import ClaimReviewQueue from "@/components/internal-admin/ClaimReviewQueue";
import { loadClaimsQueue } from "@/lib/internal-admin/claims-page";
import { parseClaimsPageInput } from "@/lib/internal-admin/page-params";
import { perfLog, perfStart } from "@/lib/perf";

export const dynamic = "force-dynamic";

export default async function InternalAdminClaimsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string; desaId?: string }>;
}) {
  const input = parseClaimsPageInput(await searchParams);
  const tQuery = perfStart();
  const result = await loadClaimsQueue(input);
  perfLog("internal-admin.claims", "loadClaimsQueue", tQuery);

  return (
    <ClaimReviewQueue
      claims={result.claims}
      total={result.total}
      page={result.page}
      pageSize={result.pageSize}
      statusFilter={result.statusFilter}
    />
  );
}
