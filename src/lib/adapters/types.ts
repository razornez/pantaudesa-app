/**
 * Adapter layer types (BMAD-T-001-v2 ingestion).
 * Adapters fetch from a public source and emit per-desa fieldKey→value outputs.
 * The ingestion runner persists them into DataDesa / typed tables with source
 * attribution + lifecycle status, reusing the existing template runtime.
 */

export type AdapterFieldValue =
  | string
  | number
  | boolean
  | null
  | Record<string, unknown>
  | unknown[];

export interface AdapterFieldOutput {
  fieldKey: string;
  value: AdapterFieldValue;
}

export interface AdapterDesaResult {
  /** Desa primary key (prismaId) */
  desaId: string;
  fields: AdapterFieldOutput[];
  /** Optional raw payload kept for audit / DataSourceFetchRun.extractedMetaJson */
  rawMeta?: Record<string, unknown>;
}

export interface AdapterDesaDescriptor {
  /** Desa primary key (prismaId) */
  desaId: string;
  nama: string;
  kecamatan: string;
  kabupaten: string;
  provinsi: string;
  /** Official desa website (e.g. OpenSID at {slug}.desa.id), if known */
  website?: string;
  /** Official kode wilayah (e.g. "3204162003"), used for OSM ref-tag matching */
  kodeDesa?: string | null;
}

export interface AdapterContext {
  /** Desa to process, with the metadata adapters need to query their source. */
  desas: AdapterDesaDescriptor[];
}

export interface AdapterRunResult {
  adapterId: string;
  sourceCode: string;
  fetchedAt: Date;
  results: AdapterDesaResult[];
}

export interface IngestionSummary {
  adapterId: string;
  sourceCode: string;
  desaProcessed: number;
  fieldsUpdated: number;
  fieldsSkipped: number;
  errors: string[];
}
