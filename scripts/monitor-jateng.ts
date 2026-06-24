/**
 * Real-time coverage monitor for Jawa Tengah ingestion.
 * Run in a separate terminal while ingest-jateng.sh is running:
 *   npx tsx scripts/monitor-jateng.ts
 *   npx tsx scripts/monitor-jateng.ts --watch   → refresh every 30s
 */
import { PrismaClient } from "../src/generated/prisma/index.js";
import { config as loadEnv } from "dotenv";

loadEnv({ path: ".env.local", override: false });
if (process.env.DIRECT_URL) process.env.DATABASE_URL = process.env.DIRECT_URL;
const db = new PrismaClient();

const WATCH = process.argv.includes("--watch");
const INTERVAL_MS = 30_000;

async function report() {
  const total = await db.desa.count({
    where: { provinsi: { contains: "Jawa Tengah", mode: "insensitive" } },
  });

  if (total === 0) {
    console.log("⏳  Desa Jawa Tengah belum ada di DB — create-desa-master masih berjalan...");
    return;
  }

  const f = (fieldKey: string) =>
    db.dataDesa.findMany({
      where: {
        fieldKey, isActive: true, status: "PUBLISHED", sourceId: { not: null },
        desa: { provinsi: { contains: "Jawa Tengah", mode: "insensitive" } },
      },
      select: { desaId: true },
      distinct: ["desaId"],
    }).then((r) => r.length);

  const [dana, geo, pend, luas, kades, kat, topo] = await Promise.all([
    f("danaDesa"), f("geoLat"), f("jumlahPenduduk"),
    f("luasWilayah"), f("kepalaDesa"), f("kategori"), f("topografi"),
  ]);

  const pct = (n: number) => `${n.toString().padStart(5)}/${total} = ${Math.round(n / total * 100).toString().padStart(3)}%`;

  const now = new Date().toLocaleTimeString("id-ID");
  console.clear();
  console.log(`╔══════════════════════════════════════════════════════╗`);
  console.log(`║  PantauDesa — Jawa Tengah Ingestion Monitor  ${now}  ║`);
  console.log(`╠══════════════════════════════════════════════════════╣`);
  console.log(`║  Total desa di DB : ${total.toString().padEnd(33)}║`);
  console.log(`╠══════════════════════════════════════════════════════╣`);
  console.log(`║  danaDesa   (DJPK)    : ${pct(dana).padEnd(29)}║`);
  console.log(`║  geoLat     (OSM)     : ${pct(geo).padEnd(29)}║`);
  console.log(`║  penduduk   (DUKCAPIL): ${pct(pend).padEnd(29)}║`);
  console.log(`║  luasWilayah(DUKCAPIL): ${pct(luas).padEnd(29)}║`);
  console.log(`║  kepalaDesa (OpenSID) : ${pct(kades).padEnd(29)}║`);
  console.log(`║  kategori   (IDM)     : ${pct(kat).padEnd(29)}║`);
  console.log(`║  topografi  (Elevation): ${pct(topo).padEnd(28)}║`);
  console.log(`╠══════════════════════════════════════════════════════╣`);

  // Per-kabupaten breakdown (kabupaten yang sudah punya danaDesa)
  const perKab = await db.desa.groupBy({
    by: ["kabupaten"],
    where: { provinsi: { contains: "Jawa Tengah", mode: "insensitive" } },
    _count: { id: true },
    orderBy: { kabupaten: "asc" },
  });

  // Count danaDesa per kabupaten
  const kabWithDana = await db.dataDesa.findMany({
    where: {
      fieldKey: "danaDesa", isActive: true, status: "PUBLISHED", sourceId: { not: null },
      desa: { provinsi: { contains: "Jawa Tengah", mode: "insensitive" } },
    },
    select: { desa: { select: { kabupaten: true } } },
    distinct: ["desaId"],
  });
  const danaPerKab: Record<string, number> = {};
  for (const r of kabWithDana) {
    danaPerKab[r.desa.kabupaten] = (danaPerKab[r.desa.kabupaten] ?? 0) + 1;
  }

  console.log(`║  Per-kabupaten (danaDesa coverage):                  ║`);
  for (const kab of perKab) {
    const have = danaPerKab[kab.kabupaten] ?? 0;
    const total_kab = kab._count.id;
    const pctKab = Math.round(have / total_kab * 100);
    const bar = "█".repeat(Math.round(pctKab / 5)) + "░".repeat(20 - Math.round(pctKab / 5));
    const status = pctKab === 100 ? "✅" : pctKab > 0 ? "⏳" : "  ";
    console.log(`║  ${status} ${kab.kabupaten.substring(0,18).padEnd(18)} [${bar}] ${pctKab.toString().padStart(3)}%  ║`);
  }

  console.log(`╠══════════════════════════════════════════════════════╣`);
  if (WATCH) {
    console.log(`║  Auto-refresh setiap 30 detik. Ctrl+C untuk keluar.  ║`);
  }
  console.log(`╚══════════════════════════════════════════════════════╝`);
}

async function main() {
  await report();
  if (WATCH) {
    setInterval(async () => {
      try { await report(); } catch (e) { console.error(e); }
    }, INTERVAL_MS);
  } else {
    await db.$disconnect();
  }
}

main().catch((e) => { console.error(e); db.$disconnect(); });