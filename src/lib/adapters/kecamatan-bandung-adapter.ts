import type { DataAdapter } from "./adapter-base";
import type { AdapterContext, AdapterDesaResult, AdapterFieldOutput, AdapterRunResult } from "./types";

const UA = "PantauDesa/1.0 (data ingestion; +https://pantaudesa.id)";

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

/** Kebab-slug: "Cileunyi Kulon" → "cileunyi-kulon" */
function slug(s: string): string {
  return s.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

async function fetchText(url: string): Promise<string | null> {
  try {
    // Node 20 global fetch does not support rejectUnauthorized, so we use
    // node-fetch via a dynamic require with an https Agent to bypass the
    // government sites' expired/self-signed TLS certs (public info only).
    // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-explicit-any
    const nodeFetch = require("node-fetch") as any;
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const https = require("node:https");
    const agent = new https.Agent({ rejectUnauthorized: false });
    const r = await nodeFetch(url, { headers: { "User-Agent": UA }, agent, signal: AbortSignal.timeout(18000) });
    if (!r.ok) return null;
    return await r.text();
  } catch {
    return null;
  }
}

function parseDesaPage(html: string): { luasWilayah: number | null; websiteUrl: string | null } {
  // Luas pattern: "(\d+[.,]\d+)\s*(?:Km|km)" appears right after "Luas Wilayah (km 2)"
  const luasMatch = html.match(/(\d+[.,]\d+)\s*(?:Km|km)/i);
  const luas = luasMatch ? parseFloat(luasMatch[1].replace(",", ".")) : null;

  // Website: first href pointing to a .desa.id domain
  const webMatch = html.match(/href=["']([^"']*\.desa\.id[^"']*)['"]/i);
  const websiteUrl = webMatch ? webMatch[1].split(/['"]/)[0] : null;

  return { luasWilayah: luas, websiteUrl };
}

/** Known kecamatan URL slugs for Kabupaten Bandung (all match `kecamatan{slug}.bandungkab.go.id`). */
const KEC_SLUGS: Record<string, string> = {
  Arjasari: "arjasari", Banjaran: "banjaran", Pangalengan: "pangalengan", Cicalengka: "cicalengka",
  Majalaya: "majalaya", Soreang: "soreang", Ciparay: "ciparay", Dayeuhkolot: "dayeuhkolot",
  Cileunyi: "cileunyi", Rancaekek: "rancaekek", Ciwidey: "ciwidey", Paseh: "paseh",
  Ibun: "ibun", Kutawaringin: "kutawaringin", Margahayu: "margahayu", Margaasih: "margaasih",
  Katapang: "katapang", Pacet: "pacet", Kertasari: "kertasari", Baleendah: "baleendah",
  Solokanjeruk: "solokanjeruk", Nagreg: "nagreg", Cikancung: "cikancung", Cimaung: "cimaung",
  Pameungpeuk: "pameungpeuk", Pasirjambu: "pasirjambu", Rancabali: "rancabali",
  Cangkuang: "cangkuang", Bojongsoang: "bojongsoang", Cilengkrang: "cilengkrang",
  Cimenyan: "cimenyan",
};

/**
 * KecamatanBandungAdapter — scrapes each desa's profile page on the official
 * kecamatan website (kecamatan{kec}.bandungkab.go.id/desa/desa-{slug}).
 * Extracts: luasWilayah (km²) + the official desa websiteUrl.
 * Bypasses the self-signed/expired gov TLS cert (public info, no secrets sent).
 * Writes fieldKey: luasWilayah. Also updates Desa.websiteUrl in the DB for
 * desa that have a confirmed official site (run once; idempotent).
 */
export class KecamatanBandungAdapter implements DataAdapter {
  readonly id = "kecamatan-bandung";
  readonly sourceCode = "KECAMATAN-BDG";
  readonly label = "Kecamatan Kabupaten Bandung (profil desa resmi)";

  // DB handle injected by the runner for the websiteUrl side-effect update.
  private db: import("@/generated/prisma").PrismaClient | null = null;

  setDb(db: import("@/generated/prisma").PrismaClient | null) {
    this.db = db;
  }

  async run(context: AdapterContext): Promise<AdapterRunResult> {
    const results: AdapterDesaResult[] = [];

    // Group desas by kecamatan so we can hit each kecamatan site minimally.
    const byKec = new Map<string, typeof context.desas>();
    for (const d of context.desas) {
      const key = d.kecamatan;
      if (!byKec.has(key)) byKec.set(key, []);
      byKec.get(key)!.push(d);
    }

    for (const [kecamatan, desas] of byKec) {
      const kecSlug = KEC_SLUGS[kecamatan];
      if (!kecSlug) {
        for (const d of desas) results.push({ desaId: d.desaId, fields: [], rawMeta: { note: "kec slug unknown", kecamatan } });
        continue;
      }
      const base = `https://kecamatan${kecSlug}.bandungkab.go.id`;

      for (const d of desas) {
        const desaSlug = slug(d.nama);
        const url = `${base}/desa/desa-${desaSlug}`;
        const html = await fetchText(url);
        await sleep(300);

        if (!html) {
          results.push({ desaId: d.desaId, fields: [], rawMeta: { note: "page not found", url } });
          continue;
        }

        const { luasWilayah, websiteUrl } = parseDesaPage(html);
        const fields: AdapterFieldOutput[] = [];
        if (luasWilayah !== null && luasWilayah > 0) fields.push({ fieldKey: "luasWilayah", value: luasWilayah });

        // Side-effect: persist discovered websiteUrl back to the Desa row so
        // subsequent OpenSID runs use the authoritative URL instead of guessing.
        if (websiteUrl && this.db) {
          try {
            await this.db.desa.update({ where: { id: d.desaId }, data: { websiteUrl } });
          } catch {
            // non-fatal; ingestion continues
          }
        }

        if (fields.length > 0) {
          results.push({ desaId: d.desaId, fields, rawMeta: { url, luasWilayah, websiteUrl } });
        } else {
          results.push({ desaId: d.desaId, fields: [], rawMeta: { note: "nothing parsed", url, websiteUrl } });
        }
      }
    }

    return { adapterId: this.id, sourceCode: this.sourceCode, fetchedAt: new Date(), results };
  }
}
