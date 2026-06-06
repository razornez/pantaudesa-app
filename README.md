# PantauDesa

**Platform transparansi anggaran desa** — bantu warga mencari, memahami, dan mengawasi penggunaan dana desa di seluruh Indonesia.

> Cari desamu. Lihat Dana Desa-nya. Awasi penggunaannya.

PantauDesa menerjemahkan data resmi desa (Dana Desa, lokasi, demografi, dokumen publik) menjadi informasi yang mudah dibaca warga — bukan bahasa birokrasi.

---

## ✨ Fitur

- **Beranda** — ringkasan nasional: total Dana Desa, sebaran kelengkapan data, desa terlengkap.
- **Daftar & pencarian desa** — 3.500+ desa, filter per provinsi/kabupaten/kecamatan + tingkat kelengkapan data.
- **Detail desa** — profil cinematic: Dana Desa, peta lokasi, demografi, sumber data, dokumen.
- **Bandingkan desa** — sandingkan dua desa (kelengkapan data, Dana Desa, penduduk).
- **Suara Warga** — warga berbagi kondisi desanya; admin desa bisa merespons.
- **Kontribusi publik** — pengunjung bisa kirim dokumen resmi untuk melengkapi data (masuk antrian review).
- **Portal Admin Desa** — perangkat desa klaim & kelola data desanya (alur verifikasi berjenjang).
- **Back-office internal** — antrian review klaim, dokumen, dan data desa.

Skor **kelengkapan data** dihitung jujur dari dimensi nyata yang benar-benar terisi (bukan angka serapan fiktif). Setiap nilai yang tampil punya **sumber** (provenance) yang tercatat.

---

## 🧱 Tech stack

- **Next.js 16** (App Router, Turbopack) · **React 19** · **TypeScript**
- **Tailwind CSS v4**
- **Prisma** + **PostgreSQL** (Supabase)
- **NextAuth (Auth.js v5)** — login PIN/OTP berbasis email
- **Recharts** · **Sentry** · **Resend** (email) · **Vitest** (test)
- Geocoding via **LocationIQ** (OpenStreetMap)

---

## 🚀 Menjalankan secara lokal

### Prasyarat
- Node.js 20+
- PostgreSQL (atau project Supabase gratis)

### Langkah

```bash
# 1. Clone & install
git clone https://github.com/<org>/pantaudesa.git
cd pantaudesa
npm install

# 2. Siapkan environment
cp .env.example .env.local
# isi minimal: DATABASE_URL, DIRECT_URL, AUTH_SECRET
#   (generate AUTH_SECRET: `npx auth secret` atau `openssl rand -base64 32`)

# 3. Siapkan database
npm run db:push          # buat skema
npm run db:seed          # (opsional) data contoh

# 4. Jalankan
npm run dev              # http://localhost:3000
```

### Variabel environment

Lihat [`.env.example`](.env.example) untuk daftar lengkap + keterangan. Yang **wajib** agar app jalan:

| Variabel | Fungsi |
|---|---|
| `DATABASE_URL` | Koneksi PostgreSQL (runtime) |
| `DIRECT_URL` | Koneksi langsung (migrasi/admin) |
| `AUTH_SECRET` | Secret NextAuth |

Yang **opsional** (mengaktifkan fitur tertentu): `RESEND_API_KEY` (email OTP), `NEXT_PUBLIC_SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` (upload dokumen), `LOCATIONIQ_KEY` (geocoding), `SENTRY_DSN` (error tracking).

---

## 🛠️ Skrip

```bash
npm run dev          # dev server (port 3000)
npm run build        # production build
npm run start        # jalankan hasil build
npm run lint         # eslint
npm run test         # vitest
npm run db:push      # sync skema Prisma ke DB
npm run db:studio    # Prisma Studio
npm run db:seed      # seed data contoh
```

---

## 🤝 Kontribusi

Kontribusi sangat diterima! Baca **[CONTRIBUTING.md](CONTRIBUTING.md)** untuk panduan setup, alur PR, dan standar kode. Lihat juga standar desain/engineering di [`docs/bmad/standards/`](docs/bmad/standards/).

Menemukan celah keamanan? Jangan buka issue publik — baca **[SECURITY.md](SECURITY.md)**.

---

## 📐 Prinsip produk

1. **Bahasa warga** — data dijelaskan dengan bahasa sehari-hari, bukan jargon.
2. **Jujur sebelum viral** — tegas, tetapi tidak menuduh tanpa dasar/sumber.
3. **Transparansi yang bisa ditindaklanjuti** — setiap data bantu warga tahu langkah berikutnya.
4. **Mobile-first** — mayoritas warga membuka dari HP/WhatsApp.
5. **Jelaskan angkanya** — jangan cuma tampilkan angka; jelaskan artinya + sumbernya.

---

## 📊 Catatan data

Data berasal dari sumber publik resmi (DJPK Kemenkeu untuk Dana Desa, OpenStreetMap untuk koordinat, situs resmi desa berbasis OpenSID untuk demografi). Setiap nilai menampilkan sumbernya. Cakupan data masih terus dilengkapi — sebagian field belum tersedia untuk semua desa.

---

## 📄 Lisensi

[MIT](LICENSE) © 2026 PantauDesa
