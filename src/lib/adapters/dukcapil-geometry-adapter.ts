import type { DataAdapter } from "./adapter-base";
import type { AdapterContext, AdapterDesaResult, AdapterRunResult } from "./types";

const LAYER_URL =
  "https://gis.dukcapil.kemendagri.go.id/arcgis/rest/services/AGR_VISUAL_KEL_FIX/FeatureServer/0/query";
const PAGE_SIZE = 500;
// Generalize boundary geometry ~55m so each desa is ~60 vertices instead of
// hundreds. Geodesic area stays accurate to well under 1% at this offset.
const SIMPLIFY_OFFSET = "0.0005";
const EARTH_RADIUS_M = 6371008.8;

interface GeomFeature {
  attributes: { kode_desa_spatial: number | null; nama_kel: string | null };
  geometry?: { rings?: number[][][] };
}

function norm(s: string): string {
  return s.toUpperCase().replace(/[^A-Z0-9]+/g, " ").trim();
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/**
 * Geodesic area of a single ring via the spherical-excess line-integral.
 * Returns signed m² (sign depends on winding); callers sum rings then abs,
 * so interior holes (opposite winding) subtract naturally.
 */
function ringAreaM2(ring: number[][]): number {
  let sum = 0;
  for (let i = 0; i < ring.length; i++) {
    const [lon1, lat1] = ring[i];
    const [lon2, lat2] = ring[(i + 1) % ring.length];
    sum += toRad(lon2 - lon1) * (2 + Math.sin(toRad(lat1)) + Math.sin(toRad(lat2)));
  }
  return (sum * EARTH_RADIUS_M * EARTH_RADIUS_M) / 2;
}

function polygonAreaKm2(rings: number[][][]): number | null {
  if (!rings.length) return null;
  let total = 0;
  for (const ring of rings) {
    if (Array.isArray(ring) && ring.length >= 3) total += ringAreaM2(ring);
  }
  const km2 = Math.abs(total) / 1e6;
  return km2 > 0 ? Math.round(km2 * 100) / 100 : null;
}

/**
 * Dukcapil GIS geometry adapter — computes luasWilayah (km²) from the official
 * Kemendagri desa boundary polygons (AGR_VISUAL_KEL_FIX).
 *
 * Separate from DukcapilGisAdapter (population) so the heavier geometry fetch
 * and the luasWilayah-only write don't churn the penduduk/KK rows on re-runs.
 * The source's own luas_wilayah column is broken (constant), so we derive area
 * geodesically from the boundary geometry instead.
 *
 * One province = ~7 paginated REST requests (500 rows each, simplified geometry).
 */
export class DukcapilGeometryAdapter implements DataAdapter {
  readonly id = "dukcapil-geometry";
  readonly sourceCode = "DUKCAPIL";
  readonly label = "Dukcapil GIS Kemendagri (batas wilayah desa)";

  private async fetchProvince(provCode: string): Promise<GeomFeature[]> {
    const features: GeomFeature[] = [];
    for (let offset = 0; ; offset += PAGE_SIZE) {
      const params = new URLSearchParams({
        where: `no_prop=${provCode}`,
        outFields: "kode_desa_spatial,nama_kel",
        returnGeometry: "true",
        outSR: "4326",
        maxAllowableOffset: SIMPLIFY_OFFSET,
        resultOffset: String(offset),
        resultRecordCount: String(PAGE_SIZE),
        f: "json",
      });
      const r = await fetch(`${LAYER_URL}?${params}`, {
        signal: AbortSignal.timeout(90000),
      });
      if (!r.ok) throw new Error(`Dukcapil geometry HTTP ${r.status} at offset ${offset}`);
      const json = (await r.json()) as {
        features?: GeomFeature[];
        error?: { message?: string };
      };
      if (json.error) throw new Error(`Dukcapil geometry error: ${json.error.message}`);
      const batch = json.features ?? [];
      features.push(...batch);
      if (batch.length < PAGE_SIZE) break;
    }
    return features;
  }

  async run(context: AdapterContext): Promise<AdapterRunResult> {
    const provCodes = new Set<string>();
    for (const d of context.desas) {
      if (d.kodeDesa && d.kodeDesa.length >= 2) provCodes.add(d.kodeDesa.slice(0, 2));
    }

    const areaByKode = new Map<string, number>();
    const areaByName = new Map<string, number>();
    for (const prov of provCodes) {
      const features = await this.fetchProvince(prov);
      for (const f of features) {
        const km2 = polygonAreaKm2(f.geometry?.rings ?? []);
        if (km2 === null || !f.attributes.kode_desa_spatial) continue;
        const kode = String(Math.round(f.attributes.kode_desa_spatial));
        areaByKode.set(kode, km2);
        if (f.attributes.nama_kel) {
          areaByName.set(`${kode.slice(0, 4)}|${norm(f.attributes.nama_kel)}`, km2);
        }
      }
    }

    const results: AdapterDesaResult[] = [];
    for (const d of context.desas) {
      if (!d.kodeDesa) {
        results.push({ desaId: d.desaId, fields: [], rawMeta: { note: "no kodeDesa" } });
        continue;
      }
      const km2 =
        areaByKode.get(d.kodeDesa) ??
        areaByName.get(`${d.kodeDesa.slice(0, 4)}|${norm(d.nama)}`);
      if (km2 === undefined) {
        results.push({
          desaId: d.desaId,
          fields: [],
          rawMeta: { note: "no geometry match", kodeDesa: d.kodeDesa },
        });
        continue;
      }
      results.push({
        desaId: d.desaId,
        fields: [{ fieldKey: "luasWilayah", value: km2 }],
        rawMeta: { kodeDesa: d.kodeDesa, luasKm2: km2 },
      });
    }

    return { adapterId: this.id, sourceCode: this.sourceCode, fetchedAt: new Date(), results };
  }
}
