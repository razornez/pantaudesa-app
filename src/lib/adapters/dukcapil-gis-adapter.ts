import type { DataAdapter } from "./adapter-base";
import type { AdapterContext, AdapterDesaResult, AdapterRunResult } from "./types";

const LAYER_URL =
  "https://gis.dukcapil.kemendagri.go.id/arcgis/rest/services/AGR_VISUAL_KEL_FIX/FeatureServer/0/query";
const PAGE_SIZE = 1000;

interface DukcapilRow {
  kode_desa_spatial: number | null;
  nama_kec: string | null;
  nama_kel: string | null;
  jumlah_penduduk: number | null;
  jumlah_kk: number | null;
  pensiunan: number | null;
  perdagangan: number | null;
  perawat: number | null;
  nelayan: number | null;
  guru: number | null;
  wiraswasta: number | null;
  pengacara: number | null;
}

const OCCUPATION_LABELS: Record<string, string> = {
  wiraswasta: "Wiraswasta",
  perdagangan: "Perdagangan",
  guru: "Guru",
  perawat: "Perawat",
  nelayan: "Nelayan",
  pensiunan: "Pensiunan",
  pengacara: "Pengacara",
};

function norm(s: string): string {
  return s.toUpperCase().replace(/[^A-Z0-9]+/g, " ").trim();
}

/**
 * Dukcapil GIS adapter — bulk-fetches the official Kemendagri civil-registry
 * desa layer (AGR_VISUAL_KEL_FIX) via ArcGIS REST and maps per-desa
 * population data onto DataDesa fields.
 *
 * One layer covers every desa/kelurahan in Indonesia with jumlah_penduduk,
 * jumlah_kk, gender/religion/education/occupation breakdowns. We fetch a
 * whole province in ~6 paginated requests (1000 rows each) instead of
 * scraping per-desa websites.
 *
 * Requires: desa.kodeDesa (matches kode_desa_spatial in most cases; falls
 * back to kab-prefix + normalised name matching).
 * Writes:   jumlahPenduduk, jumlahKK, mataPencaharian (dominant occupation).
 * Skips:    luas_wilayah — broken in the source (constant value every row).
 */
export class DukcapilGisAdapter implements DataAdapter {
  readonly id = "dukcapil-gis";
  readonly sourceCode = "DUKCAPIL";
  readonly label = "Dukcapil GIS Kemendagri (kependudukan desa)";

  private async fetchProvince(provCode: string): Promise<DukcapilRow[]> {
    const rows: DukcapilRow[] = [];
    const outFields = [
      "kode_desa_spatial",
      "nama_kec",
      "nama_kel",
      "jumlah_penduduk",
      "jumlah_kk",
      "pensiunan",
      "perdagangan",
      "perawat",
      "nelayan",
      "guru",
      "wiraswasta",
      "pengacara",
    ].join(",");

    for (let offset = 0; ; offset += PAGE_SIZE) {
      const params = new URLSearchParams({
        where: `no_prop=${provCode}`,
        outFields,
        returnGeometry: "false",
        resultOffset: String(offset),
        resultRecordCount: String(PAGE_SIZE),
        f: "json",
      });
      const r = await fetch(`${LAYER_URL}?${params}`, {
        signal: AbortSignal.timeout(60000),
      });
      if (!r.ok) throw new Error(`Dukcapil GIS HTTP ${r.status} at offset ${offset}`);
      const json = (await r.json()) as {
        features?: Array<{ attributes: DukcapilRow }>;
        exceededTransferLimit?: boolean;
        error?: { message?: string };
      };
      if (json.error) throw new Error(`Dukcapil GIS error: ${json.error.message}`);
      const batch = (json.features ?? []).map((f) => f.attributes);
      rows.push(...batch);
      if (batch.length < PAGE_SIZE) break;
    }
    return rows;
  }

  private dominantOccupation(row: DukcapilRow): string | null {
    let bestKey: string | null = null;
    let bestCount = 0;
    for (const key of Object.keys(OCCUPATION_LABELS)) {
      const count = row[key as keyof DukcapilRow];
      if (typeof count === "number" && count > bestCount) {
        bestCount = count;
        bestKey = key;
      }
    }
    return bestKey ? OCCUPATION_LABELS[bestKey] : null;
  }

  async run(context: AdapterContext): Promise<AdapterRunResult> {
    // Group target desa by province code (first 2 digits of kodeDesa) and
    // bulk-fetch each province's rows once.
    const provCodes = new Set<string>();
    for (const d of context.desas) {
      if (d.kodeDesa && d.kodeDesa.length >= 2) provCodes.add(d.kodeDesa.slice(0, 2));
    }

    const byKode = new Map<string, DukcapilRow>();
    const byName = new Map<string, DukcapilRow>();
    for (const prov of provCodes) {
      const rows = await this.fetchProvince(prov);
      for (const row of rows) {
        if (row.kode_desa_spatial) {
          byKode.set(String(Math.round(row.kode_desa_spatial)), row);
        }
        if (row.nama_kel && row.kode_desa_spatial) {
          // Secondary index: kab prefix (4 digits) + normalised desa name.
          const kab = String(Math.round(row.kode_desa_spatial)).slice(0, 4);
          byName.set(`${kab}|${norm(row.nama_kel)}`, row);
        }
      }
    }

    const results: AdapterDesaResult[] = [];
    for (const d of context.desas) {
      if (!d.kodeDesa) {
        results.push({ desaId: d.desaId, fields: [], rawMeta: { note: "no kodeDesa" } });
        continue;
      }

      const row =
        byKode.get(d.kodeDesa) ??
        byName.get(`${d.kodeDesa.slice(0, 4)}|${norm(d.nama)}`);
      if (!row) {
        results.push({
          desaId: d.desaId,
          fields: [],
          rawMeta: { note: "not in Dukcapil layer", kodeDesa: d.kodeDesa },
        });
        continue;
      }

      const fields = [];
      if (typeof row.jumlah_penduduk === "number" && row.jumlah_penduduk > 0) {
        fields.push({ fieldKey: "jumlahPenduduk", value: row.jumlah_penduduk });
      }
      if (typeof row.jumlah_kk === "number" && row.jumlah_kk > 0) {
        fields.push({ fieldKey: "jumlahKK", value: row.jumlah_kk });
      }
      const occupation = this.dominantOccupation(row);
      if (occupation) {
        fields.push({ fieldKey: "mataPencaharian", value: occupation });
      }

      results.push({
        desaId: d.desaId,
        fields,
        rawMeta: { kodeDesa: d.kodeDesa, matchedName: row.nama_kel },
      });
    }

    return { adapterId: this.id, sourceCode: this.sourceCode, fetchedAt: new Date(), results };
  }
}
