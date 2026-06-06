import { InternalDashboard } from "@/components/internal-admin/dashboard/InternalDashboard";
import {
  loadInternalDashboardRankings,
  loadInternalDashboardSummary,
  parseDashboardRankingFilters,
} from "@/lib/internal-admin/dashboard-service";

export const dynamic = "force-dynamic";

export default async function InternalDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    provinsi?: string;
    kabupaten?: string;
    kecamatan?: string;
    preset?: string;
  }>;
}) {
  const params = await searchParams;
  const filters = parseDashboardRankingFilters(params);

  const [summaryResult, rankingsResult] = await Promise.all([
    loadInternalDashboardSummary(),
    loadInternalDashboardRankings(filters),
  ]);

  if (summaryResult.kind === "unavailable") {
    return <div className="notice-card notice-danger text-sm">{summaryResult.message}</div>;
  }

  if (rankingsResult.kind === "unavailable") {
    return <div className="notice-card notice-danger text-sm">{rankingsResult.message}</div>;
  }

  return (
    <InternalDashboard
      summary={summaryResult.summary}
      initialRanking={rankingsResult.response}
    />
  );
}

