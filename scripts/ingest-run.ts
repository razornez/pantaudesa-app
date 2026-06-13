/**
 * Batch ingestion runner for one or more desa.
 *
 * Usage:
 *   npx tsx scripts/ingest-run.ts                      → default: batukarut
 *   npx tsx scripts/ingest-run.ts batukarut lebakwangi → explicit slugs
 *   npx tsx scripts/ingest-run.ts --kecamatan Arjasari → every desa in a kecamatan
 *   npx tsx scripts/ingest-run.ts --all                → every desa in the DB
 *
 * Routes through DIRECT_URL (session-mode, port 5432) because the transaction
 * pooler (6543) refuses connections under saturation. Env is loaded BEFORE the
 * Prisma singleton (@/lib/db) is imported so the client picks up the override.
 */
import { config as loadEnv } from "dotenv";

loadEnv({ path: ".env.local", override: false });
loadEnv({ path: ".env", override: false });
if (process.env.DIRECT_URL) process.env.DATABASE_URL = process.env.DIRECT_URL;

async function main() {
  const argv = process.argv.slice(2);

  const { db } = await import("@/lib/db");
  const { OSMOverpassAdapter } = await import("@/lib/adapters/osm-overpass-adapter");
  const { KemendesaDanaDesaAdapter } = await import("@/lib/adapters/kemendesa-danadesa-adapter");
  const { OpenSIDAdapter } = await import("@/lib/adapters/opensid-adapter");
  const { KecamatanBandungAdapter } = await import("@/lib/adapters/kecamatan-bandung-adapter");
  const { NominatimGeocodeAdapter } = await import("@/lib/adapters/nominatim-geocode-adapter");
  const { LocationIQGeocodeAdapter } = await import("@/lib/adapters/locationiq-geocode-adapter");
  const { KemendesaIdmAdapter } = await import("@/lib/adapters/kemendesa-idm-adapter");
  const { OpenMeteoElevationAdapter } = await import("@/lib/adapters/openmeteo-elevation-adapter");
  const { DukcapilGisAdapter } = await import("@/lib/adapters/dukcapil-gis-adapter");
  const { DukcapilGeometryAdapter } = await import("@/lib/adapters/dukcapil-geometry-adapter");
  const { runIngestion } = await import("@/lib/adapters/ingestion-runner");
  if (!db) throw new Error("Database tidak tersedia.");

  // Resolve target desa: --all, --provinsi, --kabupaten, --kecamatan, explicit slugs.
  const kecIdx  = argv.indexOf("--kecamatan");
  const kabIdx  = argv.indexOf("--kabupaten");
  const provIdx = argv.indexOf("--provinsi");
  const slugArgs = argv.filter((a) => !a.startsWith("--"));
  const where = argv.includes("--all")
    ? {}
    : provIdx >= 0 && argv[provIdx + 1]
      ? { provinsi: { equals: argv[provIdx + 1], mode: "insensitive" as const } }
      : kabIdx >= 0 && argv[kabIdx + 1]
        ? { kabupaten: { equals: argv[kabIdx + 1], mode: "insensitive" as const } }
        : kecIdx >= 0 && argv[kecIdx + 1]
          ? { kecamatan: { equals: argv[kecIdx + 1], mode: "insensitive" as const } }
          : { slug: { in: slugArgs.length ? slugArgs : ["batukarut"] } };

  const desas = await db.desa.findMany({
    where,
    select: { id: true, slug: true, kodeDesa: true, nama: true, kecamatan: true, kabupaten: true, provinsi: true, websiteUrl: true },
    orderBy: { nama: "asc" },
  });
  if (desas.length === 0) throw new Error("Tidak ada desa yang cocok dengan filter.");

  // --skip-have <fieldKey>: skip desa that already have that real field, so a
  // long pass (e.g. OSM) is resumable — re-runs only process what's missing.
  const skipIdx = argv.indexOf("--skip-have");
  const skipField = skipIdx >= 0 ? argv[skipIdx + 1] : null;
  let workDesas = desas;
  if (skipField) {
    const have = new Set(
      (
        await db.dataDesa.findMany({
          where: { fieldKey: skipField, isActive: true, status: "PUBLISHED", desaId: { in: desas.map((d) => d.id) } },
          select: { desaId: true },
          distinct: ["desaId"],
        })
      ).map((r) => r.desaId),
    );
    workDesas = desas.filter((d) => !have.has(d.id));
    console.log(`--skip-have ${skipField}: ${have.size} sudah punya, proses ${workDesas.length} sisanya.`);
  }
  if (workDesas.length === 0) {
    console.log("Tidak ada desa yang perlu diproses (semua sudah punya field tsb).");
    await db.$disconnect();
    return;
  }
  console.log(`Target: ${workDesas.length} desa → ${workDesas.map((d) => d.nama).slice(0, 30).join(", ")}${workDesas.length > 30 ? " …" : ""}\n`);

  const ctx = {
    desas: workDesas.map((d) => ({
      desaId: d.id,
      nama: d.nama,
      kecamatan: d.kecamatan,
      kabupaten: d.kabupaten,
      provinsi: d.provinsi,
      kodeDesa: d.kodeDesa,
      website: d.websiteUrl ?? undefined,
    })),
  };

  // --only <substr> runs just one adapter (e.g. osm / kemendesa / opensid) so the
  // full kabupaten ingest can be split into per-adapter passes that each finish
  // within a foreground time budget.
  const onlyIdx = argv.indexOf("--only");
  const only = onlyIdx >= 0 ? argv[onlyIdx + 1] : null;
  const kecAdapter = new KecamatanBandungAdapter();
  kecAdapter.setDb(db);
  const hasBandung = workDesas.some((d) => /^bandung$/i.test(d.kabupaten));
  const adapters = [
    new OSMOverpassAdapter(),
    new NominatimGeocodeAdapter(), // free OSM geocoder (local IP only — blocked on cloud)
    new LocationIQGeocodeAdapter(), // keyed OSM geocoder (works from cloud; needs LOCATIONIQ_KEY)
    new KemendesaDanaDesaAdapter(),
    new KemendesaIdmAdapter(),
    new OpenMeteoElevationAdapter(),
    new DukcapilGisAdapter(),
    new DukcapilGeometryAdapter(),
    ...(hasBandung ? [kecAdapter] : []),
    new OpenSIDAdapter(),
  ].filter((a) => !only || a.id.includes(only));

  for (const adapter of adapters) {
    const s = await runIngestion(adapter, ctx);
    console.log(
      `[${adapter.id}] processed=${s.desaProcessed} updated=${s.fieldsUpdated} skipped=${s.fieldsSkipped} errors=${s.errors.length}`,
    );
    s.errors.slice(0, 3).forEach((e) => console.log(`    ! ${e.replace(/\s+/g, " ").slice(0, 140)}`));
  }

  if (workDesas.length <= 40) {
    console.log("\n=== Real fields per desa (active, attributed) ===");
    for (const d of workDesas) {
      const rows = await db.dataDesa.findMany({
        where: { desaId: d.id, isActive: true, status: "PUBLISHED", sourceId: { not: null } },
        select: { fieldKey: true },
        orderBy: { fieldKey: "asc" },
      });
      console.log(`  ${d.nama.padEnd(16)} ${String(rows.length).padStart(2)} → ${rows.map((r) => r.fieldKey).join(", ")}`);
    }
  }

  await db.$disconnect();
}

main().catch((e) => {
  console.error("FAILED:", e instanceof Error ? e.message : String(e));
  process.exit(1);
});
