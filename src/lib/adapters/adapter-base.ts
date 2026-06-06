import type { AdapterContext, AdapterRunResult } from "./types";

/**
 * Contract every data adapter implements.
 *
 * - `id`         : stable adapter identifier, e.g. "osm-nominatim".
 * - `sourceCode` : the DataSource registry code this adapter feeds (= DataSource.id),
 *                  e.g. "OSM", "IDM", "DJPK-PMK". Used as DataDesa.sourceId.
 * - `run`        : fetch + parse, returning per-desa fieldKey→value outputs.
 *                  Adapters MUST NOT touch the DB — persistence is the runner's job.
 */
export interface DataAdapter {
  readonly id: string;
  readonly sourceCode: string;
  readonly label: string;
  run(context: AdapterContext): Promise<AdapterRunResult>;
}
