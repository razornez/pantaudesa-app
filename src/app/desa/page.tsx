import DesaListClient from "@/components/desa/DesaListClient";
import { getDesaListResult } from "@/lib/data/desa-read";
import { perfStart, publicPerfLog, publicPerfLogWithRows } from "@/lib/perf";

export const dynamic = "force-dynamic";

interface Props {
  searchParams?: Promise<{ cari?: string }>;
}

export default async function DesaListPage({ searchParams }: Props) {
  const routeTimer = perfStart();
  const params = await searchParams;
  publicPerfLog("public.desa-list", "readSearchParams", routeTimer);
  const desaListTimer = perfStart();
  const result = await getDesaListResult();
  publicPerfLogWithRows("public.desa-list", "getDesaListResult()", result.items.length, desaListTimer);
  publicPerfLog("public.desa-list", "routeDataReady", routeTimer);

  return (
    <DesaListClient
      desa={result.items}
      initialSearch={params?.cari ?? ""}
      readState={result.state}
      readMessage={result.message}
      dbHostAlias={result.dbHostAlias}
    />
  );
}
