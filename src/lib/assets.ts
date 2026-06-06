/**
 * assets.ts — registry terpusat untuk semua aset gambar PantauDesa.
 * Untuk mengganti gambar, cukup ubah path di sini.
 */

export const ASSETS = {
  // ── Brand ────────────────────────────────────────────────────────────────
  logo:                    "/images/logo.webp",

  // ── Mascot ───────────────────────────────────────────────────────────────
  mascotStanding:          "/images/mascot-standing.webp",
  mascotEmpty:             "/images/mascot-empty.webp",

  // ── Hero & Texture ───────────────────────────────────────────────────────
  /** Pak Waspada + peta Indonesia — hero homepage */
  hero:                    "/images/hero.webp",
  /** Pattern desa (rumah, padi, gunung) — overlay pada dark header */
  textureDark:             "/images/texture-dark.webp",
  /** Pattern desa biru muda outline — overlay ringan pada light card */
  textureLight:            "/images/texture-light.webp",

  // ── Illustrations ────────────────────────────────────────────────────────
  /** Tiga warga lihat dashboard — CTA section homepage */
  illustrationCitizen:     "/images/illustration-citizen.webp",
  /** Desa bermasalah: jalan berlubang, posyandu mangkrak — alert section */
  illustrationAlert:       "/images/illustration-alert.webp",
  /** Folder terbuka + dokumen — tab dokumen */
  illustrationDocs:        "/images/illustration-docs.webp",
  /** Pemuda + clipboard checklist — SeharusnyaAda header */
  illustrationHakWarga:    "/images/illustration-hak-warga.webp",
  /** Warga + megafon + tangga eskalasi — TanggungJawab header */
  illustrationEskalasi:    "/images/illustration-eskalasi.webp",
  /** Desa maju 90%: posyandu, balai desa, lapangan — leaderboard */
  illustrationDesaBaik:    "/images/illustration-desa-baik.webp",
} as const;

export type AssetKey = keyof typeof ASSETS;
