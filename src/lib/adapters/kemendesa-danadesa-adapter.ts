import type { DataAdapter } from "./adapter-base";
import type { AdapterContext, AdapterDesaResult, AdapterRunResult } from "./types";

const BASE = "https://idm.kemendesa.go.id";
const UA = "PantauDesa/1.0 (data ingestion; +https://pantaudesa.id)";

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function getJson(path: string): Promise<unknown> {
  const res = await fetch(`${BASE}${path}`, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${path}`);
  return res.json();
}

function up(s: string) {
  return s.trim().toUpperCase();
}
/** "Kabupaten Bandung" / "Kota Bandung" → "BANDUNG" (IDM uses bare name) */
function bareKab(s: string) {
  return up(s).replace(/^(KABUPATEN|KOTA)\s+/, "");
}

/** Standard BPS 2-digit province codes (the IDM API keys kabupaten lists by these). */
const PROVINCE_CODE: Record<string, string> = {
  ACEH: "11", "SUMATERA UTARA": "12", "SUMATERA BARAT": "13", RIAU: "14", JAMBI: "15",
  "SUMATERA SELATAN": "16", BENGKULU: "17", LAMPUNG: "18", "KEPULAUAN BANGKA BELITUNG": "19",
  "KEPULAUAN RIAU": "21", "DKI JAKARTA": "31", "JAWA BARAT": "32", "JAWA TENGAH": "33",
  "DI YOGYAKARTA": "34", "DAERAH ISTIMEWA YOGYAKARTA": "34", "JAWA TIMUR": "35", BANTEN: "36",
  BALI: "51", "NUSA TENGGARA BARAT": "52", "NUSA TENGGARA TIMUR": "53",
  "KALIMANTAN BARAT": "61", "KALIMANTAN TENGAH": "62", "KALIMANTAN SELATAN": "63",
  "KALIMANTAN TIMUR": "64", "KALIMANTAN UTARA": "65", "SULAWESI UTARA": "71",
  "SULAWESI TENGAH": "72", "SULAWESI SELATAN": "73", "SULAWESI TENGGARA": "74",
  GORONTALO: "75", "SULAWESI BARAT": "76", MALUKU: "81", "MALUKU UTARA": "82",
  "PAPUA BARAT": "91", PAPUA: "94",
};

/**
 * Dana Desa pagu adapter — sources the official per-desa Dana Desa pagu (APBN,
 * origin DJPK) exposed via the Kemendesa IDM open cascading API. Walks
 * propinsi → kabupaten → kecamatan → desa by name to find the desa's `pagu`.
 * Writes fieldKey: danaDesa. (IDM score endpoint is currently 500 server-side.)
 */
export class KemendesaDanaDesaAdapter implements DataAdapter {
  readonly id = "kemendesa-danadesa";
  readonly sourceCode = "DJPK-PMK";
  readonly label = "Dana Desa pagu (Kemendesa IDM / DJPK)";

  async run(context: AdapterContext): Promise<AdapterRunResult> {
    const results: AdapterDesaResult[] = [];

    // Fetch the propinsi→kabupaten→kecamatan→desa tree ONCE per (prov, kab) and
    // cache list_desa per kecamatan, instead of re-walking it for every desa.
    // For a whole kabupaten this turns ~3×N calls into ~(2 + #kecamatan).
    type KabTree = {
      kabId: string | null;
      kecIdByName: Map<string, string>;
      desaByKec: Map<string, Map<string, Record<string, string>>>;
    };
    const kabCache = new Map<string, KabTree>();

    const resolveTree = async (provinsi: string, kabupaten: string): Promise<KabTree | null> => {
      const idProv = PROVINCE_CODE[up(provinsi)];
      if (!idProv) return null;
      const key = `${idProv}|${bareKab(kabupaten)}`;
      const cached = kabCache.get(key);
      if (cached) return cached;
      const kabs = (await getJson(`/users/list_kabupaten/${idProv}`)) as Array<Record<string, string>>;
      const kab = kabs.find((k) => bareKab(String(k.nama_kab_kota ?? "")) === bareKab(kabupaten));
      await sleep(300);
      let kecIdByName = new Map<string, string>();
      if (kab?.id_kabupaten) {
        const kecs = (await getJson(`/users/list_kecamatan/${kab.id_kabupaten}`)) as Array<Record<string, string>>;
        kecIdByName = new Map(kecs.map((k) => [up(String(k.nama_kecamatan ?? "")), String(k.id_kecamatan)]));
        await sleep(300);
      }
      const tree: KabTree = { kabId: kab?.id_kabupaten ?? null, kecIdByName, desaByKec: new Map() };
      kabCache.set(key, tree);
      return tree;
    };

    const desaRowsFor = async (tree: KabTree, kecId: string) => {
      const cached = tree.desaByKec.get(kecId);
      if (cached) return cached;
      const desas = (await getJson(`/users/list_desa/${kecId}`)) as Array<Record<string, string>>;
      // Dedup by desa name, preferring the row with the largest pagu value
      // (regardless of year). IDM 2024 data is stored in thousands rather than
      // full Rupiah — e.g. 1333688 instead of 1333688000 — so "latest year"
      // often gives the wrong scale. Highest pagu across years is most reliable.
      const map = new Map<string, Record<string, string>>();
      for (const x of desas) {
        const k = up(String(x.nama_desa ?? ""));
        const prev = map.get(k);
        const xPagu = parseFloat(String(x.pagu ?? 0));
        const prevPagu = prev ? parseFloat(String(prev.pagu ?? 0)) : 0;
        if (!prev || xPagu > prevPagu) map.set(k, x);
      }
      tree.desaByKec.set(kecId, map);
      await sleep(300);
      return map;
    };

    for (const d of context.desas) {
      try {
        const tree = await resolveTree(d.provinsi, d.kabupaten);
        if (!tree) {
          results.push({ desaId: d.desaId, fields: [], rawMeta: { note: "prov code unknown", provinsi: d.provinsi } });
          continue;
        }
        if (!tree.kabId) {
          results.push({ desaId: d.desaId, fields: [], rawMeta: { note: "kab not found", kabupaten: d.kabupaten } });
          continue;
        }
        const kecId = tree.kecIdByName.get(up(d.kecamatan));
        if (!kecId) {
          results.push({ desaId: d.desaId, fields: [], rawMeta: { note: "kec not found", kecamatan: d.kecamatan } });
          continue;
        }
        const desaMap = await desaRowsFor(tree, kecId);
        const row = desaMap.get(up(d.nama));
        const pagu = row ? parseFloat(String(row.pagu)) : NaN;

        if (row && Number.isFinite(pagu) && pagu > 0) {
          const tahun = parseInt(String(row.tahun_data), 10);
          const fields = [{ fieldKey: "danaDesa", value: Math.round(pagu) }];
          if (Number.isFinite(tahun)) fields.push({ fieldKey: "tahunData", value: tahun });
          results.push({
            desaId: d.desaId,
            fields,
            rawMeta: { id_desa: row.id_desa, tahun_data: row.tahun_data, pagu: row.pagu },
          });
        } else {
          results.push({ desaId: d.desaId, fields: [], rawMeta: { note: "desa/pagu not found", nama: d.nama } });
        }
      } catch (error) {
        results.push({
          desaId: d.desaId,
          fields: [],
          rawMeta: { error: error instanceof Error ? error.message : String(error) },
        });
      }
    }

    return { adapterId: this.id, sourceCode: this.sourceCode, fetchedAt: new Date(), results };
  }
}
