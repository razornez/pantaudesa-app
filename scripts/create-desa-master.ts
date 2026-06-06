/**
 * Create/refresh Desa master records from the Kemendesa IDM cascading API.
 * Idempotent — upserts by kodeDesa (official kode wilayah). Does NOT create
 * per-desa template assignments; ingestion runner falls back to DEFAULT template.
 *
 * Usage:
 *   npx tsx scripts/create-desa-master.ts --provinsi "Jawa Barat"
 *   npx tsx scripts/create-desa-master.ts --provinsi "Jawa Barat" --all    → all kab
 *   npx tsx scripts/create-desa-master.ts --kabupaten 3204                 → one kab by IDM id
 *   npx tsx scripts/create-desa-master.ts --all                            → entire Indonesia
 *   npx tsx scripts/create-desa-master.ts                                  → pilot (Kab Bandung)
 *
 * Routes DB writes through DIRECT_URL (session pooler, port 5432).
 */
import { config as loadEnv } from "dotenv";

loadEnv({ path: ".env.local", override: false });
loadEnv({ path: ".env", override: false });
if (process.env.DIRECT_URL) process.env.DATABASE_URL = process.env.DIRECT_URL;

const BASE = "https://idm.kemendesa.go.id";
const UA = "PantauDesa/1.0 (data ingestion; +https://pantaudesa.id)";

/** Standard BPS 2-digit province codes (same as kemendesa-danadesa-adapter). */
const PROVINCE_CODE: Record<string, string> = {
  ACEH: "11", "SUMATERA UTARA": "12", "SUMATERA BARAT": "13", RIAU: "14", JAMBI: "15",
  "SUMATERA SELATAN": "16", BENGKULU: "17", LAMPUNG: "18", "KEPULAUAN BANGKA BELITUNG": "19",
  "KEPULAUAN RIAU": "21", "DKI JAKARTA": "31", "JAWA BARAT": "32", "JAWA TENGAH": "33",
  "DI YOGYAKARTA": "34", "DAERAH ISTIMEWA YOGYAKARTA": "34", "D.I. YOGYAKARTA": "34",
  "JAWA TIMUR": "35", BANTEN: "36", BALI: "51", "NUSA TENGGARA BARAT": "52",
  "NUSA TENGGARA TIMUR": "53", "KALIMANTAN BARAT": "61", "KALIMANTAN TENGAH": "62",
  "KALIMANTAN SELATAN": "63", "KALIMANTAN TIMUR": "64", "KALIMANTAN UTARA": "65",
  "SULAWESI UTARA": "71", "SULAWESI TENGAH": "72", "SULAWESI SELATAN": "73",
  "SULAWESI TENGGARA": "74", GORONTALO: "75", "SULAWESI BARAT": "76",
  MALUKU: "81", "MALUKU UTARA": "82", "PAPUA BARAT": "91", PAPUA: "94",
};

