import { getDesaListWithFallback } from "@/lib/data/desa-read";
import BandingkanClient from "./BandingkanClient";

export const dynamic = "force-dynamic";

export default async function BandingkanPage() {
  const desaList = await getDesaListWithFallback();
  return <BandingkanClient desaList={desaList} />;
}
