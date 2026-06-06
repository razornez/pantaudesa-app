import SuaraWargaPageClient from "@/components/suara/SuaraWargaPageClient";
import { getAllVoicesFromDb } from "@/lib/data/voice-read";
import { perfStart, publicPerfLog, publicPerfLogWithRows } from "@/lib/perf";

export default async function SuaraWargaPage() {
  const routeTimer = perfStart();
  const voicesTimer = perfStart();
  const voices = await getAllVoicesFromDb();
  publicPerfLogWithRows("public.suara-warga", "getAllVoicesFromDb()", voices.length, voicesTimer);
  publicPerfLog("public.suara-warga", "routeDataReady", routeTimer);

  return <SuaraWargaPageClient initialVoices={voices} />;
}
