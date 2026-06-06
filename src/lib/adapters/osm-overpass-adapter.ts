import type { DataAdapter } from "./adapter-base";
import type { AdapterContext, AdapterDesaResult, AdapterRunResult } from "./types";

const OVERPASS_URL = "https://overpass-api.de/api/interpreter";
const USER_AGENT = "PantauDesa/1.0 (data ingestion; +https://pantaudesa.id)";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

interface OverpassElement {
  type: string;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

/** Normalize kode wilayah "32.04.05.2001" → "3204052001" (matches Desa.kodeDesa). */
function normalizeRef(ref: string): string {
  return ref.replace(/\./g, "");
}

async function overpassPost(query: string): Promise<OverpassElement[]> {
  const res = await fetch(OVERPASS_URL, {
    method: "POST",
    headers: { "User-Agent": USER_AGENT, "Content-Type": "text/plain" },
    body: query,
    signal: AbortSignal.timeout(55000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = (await res.json()) as { elements?: OverpassElement[] };
  return json.elements ?? [];
}

function extractCoords(el: OverpassElement): { lat: number; lng: number } | null {
  const lat = el.lat ?? el.center?.lat;
  const lng = el.lon ?? el.center?.lon;
  return typeof lat === "number" && typeof lng === "number" ? { lat, lng } : null;
}

/**
 * OSM Overpass adapter — resolves desa coordinates.
 *
 * Strategy: BATCH per kabupaten (one query fetches ALL village nodes for the
 * kabupaten area). Match by kode wilayah (OSM `ref` tag) first, then by name.
 * This replaces N per-desa queries with 1 per-kabupaten → ~10x faster.
 * Falls back to a per-desa query for any desa that didn't match the batch.
 */
export class OSMOverpassAdapter implements DataAdapter {
  readonly id = "osm-overpass";
  readonly sourceCode = "OSM";
  readonly label = "OpenStreetMap (Overpass) — kabupaten batch";

  private normalizeKab(kab: string): string {
    return /^(kabupaten|kota)\b/i.test(kab.trim()) ? kab.trim() : `Kabupaten ${kab.trim()}`;
  }

  /** Batch query: all village/hamlet nodes + admin_level=7 relations in a kabupaten. */
  private batchQuery(kab: string): string {
    const esc = (s: string) => s.replace(/"/g, '\\"');
    return `[out:json][timeout:50];
area["admin_level"="5"]["name"="${esc(kab)}"]->.k;
(
  node["place"~"village|hamlet"](area.k);
  relation["boundary"="administrative"]["admin_level"="7"](area.k);
  way["boundary"="administrative"]["admin_level"="7"](area.k);
);
out center tags 600;`;
  }

  /** Per-desa fallback query (original approach). */
  private singleQuery(nama: string, kab: string): string {
    const esc = (s: string) => s.replace(/"/g, '\\"');
    return `[out:json][timeout:25];
area["admin_level"="5"]["name"="${esc(kab)}"]->.k;
(
  node["place"~"village|hamlet"]["name"="${esc(nama)}"](area.k);
  relation["boundary"="administrative"]["admin_level"="7"]["name"="${esc(nama)}"](area.k);
  way["boundary"="administrative"]["admin_level"="7"]["name"="${esc(nama)}"](area.k);
);
out center tags 5;`;
  }

  async run(context: AdapterContext): Promise<AdapterRunResult> {
    const results: AdapterDesaResult[] = [];

    // Group desas by kabupaten for batch queries.
    const byKab = new Map<string, typeof context.desas>();
    for (const d of context.desas) {
      const key = this.normalizeKab(d.kabupaten);
      if (!byKab.has(key)) byKab.set(key, []);
      byKab.get(key)!.push(d);
    }

    for (const [kab, desas] of byKab) {
      // ── Batch fetch ────────────────────────────────────────────────────────
      let batchEls: OverpassElement[] = [];
      try {
        batchEls = await overpassPost(this.batchQuery(kab));
        await sleep(2000); // polite pause after a heavy kabupaten query
      } catch {
        batchEls = [];
      }

      // Build lookup maps from the batch result.
      // 1. By normalised OSM ref tag  (e.g. "3204052001")  → most reliable
      // 2. By UPPERCASE name          (e.g. "CILEUNYI KULON") → fallback
      const byRef = new Map<string, OverpassElement>();
      const byName = new Map<string, OverpassElement>();
      for (const el of batchEls) {
        const c = extractCoords(el);
        if (!c) continue;
        if (el.tags?.ref) {
          const ref = normalizeRef(el.tags.ref);
          if (!byRef.has(ref)) byRef.set(ref, el);
        }
        if (el.tags?.name) {
          const key = el.tags.name.trim().toUpperCase();
          // Prefer place=village over hamlet, and nodes over relations.
          const prev = byName.get(key);
          const betterType = !prev || (el.tags?.place === "village" && prev.tags?.place !== "village");
          if (betterType) byName.set(key, el);
        }
      }

      // ── Match each desa ────────────────────────────────────────────────────
      const unmatched: typeof desas = [];
      for (const d of desas) {
        // Try ref first, then name.
        const byRefEl = d.kodeDesa ? byRef.get(d.kodeDesa) : undefined;
        const byNameEl = byName.get(d.nama.trim().toUpperCase());
        const el = byRefEl ?? byNameEl;

        if (el) {
          const c = extractCoords(el)!;
          results.push({
            desaId: d.desaId,
            fields: [{ fieldKey: "geoLat", value: c.lat }, { fieldKey: "geoLng", value: c.lng }],
            rawMeta: { via: "batch", osmType: el.type, name: el.tags?.name, ref: el.tags?.ref },
          });
        } else {
          unmatched.push(d);
        }
      }

      // ── Fallback: per-desa queries for anything the batch missed ───────────
      for (const d of unmatched) {
        try {
          const els = await overpassPost(this.singleQuery(d.nama, kab));
          await sleep(1100);
          const node = els.find((e) => e.type === "node" && e.tags?.place) ?? els[0];
          const c = node ? extractCoords(node) : null;
          if (c) {
            results.push({
              desaId: d.desaId,
              fields: [{ fieldKey: "geoLat", value: c.lat }, { fieldKey: "geoLng", value: c.lng }],
              rawMeta: { via: "fallback", osmType: node?.type, name: node?.tags?.name },
            });
          } else {
            results.push({ desaId: d.desaId, fields: [], rawMeta: { note: "no node (batch+fallback)", nama: d.nama } });
          }
        } catch (error) {
          results.push({ desaId: d.desaId, fields: [], rawMeta: { error: error instanceof Error ? error.message : String(error) } });
        }
      }
    }

    return { adapterId: this.id, sourceCode: this.sourceCode, fetchedAt: new Date(), results };
  }
}
