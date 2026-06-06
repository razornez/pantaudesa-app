import type { DataAdapter } from "./adapter-base";
import type { AdapterContext, AdapterDesaResult, AdapterRunResult } from "./types";

const NOMINATIM = "https://nominatim.openstreetmap.org/search";
const UA = "PantauDesa/1.0 (data ingestion; +https://pantaudesa.id)";

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Nominatim free-text geocoder — fallback for desa that Overpass couldn't find.
 * Uses OSM's Nominatim search API (/search?q=...) which is much better at
 * free-text Indonesian address resolution than Overpass area queries.
 *
 * Rate limit: 1 req/s per Nominatim usage policy (sleep 1100ms between calls).
 * No API key required.
 *
 * Run after osm-overpass with --skip-have geoLat to only process uncoordinated desa.
 */
export class NominatimGeocodeAdapter implements DataAdapter {
  readonly id = "nominatim-geocode";
  readonly sourceCode = "OSM"; // same source as Overpass — still OpenStreetMap
  readonly label = "OpenStreetMap (Nominatim free-text geocoder)";

  async run(context: AdapterContext): Promise<AdapterRunResult> {
    const results: AdapterDesaResult[] = [];

    for (const d of context.desas) {
      // Build query: "Desa NAMA KECAMATAN KABUPATEN Indonesia"
      // Try with "Desa" prefix first for best accuracy, then without if no result.
      const queries = [
        `Desa ${d.nama} ${d.kecamatan} ${d.kabupaten} ${d.provinsi} Indonesia`,
        `${d.nama} ${d.kecamatan} ${d.kabupaten} Indonesia`,
      ];

      let found = false;
      for (const q of queries) {
        try {
          const url = `${NOMINATIM}?q=${encodeURIComponent(q)}&format=json&limit=1&countrycodes=id&addressdetails=0`;
          const res = await fetch(url, {
            headers: { "User-Agent": UA, "Accept-Language": "id,en" },
            signal: AbortSignal.timeout(12000),
          });
          await sleep(1100); // Nominatim policy: max 1 req/s

          if (!res.ok) continue;
          const data = (await res.json()) as Array<{ lat: string; lon: string; display_name: string }>;
          if (!data.length) continue;

          const lat = parseFloat(data[0].lat);
          const lng = parseFloat(data[0].lon);
          if (!isFinite(lat) || !isFinite(lng)) continue;

          // Sanity check: result should be roughly within Indonesia
          if (lat < -11 || lat > 6 || lng < 95 || lng > 141) continue;

          results.push({
            desaId: d.desaId,
            fields: [
              { fieldKey: "geoLat", value: lat },
              { fieldKey: "geoLng", value: lng },
            ],
            rawMeta: { via: "nominatim", query: q, display: data[0].display_name.slice(0, 80) },
          });
          found = true;
          break;
        } catch {
          await sleep(1100);
        }
      }

      if (!found) {
        results.push({ desaId: d.desaId, fields: [], rawMeta: { note: "not found in Nominatim", nama: d.nama } });
      }
    }

    return { adapterId: this.id, sourceCode: this.sourceCode, fetchedAt: new Date(), results };
  }
}
