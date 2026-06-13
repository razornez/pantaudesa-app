/**
 * Backfill denormalized Desa list-surface columns from DataDesa.
 *
 * The directory/list page reads jumlahPenduduk, kategori, tahunData directly
 * from the Desa table columns (a denormalized fast-read cache that avoids
 * N+1 DataDesa joins across hundreds of cards). After bulk ingestion these
 * columns go stale — the real values live in DataDesa. This one-shot sync
 * copies the latest published DataDesa value into the Desa column so the
 * directory shows real population/category instead of "0 jiwa".
 *
 * Idempotent: only updates when the column differs from DataDesa.
 * Run via DIRECT_URL (session mode) like the other ingestion scripts.
 */
import { config as loadEnv } from "dotenv";
loadEnv({ path: ".env.local", override: false });
loadEnv({ path: ".env", override: false });
if (process.env.DIRECT_URL) process.env.DATABASE_URL = process.env.DIRECT_URL;

const { PrismaClient } = await import("../src/generated/prisma/index.js");
const db = new PrismaClient();

const PROVINCE = "Jawa Barat";
const BATCH = 5;

const desas = await db.desa.findMany({
  where: { provinsi: { contains: PROVINCE, mode: "insensitive" } },
  select: { id: true, jumlahPenduduk: true, kategori: true, tahunData: true },
});
console.log(`Target: ${desas.length} desa di ${PROVINCE}`);

// Pull all published list-surface values in one query, index by desaId.
const rows = await db.dataDesa.findMany({
  where: {
    fieldKey: { in: ["jumlahPenduduk", "kategori", "tahunData"] },
    isActive: true,
    status: "PUBLISHED",
    desaId: { in: desas.map((d) => d.id) },
  },
  select: { desaId: true, fieldKey: true, valueText: true },
});

const byDesa = new Map();
for (const r of rows) {
  if (!r.valueText) continue;
  const cur = byDesa.get(r.desaId) ?? {};
  cur[r.fieldKey] = r.valueText;
  byDesa.set(r.desaId, cur);
}

let updated = 0;
let unchanged = 0;
let pending = [];

async function flush() {
  if (pending.length === 0) return;
  await Promise.all(pending);
  pending = [];
}

for (const d of desas) {
  const vals = byDesa.get(d.id);
  if (!vals) continue;

  const data = {};
  if (vals.jumlahPenduduk) {
    const n = parseInt(vals.jumlahPenduduk, 10);
    if (Number.isFinite(n) && n !== d.jumlahPenduduk) data.jumlahPenduduk = n;
  }
  if (vals.kategori && vals.kategori !== d.kategori) data.kategori = vals.kategori;
  if (vals.tahunData) {
    const t = parseInt(vals.tahunData, 10);
    if (Number.isFinite(t) && t !== d.tahunData) data.tahunData = t;
  }

  if (Object.keys(data).length === 0) {
    unchanged++;
    continue;
  }

  pending.push(db.desa.update({ where: { id: d.id }, data }));
  updated++;
  if (pending.length >= BATCH) await flush();
}
await flush();

console.log(`Updated: ${updated} | Unchanged: ${unchanged}`);
await db.$disconnect();
