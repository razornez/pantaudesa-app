import type { DataAdapter } from "./adapter-base";
import type { AdapterContext, AdapterDesaResult, AdapterRunResult } from "./types";

const ELEVATION_URL = "https://api.open-meteo.com/v1/elevation";
const BATCH = 100; // Open-Meteo supports up to 100 coords per request

/**
 * Derives topografi (terrain type) for each desa from elevation data.
 *
 * Source: Open-Meteo elevation API (SRTM/Copernicus DEM, free, no key required)
 * Requires: geoLat + geoLng already in DataDesa (from OSM adapter)
 * Writes:   topografi ("Dataran" | "Perbukitan" | "Pegunungan")
 *
 * Classification thresholds (metres above sea level):
 *   < 200   → Dataran
 *   200–500 → Perbukitan
 *   ≥ 500   → Pegunungan
 */
export class OpenMeteoElevationAdapter implements DataAdapter {
  readonly id = "openmeteo-elevation";
  readonly sourceCode = "OPENMETEO";
  readonly label = "Open-Meteo Elevation API (topografi desa)";

  private classify(elevationM: number): string {
    if (elevationM < 200) return "Dataran";
    if (elevationM < 500) return "Perbukitan";
    return "Pegunungan";
  }

  async run(context: AdapterContext): Promise<AdapterRunResult> {
    // Lazily import db so the adapter stays loadable in plain Node without
    // Next.js server context (same pattern as ingestion-runner).
    const { db } = await import("@/lib/db");
    if (!db) throw new Error("Database tidak tersedia");

    const desaIds = context.desas.map((d) => d.desaId);

    // Fetch geoLat + geoLng for the target desa from DataDesa.
    const geoRows = await db.dataDesa.findMany({
      where: {
        desaId: { in: desaIds },
        fieldKey: { in: ["geoLat", "geoLng"] },
        isActive: true,
        status: "PUBLISHED",
      },
      select: { desaId: true, fieldKey: true, valueText: true },
    });

    // Build desaId → { lat, lng } map from valueText.
    const coordMap = new Map<string, { lat?: number; lng?: number }>();
    for (const row of geoRows) {
      if (!row.valueText) continue;
      const v = parseFloat(row.valueText);
      if (!Number.isFinite(v)) continue;
      const c = coordMap.get(row.desaId) ?? {};
      if (row.fieldKey === "geoLat") c.lat = v;
      if (row.fieldKey === "geoLng") c.lng = v;
      coordMap.set(row.desaId, c);
    }

    // Only process desa with both coordinates.
    const withCoords = context.desas.filter((d) => {
      const c = coordMap.get(d.desaId);
      return c?.lat !== undefined && c?.lng !== undefined;
    });
    const withoutCoords = context.desas.filter((d) => !withCoords.includes(d));

    const results: AdapterDesaResult[] = withoutCoords.map((d) => ({
      desaId: d.desaId,
      fields: [],
      rawMeta: { note: "no coordinates" },
    }));

    // Batch fetch elevations from Open-Meteo.
    for (let i = 0; i < withCoords.length; i += BATCH) {
      const batch = withCoords.slice(i, i + BATCH);
      const lats = batch.map((d) => coordMap.get(d.desaId)!.lat!.toFixed(6)).join(",");
      const lngs = batch.map((d) => coordMap.get(d.desaId)!.lng!.toFixed(6)).join(",");

      try {
        const url = `${ELEVATION_URL}?latitude=${lats}&longitude=${lngs}`;
        const r = await fetch(url, { signal: AbortSignal.timeout(30000) });
        if (!r.ok) {
          batch.forEach((d) =>
            results.push({ desaId: d.desaId, fields: [], rawMeta: { note: `HTTP ${r.status}` } }),
          );
          continue;
        }
        const json = (await r.json()) as { elevation: number[] };
        for (let j = 0; j < batch.length; j++) {
          const elevation = json.elevation?.[j];
          if (typeof elevation !== "number" || !Number.isFinite(elevation)) {
            results.push({ desaId: batch[j].desaId, fields: [], rawMeta: { note: "no elevation data" } });
            continue;
          }
          results.push({
            desaId: batch[j].desaId,
            fields: [{ fieldKey: "topografi", value: this.classify(elevation) }],
            rawMeta: { elevationM: elevation, kodeDesa: batch[j].kodeDesa },
          });
        }
      } catch (err) {
        batch.forEach((d) =>
          results.push({ desaId: d.desaId, fields: [], rawMeta: { note: String(err) } }),
        );
      }
    }

    return {
      adapterId: this.id,
      sourceCode: this.sourceCode,
      fetchedAt: new Date(),
      results,
    };
  }
}
