import type { DataAdapter } from "./adapter-base";
import type { AdapterContext, AdapterDesaResult, AdapterRunResult } from "./types";

const LOCATIONIQ = "https://us1.locationiq.com/v1/search";
const UA = "PantauDesa/1.0 (data ingestion; +https://pantaudesa.id)";

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * LocationIQ free-text geocoder — same OpenStreetMap data as Nominatim, but with
 * a dedicated API key so it works reliably from cloud/datacenter IPs (GitHub
 * Actions) and is not rate-limited to extinction for normal volumes.
 *
 * Free tier: ~5,000 requests/day, ~2 req/s. We pace at ~1 req/s and stop early
 * on a sustained 429 (daily quota exhausted) — the run is resumable next time
 * via `--skip-have geoLat`.
 *
 * Requires env LOCATIONIQ_KEY (or LOCATIONIQ_TOKEN). Register free at
 * https://locationiq.com/.
 *
 * Source attribution stays "OSM" (OpenStreetMap) since the data is identical.
 */
export class LocationIQGeocodeAdapter implements DataAdapter {
  readonly id = "locationiq-geocode";
  readonly sourceCode = "OSM";
  readonly label = "OpenStreetMap (LocationIQ free-text geocoder)";

  private getKey(): string {
    const key = process.env.LOCATIONIQ_KEY ?? process.env.LOCATIONIQ_TOKEN ?? "";
    if (!key) {
      throw new Error(
        "LOCATIONIQ_KEY tidak diset. Daftar gratis di https://locationiq.com/ lalu set env LOCATIONIQ_KEY.",
      );
    }
    return key;
  }

  async run(context: AdapterContext): Promise<AdapterRunResult> {
    const key = this.getKey();
    const results: AdapterDesaResult[] = [];
    let quotaExhausted = false;

    for (const d of context.desas) {
      if (quotaExhausted) {
        results.push({ desaId: d.desaId, fields: [], rawMeta: { note: "skipped: LocationIQ quota exhausted", nama: d.nama } });
        continue;
      }

      const queries = [
        `Desa ${d.nama} ${d.kecamatan} ${d.kabupaten} ${d.provinsi} Indonesia`,
        `${d.nama} ${d.kecamatan} ${d.kabupaten} Indonesia`,
      ];

      let found = false;
      for (const q of queries) {
        try {
          const url =
            `${LOCATIONIQ}?key=${encodeURIComponent(key)}` +
            `&q=${encodeURIComponent(q)}&format=json&limit=1&countrycodes=id&addressdetails=0`;
          let res = await fetch(url, {
            headers: { "User-Agent": UA, "Accept-Language": "id,en" },
            signal: AbortSignal.timeout(12000),
          });
          await sleep(1000); // pace ~1 req/s (free tier allows 2/s)

          // 429 = rate/daily-quota limit. Back off once; if still limited, stop
          // the whole run so we don't burn the rest of the list on failures.
          if (res.status === 429) {
            await sleep(2500);
            res = await fetch(url, {
              headers: { "User-Agent": UA, "Accept-Language": "id,en" },
              signal: AbortSignal.timeout(12000),
            });
            await sleep(1000);
            if (res.status === 429) {
              quotaExhausted = true;
              break;
            }
          }

          if (!res.ok) continue;
          const data = (await res.json()) as Array<{ lat: string; lon: string; display_name: string }>;
          if (!Array.isArray(data) || !data.length) continue;

          const lat = parseFloat(data[0].lat);
          const lng = parseFloat(data[0].lon);
          if (!isFinite(lat) || !isFinite(lng)) continue;

          // Sanity check: result should be roughly within Indonesia.
          if (lat < -11 || lat > 6 || lng < 95 || lng > 141) continue;

          results.push({
            desaId: d.desaId,
            fields: [
              { fieldKey: "geoLat", value: lat },
              { fieldKey: "geoLng", value: lng },
            ],
            rawMeta: { via: "locationiq", query: q, display: data[0].display_name.slice(0, 80) },
          });
          found = true;
          break;
        } catch {
          await sleep(1000);
        }
      }

      if (!found && !quotaExhausted) {
        results.push({ desaId: d.desaId, fields: [], rawMeta: { note: "not found in LocationIQ", nama: d.nama } });
      }
    }

    return { adapterId: this.id, sourceCode: this.sourceCode, fetchedAt: new Date(), results };
  }
}