const ALL_PROV_CODES = [...new Set(Object.values(PROVINCE_CODE))].sort();
// Default pilot: Kabupaten Bandung
const DEFAULT_KAB_ID = "3204";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function idm<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(20000) });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${path}`);
  return res.json() as Promise<T>;
}

function titleCase(s: string): string {
  return s.trim().toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}
function kebab(s: string): string {
  return s.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

type KabRow = { id_kabupaten: string; nama_kab_kota: string };
type KecRow = { id_kecamatan: string; nama_kecamatan: string };
type DesaRow = { id_desa: string; nama_desa: string; tahun_data: string; pagu: string; kab_nama?: string; prov_nama?: string };

async function processKabupaten(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  db: any,
  kabId: string,
  kabNama: string,
  provNama: string,
): Promise<{ created: number; updated: number; reconciled: number }> {
  if (!db) return { created: 0, updated: 0, reconciled: 0 };
  let created = 0, updated = 0, reconciled = 0;

  const kecs = await idm<KecRow[]>(`/users/list_kecamatan/${kabId}`);
  await sleep(250);

  for (const kec of kecs) {
    let rows: DesaRow[] = [];
    try {
      rows = await idm<DesaRow[]>(`/users/list_desa/${kec.id_kecamatan}`);
      await sleep(200);
    } catch { continue; }

    // Dedup by kode wilayah, keep latest tahun_data row.
    const byKode = new Map<string, DesaRow>();
    for (const r of rows) {
      const prev = byKode.get(r.id_desa);
      if (!prev || Number(r.tahun_data) > Number(prev.tahun_data)) byKode.set(r.id_desa, r);
    }

    const kecName = titleCase(kec.nama_kecamatan);
    for (const r of byKode.values()) {
      try {
        const kodeDesa = r.id_desa;
        const nama = titleCase(r.nama_desa);
        const base = kebab(r.nama_desa);
        // Use up to 7 chars of kodeDesa suffix to build a unique slug when the
        // plain name is already taken by a desa in another kab.
        let slug = base;
        for (const suffix of [`-${kodeDesa.slice(-6)}`, `-${kodeDesa.slice(-8)}`, `-${kodeDesa}`]) {
          const clash = await db.desa.findUnique({ where: { slug }, select: { kodeDesa: true } });
          if (!clash || clash.kodeDesa === kodeDesa) break;
          slug = base + suffix;
        }

        // Reconcile any pre-existing record (no kodeDesa) with matching name+kecamatan.
        const legacy = await db.desa.findFirst({
          where: {
            kodeDesa: null,
            kabupaten: { equals: titleCase(kabNama), mode: "insensitive" },
            kecamatan: { equals: kecName, mode: "insensitive" },
            nama: { equals: nama, mode: "insensitive" },
          },
          select: { id: true },
        });
        if (legacy) {
          await db.desa.update({ where: { id: legacy.id }, data: { kodeDesa } });
          reconciled += 1;
        }

        const existing = await db.desa.findUnique({ where: { kodeDesa }, select: { id: true } });
        await db.desa.upsert({
          where: { kodeDesa },
          create: {
            kodeDesa, nama, slug,
            kecamatan: kecName,
            kabupaten: titleCase(kabNama),
            provinsi: titleCase(provNama),
            dataStatus: "demo",
          },
          update: {
            nama, kecamatan: kecName,
            kabupaten: titleCase(kabNama),
            provinsi: titleCase(provNama),
          },
        });
        if (existing || legacy) updated += 1; else created += 1;
      } catch (e) {
        console.log(`  ! ${r.nama_desa}: ${e instanceof Error ? e.message.slice(0, 80) : String(e)}`);
      }
    }
  }
  return { created, updated, reconciled };
}

async function main() {
  const argv = process.argv.slice(2);
  const { db } = await import("@/lib/db");
  if (!db) throw new Error("Database tidak tersedia.");

  const provIdx = argv.indexOf("--provinsi");
  const kabIdx  = argv.indexOf("--kabupaten");
  const allFlag = argv.includes("--all");

  let totCreated = 0, totUpdated = 0, totReconciled = 0;

  if (kabIdx >= 0 && argv[kabIdx + 1]) {
    // Single kabupaten by IDM id
    const kabId = argv[kabIdx + 1];
    const kabs = await idm<KabRow[]>(`/users/list_kabupaten/${kabId.slice(0, 2)}`);
    const kab = kabs.find(k => k.id_kabupaten === kabId);
    if (!kab) throw new Error(`Kabupaten id ${kabId} tidak ditemukan di IDM.`);
    const provCode = kabId.slice(0, 2);
    const provName = Object.keys(PROVINCE_CODE).find(k => PROVINCE_CODE[k] === provCode) ?? provCode;
    console.log(`Target: ${titleCase(kab.nama_kab_kota)} (${kabId}) — ${titleCase(provName)}`);
    const r = await processKabupaten(db, kabId, kab.nama_kab_kota, provName);
    totCreated += r.created; totUpdated += r.updated; totReconciled += r.reconciled;

  } else if (provIdx >= 0 && argv[provIdx + 1]) {
    // All kabupaten in a province
    const provName = argv[provIdx + 1];
    const provCode = PROVINCE_CODE[provName.toUpperCase()];
    if (!provCode) throw new Error(`Provinsi "${provName}" tidak ditemukan. Gunakan nama lengkap (e.g. "Jawa Barat").`);
    const kabs = await idm<KabRow[]>(`/users/list_kabupaten/${provCode}`);
    // If --all is present as second flag, process all kab; otherwise default to all in province
    console.log(`Target: ${kabs.length} kabupaten/kota di ${titleCase(provName)}`);
    for (const kab of kabs) {
      process.stdout.write(`  ${titleCase(kab.nama_kab_kota).padEnd(28)}`);
      try {
        const r = await processKabupaten(db, kab.id_kabupaten, kab.nama_kab_kota, provName);
        totCreated += r.created; totUpdated += r.updated; totReconciled += r.reconciled;
        console.log(`+${r.created} new, ~${r.updated} upd`);
      } catch (e) {
        console.log(`FAIL: ${e instanceof Error ? e.message.slice(0, 60) : String(e)}`);
      }
      await sleep(300);
    }

  } else if (allFlag) {
    // Entire Indonesia
    console.log(`Target: ALL Indonesia (${ALL_PROV_CODES.length} provinsi)`);
    for (const provCode of ALL_PROV_CODES) {
      const provName = Object.keys(PROVINCE_CODE).find(k => PROVINCE_CODE[k] === provCode) ?? provCode;
      let kabs: KabRow[] = [];
      try { kabs = await idm<KabRow[]>(`/users/list_kabupaten/${provCode}`); await sleep(300); }
      catch { console.log(`  [${provCode}] ${provName}: fail`); continue; }
      console.log(`  [${provCode}] ${titleCase(provName)} — ${kabs.length} kab`);
      for (const kab of kabs) {
        try {
          const r = await processKabupaten(db, kab.id_kabupaten, kab.nama_kab_kota, provName);
          totCreated += r.created; totUpdated += r.updated; totReconciled += r.reconciled;
          process.stdout.write(`    ${titleCase(kab.nama_kab_kota).padEnd(26)} +${r.created}\n`);
        } catch (e) {
          console.log(`    ${kab.nama_kab_kota}: FAIL ${e instanceof Error ? e.message.slice(0, 50) : ''}`);
        }
        await sleep(300);
      }
    }

  } else {
    // Default pilot: Kabupaten Bandung
    console.log(`Pilot: Kabupaten Bandung (${DEFAULT_KAB_ID}) — gunakan --provinsi atau --all untuk ekspansi`);
    const kabs = await idm<KabRow[]>(`/users/list_kabupaten/32`);
    const kab = kabs.find(k => k.id_kabupaten === DEFAULT_KAB_ID);
    if (!kab) throw new Error("Kabupaten Bandung tidak ditemukan.");
    const r = await processKabupaten(db, DEFAULT_KAB_ID, kab.nama_kab_kota, "Jawa Barat");
    totCreated += r.created; totUpdated += r.updated; totReconciled += r.reconciled;
  }

  const total = await db.desa.count();
  console.log(`\nDone. created=${totCreated} updated=${totUpdated} reconciled=${totReconciled} | total desa in DB: ${total}`);
  await db.$disconnect();
}

main().catch((e) => {
  console.error("FAILED:", e instanceof Error ? e.message : String(e));
  process.exit(1);
});
