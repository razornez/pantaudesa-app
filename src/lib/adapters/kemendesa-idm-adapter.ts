import type { DataAdapter } from "./adapter-base";
import type { AdapterContext, AdapterDesaResult, AdapterRunResult } from "./types";

const BASE = "https://idm.kemendesa.go.id";
const UA = "PantauDesa/1.0 (data ingestion; +https://pantaudesa.id)";
const IDM_YEAR = "2024";

/**
 * IDM (Indeks Desa Membangun) adapter — scrapes the Kemendesa IDM portal's
 * per-desa recommendation page for STATUS IDM and NILAI IDM.
 *
 * Source: GET /open/api/desa/rekomendasi/{kodeDesa}/{tahun}
 * Requires: desa.kodeDesa (BPS 10-digit code, e.g. "3204052001")
 * Writes: kategori (e.g. "MANDIRI"), idmScore (e.g. 0.8822)
 *
 * 270 desa batches in concurrent groups of 8 — ~35s total for Kabupaten Bandung.
 */
export class KemendesaIdmAdapter implements DataAdapter {
  readonly id = "kemendesa-idm";
  readonly sourceCode = "IDM";
  readonly label = "IDM Indeks Desa Membangun (Kemendesa)";

  private async fetchHtml(kodeDesa: string): Promise<string | null> {
    try {
      const url = `${BASE}/open/api/desa/rekomendasi/${kodeDesa}/${IDM_YEAR}`;
      const r = await fetch(url, {
        headers: { "User-Agent": UA },
        signal: AbortSignal.timeout(20000),
      });
      if (!r.ok) return null;
      return await r.text();
    } catch {
      return null;
    }
  }

  private parse(html: string): {
    kategori: string | null;
    idmScore: number | null;
    idmIks: number | null;
    idmIke: number | null;
    idmIkl: number | null;
  } {
    // HTML fragment has table rows like:
    //   <td>STATUS IDM</td><td>: MANDIRI</td>
    //   <td>NILAI IDM</td><td>: 0.8822</td>
    // Sub-indices are in JS pie chart data:
    //   {"series": "IKS", "point": 0.880}, {"series": "IKE", ...}, {"series": "IKL", ...}
    const statusM = html.match(/STATUS IDM<\/td>\s*<td>\s*:\s*([A-Z_]+)/i);
    const nilaiM = html.match(/NILAI IDM<\/td>\s*<td>\s*:\s*([\d.]+)/i);
    const iksM = html.match(/"series"\s*:\s*"IKS"\s*,\s*"point"\s*:\s*([\d.]+)/i);
    const ikeM = html.match(/"series"\s*:\s*"IKE"\s*,\s*"point"\s*:\s*([\d.]+)/i);
    const iklM = html.match(/"series"\s*:\s*"IKL"\s*,\s*"point"\s*:\s*([\d.]+)/i);

    const raw = statusM?.[1]?.trim() ?? null;
    const kategori = raw ? raw.replace(/_/g, " ") : null;
    const parseNum = (m: RegExpMatchArray | null) => {
      const v = m ? parseFloat(m[1]) : null;
      return v !== null && Number.isFinite(v) ? v : null;
    };

    return {
      kategori: kategori && kategori.length > 2 ? kategori : null,
      idmScore: parseNum(nilaiM),
      idmIks: parseNum(iksM),
      idmIke: parseNum(ikeM),
      idmIkl: parseNum(iklM),
    };
  }

  private async scrapeOne(d: AdapterContext["desas"][number]): Promise<AdapterDesaResult> {
    if (!d.kodeDesa) {
      return { desaId: d.desaId, fields: [], rawMeta: { note: "no kodeDesa" } };
    }

    const html = await this.fetchHtml(d.kodeDesa);
    if (!html) {
      return { desaId: d.desaId, fields: [], rawMeta: { note: "fetch failed", kodeDesa: d.kodeDesa } };
    }

    const { kategori, idmScore, idmIks, idmIke, idmIkl } = this.parse(html);
    const fields = [];
    if (kategori) fields.push({ fieldKey: "kategori", value: kategori });
    if (idmScore !== null) fields.push({ fieldKey: "idmScore", value: idmScore });
    if (idmIks !== null) fields.push({ fieldKey: "idmIks", value: idmIks });
    if (idmIke !== null) fields.push({ fieldKey: "idmIke", value: idmIke });
    if (idmIkl !== null) fields.push({ fieldKey: "idmIkl", value: idmIkl });

    return fields.length > 0
      ? { desaId: d.desaId, fields, rawMeta: { kodeDesa: d.kodeDesa, tahun: IDM_YEAR } }
      : { desaId: d.desaId, fields: [], rawMeta: { note: "not found in IDM", kodeDesa: d.kodeDesa } };
  }

  async run(context: AdapterContext): Promise<AdapterRunResult> {
    const results: AdapterDesaResult[] = [];
    const BATCH = 8;

    for (let i = 0; i < context.desas.length; i += BATCH) {
      const batch = context.desas.slice(i, i + BATCH);
      const batchResults = await Promise.all(batch.map((d) => this.scrapeOne(d)));
      results.push(...batchResults);
    }

    return { adapterId: this.id, sourceCode: this.sourceCode, fetchedAt: new Date(), results };
  }
}
