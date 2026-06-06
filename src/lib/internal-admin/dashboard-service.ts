import {
  getDatabaseUnavailableMessage,
  isDatabaseConnectivityError,
} from "@/lib/db-connectivity";
import {
  buildComponentCatalog,
  buildInternalDashboardSummary,
  buildVillageRankings,
} from "./dashboard-logic";
import { DEFAULT_DASHBOARD_RANKING_FILTERS, INTERNAL_DASHBOARD_RANKING_LIMIT } from "./dashboard-constants";
import {
  readDashboardRankingRepositoryPayload,
  readDashboardSummaryRepositoryPayload,
} from "./dashboard-repository";
import type {
  DashboardRankingFilters,
  InternalDashboardRankingResponse,
  InternalDashboardSummary,
} from "./dashboard-types";

async function loadDashboardSummaryViaSupabaseFallback() {
  const { readDashboardSummaryRepositoryPayloadViaSupabase } = await import("./dashboard-supabase-fallback");
  const payload = await readDashboardSummaryRepositoryPayloadViaSupabase();

  return buildInternalDashboardSummary({
    desaRows: payload.desaRows,
    publishedFieldRows: payload.publishedFieldRows,
    memberRows: payload.memberRows,
    documentRows: payload.documentRows,
    voiceRows: payload.voiceRows,
    componentCatalog: buildComponentCatalog(payload.componentCatalogRows),
  });
}

async function loadDashboardRankingsViaSupabaseFallback(filters: DashboardRankingFilters) {
  const { readDashboardRankingRepositoryPayloadViaSupabase } = await import("./dashboard-supabase-fallback");
  const payload = await readDashboardRankingRepositoryPayloadViaSupabase(filters);

  return buildVillageRankings({
    desaRows: payload.desaRows,
    publishedFieldRows: payload.publishedFieldRows,
    memberRows: payload.memberRows,
    documentRows: payload.documentRows,
    voiceRows: payload.voiceRows,
    assignments: payload.assignments,
    overrides: payload.overrides,
    filters,
    limit: INTERNAL_DASHBOARD_RANKING_LIMIT,
  });
}

export async function loadInternalDashboardSummary(): Promise<
  | { kind: "data"; summary: InternalDashboardSummary }
  | { kind: "unavailable"; message: string }
> {
  try {
    const payload = await readDashboardSummaryRepositoryPayload();
    const summary = buildInternalDashboardSummary({
      desaRows: payload.desaRows,
      publishedFieldRows: payload.publishedFieldRows,
      memberRows: payload.memberRows,
      documentRows: payload.documentRows,
      voiceRows: payload.voiceRows,
      componentCatalog: buildComponentCatalog(payload.componentCatalogRows),
    });

    return { kind: "data", summary };
  } catch (error) {
    if (error instanceof Error && error.message === "Database client unavailable") {
      try {
        const summary = await loadDashboardSummaryViaSupabaseFallback();
        return { kind: "data", summary };
      } catch {
        return { kind: "unavailable", message: getDatabaseUnavailableMessage() };
      }
    }
    if (!isDatabaseConnectivityError(error)) throw error;
    try {
      const summary = await loadDashboardSummaryViaSupabaseFallback();
      return { kind: "data", summary };
    } catch {
      return { kind: "unavailable", message: getDatabaseUnavailableMessage() };
    }
  }
}

export function parseDashboardRankingFilters(input?: Partial<Record<keyof DashboardRankingFilters, string>>): DashboardRankingFilters {
  const preset = input?.preset;
  const normalizedPreset =
    preset &&
    [
      "least_complete",
      "source_backed_best",
      "most_comments",
      "unresolved_comments",
      "docs_pending",
      "no_verified_admin",
      "dummy_heavy",
      "outdated",
    ].includes(preset)
      ? (preset as DashboardRankingFilters["preset"])
      : null;

  return {
    q: input?.q?.trim() ?? DEFAULT_DASHBOARD_RANKING_FILTERS.q,
    provinsi: input?.provinsi?.trim() ?? DEFAULT_DASHBOARD_RANKING_FILTERS.provinsi,
    kabupaten: input?.kabupaten?.trim() ?? DEFAULT_DASHBOARD_RANKING_FILTERS.kabupaten,
    kecamatan: input?.kecamatan?.trim() ?? DEFAULT_DASHBOARD_RANKING_FILTERS.kecamatan,
    preset: normalizedPreset,
  };
}

export async function loadInternalDashboardRankings(
  filters: DashboardRankingFilters,
): Promise<
  | { kind: "data"; response: InternalDashboardRankingResponse }
  | { kind: "unavailable"; message: string }
> {
  if (!filters.preset) {
    return {
      kind: "data",
      response: {
        filters,
        items: [],
      },
    };
  }

  try {
    const payload = await readDashboardRankingRepositoryPayload(filters);
    const items = buildVillageRankings({
      desaRows: payload.desaRows,
      publishedFieldRows: payload.publishedFieldRows,
      memberRows: payload.memberRows,
      documentRows: payload.documentRows,
      voiceRows: payload.voiceRows,
      assignments: payload.assignments,
      overrides: payload.overrides,
      filters,
      limit: INTERNAL_DASHBOARD_RANKING_LIMIT,
    });

    return {
      kind: "data",
      response: {
        filters,
        items,
      },
    };
  } catch (error) {
    if (error instanceof Error && error.message === "Database client unavailable") {
      try {
        const items = await loadDashboardRankingsViaSupabaseFallback(filters);

        return {
          kind: "data",
          response: {
            filters,
            items,
          },
        };
      } catch {
        return { kind: "unavailable", message: getDatabaseUnavailableMessage() };
      }
    }
    if (!isDatabaseConnectivityError(error)) throw error;
    try {
      const items = await loadDashboardRankingsViaSupabaseFallback(filters);

      return {
        kind: "data",
        response: {
          filters,
          items,
        },
      };
    } catch {
      return { kind: "unavailable", message: getDatabaseUnavailableMessage() };
    }
  }
}
