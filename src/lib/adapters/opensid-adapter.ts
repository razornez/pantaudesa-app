import type { DataAdapter } from "./adapter-base";
import type { AdapterContext, AdapterDesaResult, AdapterFieldOutput, AdapterRunResult } from "./types";

const UA = "PantauDesa/1.0 (data ingestion; +https://pantaudesa.id)";

function slugDesaId(nama: string): string {
  return nama.trim().toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function stripTags(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, "|")
    .replace(/\|+/g, "|")
    .replace(/\s+/g, " ");
}

function toInt(s: string): number {
  return parseInt(s.replace(/[.,]/g, ""), 10);
}

/**
 * OpenSID adapter — scrapes a desa's OWN official website (OpenSID, the
 * open-source village info system used by thousands of desa.id sites) for real
 * demographic data. Highest trust per-desa: it's the village's official source.
 * Writes fieldKey: jumlahPenduduk (from the jenis-kelamin statistik table).
 */
export class OpenSIDAdapter implements DataAdapter {
  readonly id = "opensid";
  readonly sourceCode = "DESA-WEB";
  readonly label = "Website Resmi Desa (OpenSID)";

  private async fetchText(url: string): Promise<string | null> {
    try {
      const r = await fetch(url, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(35000) });
      if (!r.ok) return null;
      return await r.text();
    } catch {
      return null;
    }
  }

  private titleCase(s: string): string {
    return s.trim().toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
  }

  /**
   * Kepala Desa from the OpenSID homepage `var config = {...}` JS object.
   * This is the most reliable source — it’s OpenSID’s own DB field (`nama_kepala_desa`)
   * served directly into the page as structured JSON, not scraped from visible text.
   */
  private parseKadesFromConfig(home: string): string | null {
    // OpenSID embeds: var config = {"nama_kepala_desa":"...", ...};
    const m = home.match(/var\s+config\s*=\s*(\{[\s\S]*?\});/);
    if (!m) return null;
    try {
      const cfg = JSON.parse(m[1]) as Record<string, unknown>;
      const raw = typeof cfg.nama_kepala_desa === "string" ? cfg.nama_kepala_desa.trim() : null;
      if (!raw || raw.length < 3) return null;
      // Strip leading honorifics (Pj., H., Hj., Dr., Drs., etc.) and trailing degrees (S.E., S.T., M.M., etc.)
      let cleaned = raw
        .replace(/^(?:Pj\.|Plt\.|H\.|Hj\.|Dr\.|Drs\.|Ir\.)\s*/i, "")
        .replace(/,?\s*[A-Z][A-Za-z.]{1,6}(,\s*[A-Z][A-Za-z.]{1,6})*\.?\s*$/, "")
        .trim();
      return cleaned.length >= 3 ? this.titleCase(cleaned) : null;
    } catch {
      return null;
    }
  }

  /**
   * Kepala Desa name from visible homepage text — fallback only.
   * Only handles Pattern A ("Kepala Desa: NAME") since Pattern B (name before label)
   * is too noisy (article alt-text, nav items, etc. frequently match).
   */
  private parseKepalaDesa(home: string): string | null {
    // Strip image tags entirely first — alt text is a major noise source.
    const text = home
      .replace(/<img[^>]*>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ");

    // Pattern A only: "Kepala Desa[:] NAME" — reliable, name follows the label.
    for (const m of text.matchAll(/Kepala Desa\s*[:\-]?\s+((?:[A-Z][A-Za-z.’’]*,?\s*){2,5})/g)) {
      const r = this.finalizeName(m[1]);
      if (r) return r;
    }
    return null;
  }

  // Shared validation: trim stop-words, validate word shapes, return title-cased name.
  private finalizeName(raw: string): string | null {
    const STOP =
      /^(pemerintah|desa|kecamatan|kabupaten|provinsi|kantor|jabatan|nama|nip|status|hadir|belum|rekam|kehadiran|login|beranda|profil|profile|publikasi|galeri|berita|sambutan|selamat|datang|website|sekretaris|kasi|kasie|kaur|kadus|dusun|kepala|bapak|ibu|bpk|administrator|aparatur|panitia|pemilih|camat|terpilih|pendamping|calon|data|tetap|pilkades|sebagai|pemilihan|rapat|koordinasi|kunjungan|belajar|perpanjangan|masa|lakukan|kegiatan|settings|admin|berita|galeri|agenda|pengumuman|sosialisasi|musyawarah)$/i;
    const JUNK =
      /\b(data|pemilih|panitia|aparatur|camat|terpilih|kecamatan|kabupaten|administrator|rapat|koordinasi|kunjungan|belajar|perpanjangan|lakukan|kegiatan|settings|admin|berita|galeri|agenda|pengumuman|sosialisasi|musyawarah)\b/i;
    if (JUNK.test(raw)) return null;
    const ws = raw.trim().split(/\s+/).filter(Boolean);
    while (ws.length && STOP.test(ws[0].replace(/[.,]/g, ""))) ws.shift();
    while (ws.length && STOP.test(ws[ws.length - 1].replace(/[.,]/g, ""))) ws.pop();
    if (ws.length < 2 || ws.length > 5) return null;
    if (!ws.every((w) => /^[A-Z][A-Za-z.’’]*,?$/.test(w))) return null;
    const name = ws.join(" ").replace(/,\s*[A-Z][A-Za-z.]{0,4}\.?,?$/, "").replace(/,$/, "").trim();
    return name.split(/\s+/).length >= 2 ? this.titleCase(name) : null;
  }

  /** Top actual occupation from /data-statistik/pekerjaan, skipping non-job categories. */
  private parseDominantJob(html: string): string | null {
    const NON_JOB = /belum|tidak bekerja|mengurus rumah|pelajar|mahasiswa|pensiun|lainnya|^-$/i;
    const rows = [...html.replace(/<script[\s\S]*?<\/script>/gi, "").matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)].map(
      (m) => m[1].replace(/<[^>]+>/g, "|").replace(/\|+/g, "|").replace(/\s+/g, " ").trim(),
    );
    let best: { label: string; count: number } | null = null;
    for (const r of rows) {
      const cells = r.split("|").map((c) => c.trim()).filter(Boolean);
      // shape: No | LABEL | count | % | ...
      const label = cells[1];
      const count = cells[2] ? toInt(cells[2]) : NaN;
      if (!label || !Number.isFinite(count) || count <= 0) continue;
      // Reject junk cells (e.g. ":" or numeric-only) — require a real word label.
      const letters = (label.match(/[A-Za-z]/g) ?? []).length;
      if (letters < 4 || letters < label.replace(/\s/g, "").length * 0.6) continue;
      if (/jumlah|total|kode|kelompok|pekerjaan/i.test(label)) continue;
      if (NON_JOB.test(label)) continue;
      if (!best || count > best.count) best = { label, count };
    }
    return best ? this.titleCase(best.label) : null;
  }

  /** Parse OpenSID /data-wilayah table → counts of dusun/RW/RT + total KK (dusun-level sum). */
  private parseWilayah(html: string): { dusun: number; rw: number; rt: number; kk: number } | null {
    const rows = [...html.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)].map((m) =>
      m[1].replace(/<[^>]+>/g, "|").replace(/\|+/g, "|").replace(/\s+/g, " "),
    );
    let dusun = 0;
    let rw = 0;
    let rt = 0;
    let kk = 0;
    for (const row of rows) {
      const cells = row.split("|").map((c) => c.trim()).filter(Boolean);
      const labelIdx = cells.findIndex((c) => /^(Dusun|RW|RT)\b/i.test(c));
      if (labelIdx < 0) continue;
      const label = cells[labelIdx];
      const numAfter = cells.slice(labelIdx + 1).find((c) => /^\d[\d.,]*$/.test(c));
      const kkVal = numAfter ? toInt(numAfter) : 0;
      // An unconfigured "Dusun NAMA DUSUN" stub still carries its KK in the official
      // total, so sum its KK but DON'T count it as a named dusun.
      const isPlaceholderDusun = /nama dusun|\bcontoh\b|^dusun\s*$/i.test(label);
      if (/^Dusun\b/i.test(label)) {
        if (!isPlaceholderDusun) dusun += 1;
        kk += kkVal; // dusun-level KK already sums its RW/RT (incl. placeholder)
      } else if (/^RW\b/i.test(label)) {
        rw += 1;
      } else if (/^RT\b/i.test(label)) {
        rt += 1;
      }
    }
    return dusun + rw + rt > 0 ? { dusun, rw, rt, kk } : null;
  }

  /** Scrape all data for one desa — called concurrently per batch. */
  private async scrapeOne(d: AdapterContext["desas"][number]): Promise<AdapterDesaResult> {
    const base = d.website?.replace(/\/+$/, "") ?? `https://${slugDesaId(d.nama)}.desa.id`;
    const fields: AdapterFieldOutput[] = [];

    // All sources are INDEPENDENT — failure on one never short-circuits the rest.
    // NOTE: /data-statistik/pendidikan was removed — OpenSID loads education data
    // via AJAX (JavaScript-rendered), so static HTML scraping yields no content.
    const [html, wilHtml, home, pek] = await Promise.all([
      this.fetchText(`${base}/data-statistik/jenis-kelamin`),
      this.fetchText(`${base}/data-wilayah`),
      this.fetchText(`${base}/`),
      this.fetchText(`${base}/data-statistik/pekerjaan`),
    ]);

    let total = NaN;
    if (html) {
      const m = stripTags(html).match(/\b(?:JUMLAH|TOTAL)\b[^\d]{0,6}(\d[\d.,]{2,})/i);
      total = m ? toInt(m[1]) : NaN;
      // Reject unrealistic values — Indonesian desa rarely exceed 30,000 jiwa.
      // Values >50,000 indicate the parser captured a kecamatan/kabupaten total.
      if (Number.isFinite(total) && total > 0 && total <= 50000) fields.push({ fieldKey: "jumlahPenduduk", value: total });
    }

    const wil = wilHtml ? this.parseWilayah(wilHtml) : null;
    if (wil) {
      if (wil.dusun > 0) fields.push({ fieldKey: "jumlahDusun", value: wil.dusun });
      if (wil.rw > 0) fields.push({ fieldKey: "jumlahRw", value: wil.rw });
      if (wil.rt > 0) fields.push({ fieldKey: "jumlahRt", value: wil.rt });
      if (wil.kk > 0) fields.push({ fieldKey: "jumlahKK", value: wil.kk });
    }

    // Kepala desa: JS config object is most reliable (direct DB field).
    // Fall back to visible text on homepage — only Pattern A (label → name).
    let kades =
      (home ? this.parseKadesFromConfig(home) : null) ??
      (home ? this.parseKepalaDesa(home) : null);
    if (kades) {
      // Strip desa name prefix if Pattern A accidentally captured it (e.g. "Sukaluyu, Dadang Kurniawan").
      const desaPrefix = new RegExp(`^${d.nama.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")},?\\s*`, "i");
      kades = kades.replace(desaPrefix, "").trim();
      if (kades.split(/\s+/).length >= 2) fields.push({ fieldKey: "kepalaDesa", value: kades });
    }

    const job = pek ? this.parseDominantJob(pek) : null;
    if (job) fields.push({ fieldKey: "mataPencaharian", value: job });

    return fields.length > 0
      ? { desaId: d.desaId, fields, rawMeta: { base, total, wilayah: wil } }
      : { desaId: d.desaId, fields: [], rawMeta: { note: "nothing parsed", base } };
  }

  async run(context: AdapterContext): Promise<AdapterRunResult> {
    const results: AdapterDesaResult[] = [];

    // Process in concurrent batches of 5 — ~5x faster than sequential while
    // staying polite (each desa hits its own domain, not the same server).
    const BATCH = 5;
    for (let i = 0; i < context.desas.length; i += BATCH) {
      const batch = context.desas.slice(i, i + BATCH);
      const batchResults = await Promise.all(batch.map((d) => this.scrapeOne(d)));
      results.push(...batchResults);
    }

    return { adapterId: this.id, sourceCode: this.sourceCode, fetchedAt: new Date(), results };
  }
}
