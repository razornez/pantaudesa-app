/**
 * Generic ingestion monitor — works for any province.
 *
 * Usage:
 *   npx tsx scripts/monitor-ingest.ts --provinsi "Jawa Timur"
 *   npx tsx scripts/monitor-ingest.ts --provinsi "Jawa Tengah" --watch
 */
import { PrismaClient } from "../src/generated/prisma/index.js";
import { config as loadEnv } from "dotenv";

loadEnv({ path: ".env.local", override: false });
if (process.env.DIRECT_URL) process.env.DATABASE_URL = process.env.DIRECT_URL;
const db = new PrismaClient();

const WATCH = process.argv.includes("--watch");
const INTERVAL_MS = 30_000;

const provIdx = process.argv.indexOf("--provinsi");
const PROVINSI = provIdx !== -1 ? process.argv[provIdx + 1] : "Jawa Tengah";

async function report() {
  const total = await db.desa.count({
    where: { provinsi: { contains: PROVINSI, mode: "insensitive" } },
  });

  if (total === 0) {
    console.log(`⏳  Desa ${PROVINSI} belum ada di DB — jalankan create-desa-master dulu.`);
    console.log(`    npx tsx scripts/create-desa-master.ts --provinsi "${PROVINSI}"`);
    return;
  }

  const f = (fieldKey: string) =>
    db.dataDesa.findMany({
      where: {
        fieldKey, isActive: true, status: "PUBLISHED", sourceId: { not: null },
        desa: { provinsi: { contains: PROVINSI, mode: "insensitive" } },
      },
      select: { desaId: true },
      distinct: ["desaId"],
    }).then((r) => r.length);

  const [dana, geo, pend, luas, kades, kat, topo] = await Promise.all([
    f("danaDesa"), f("geoLat"), f("jumlahPenduduk"),
    f("luasWilayah"), f("kepalaDesa"), f("kategori"), f("topografi"),
  ]);

  const pct = (n: number) =>
    `${n.toString().padStart(5)}/${total} = ${Math.round((n / total) * 100).toString().padStart(3)}%`;

  const now = new Date().toLocaleTimeString("id-ID");
  const title = `  ${PROVINSI} — Monitor  ${now}  `;
  const width = Math.max(54, title.length + 2);
  const pad = (s: string) => s.padEnd(width - 4);

  if (WATCH) console.clear();
  console.log(`╔${"═".repeat(width)}╗`);
  console.log(`║${title.padEnd(width)}║`);
  console.log(`╠${"═".repeat(width)}╣`);
  console.log(`║  Total desa di DB : ${pad(total.toString())}║`);
  console.log(`╠${"═".repeat(width)}╣`);
  console.log(`║  danaDesa   (DJPK)     : ${pad(pct(dana))}║`);
  console.log(`║  geoLat     (OSM)      : ${pad(pct(geo))}║`);
  console.log(`║  penduduk   (DUKCAPIL) : ${pad(pct(pend))}║`);
  console.log(`║  luasWilayah(DUKCAPIL) : ${pad(pct(luas))}║`);
  console.log(`║  kepalaDesa (OpenSID)  : ${pad(pct(kades))}║`);
  console.log(`║  kategori   (IDM)      : ${pad(pct(kat))}║`);
  console.log(`║  topografi  (Elevation): ${pad(pct(topo))}║`);
  console.log(`╠${"═".repeat(width)}╣`);

  // Per-kabupaten breakdown (danaDesa coverage)
  const perKab = await db.desa.groupBy({
    by: ["kabupaten"],
    where: { provinsi: { contains: PROVINSI, mode: "insensitive" } },
    _count: { id: true },
    orderBy: { kabupaten: "asc" },
  });

  const kabWithDana = await db.dataDesa.findMany({
    where: {
      fieldKey: "danaDesa", isActive: true, status: "PUBLISHED", sourceId: { not: null },
      desa: { provinsi: { contains: PROVINSI, mode: "insensitive" } },
    },
    select: { desa: { select: { kabupaten: true } } },
    distinct: ["desaId"],
  });
  const danaPerKab: Record<string, number> = {};
  for (const r of kabWithDana) {
    danaPerKab[r.desa.kabupaten] = (danaPerKab[r.desa.kabupaten] ?? 0) + 1;
  }

  console.log(`║  Per-kabupaten (danaDesa coverage):${" ".repeat(width - 36)}║`);
  for (const kab of perKab) {
    const have = danaPerKab[kab.kabupaten] ?? 0;
    const total_kab = kab._count.id;
    const pctKab = Math.round((have / total_kab) * 100);
    const bar = "█".repeat(Math.round(pctKab / 5)) + "░".repeat(20 - Math.round(pctKab / 5));
    const status = pctKab === 100 ? "✅" : pctKab > 0 ? "⏳" : "  ";
    const line = `  ${status} ${kab.kabupaten.substring(0, 18).padEnd(18)} [${bar}] ${pctKab.toString().padStart(3)}%  `;
    console.log(`║${line.padEnd(width)}║`);
  }

  console.log(`╠${"═".repeat(width)}╣`);
  if (WATCH) {
    console.log(`║  Auto-refresh 30 detik. Ctrl+C untuk keluar.${" ".repeat(width - 45)}║`);
  }
  console.log(`╚${"═".repeat(width)}╝`);
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
