# Berkontribusi ke PantauDesa

Terima kasih sudah mau ikut membangun transparansi anggaran desa! 🙏

## Cara berkontribusi

- 🐛 **Bug** — buka [issue](../../issues) dengan langkah reproduksi yang jelas.
- 💡 **Ide/fitur** — buka issue diskusi dulu sebelum bikin PR besar.
- 📊 **Data desa** — lihat ide sumber data baru / koreksi data.
- 🔧 **Kode** — perbaikan bug, peningkatan UI/UX, performa, test.

## Setup lokal

Lihat **[README › Menjalankan secara lokal](README.md#-menjalankan-secara-lokal)**. Ringkasnya:

```bash
npm install
cp .env.example .env.local   # isi DATABASE_URL, DIRECT_URL, AUTH_SECRET
npm run db:push
npm run dev
```

## Alur Pull Request

1. **Fork** repo & buat branch dari `main`: `git checkout -b fix/nama-singkat`.
2. Buat perubahan yang fokus & kecil (satu PR = satu tujuan).
3. Pastikan semua **gate lulus** sebelum push:
   ```bash
   npx tsc --noEmit      # tidak ada error TypeScript
   npm run lint          # tidak ada error/warning lint
   npm run test          # semua test lulus
   npm run build         # production build sukses
   ```
4. Tulis pesan commit yang jelas (boleh Bahasa Indonesia atau Inggris). Format yang disukai: `tipe(scope): ringkasan` — mis. `fix(desa): perbaiki badge kelengkapan`.
5. Buka PR ke `main` dengan deskripsi: apa yang diubah, kenapa, dan cara mengetesnya.

## Standar kode

- **TypeScript strict** — tidak ada `any` yang tidak perlu, tidak ada `console.log` sampah, tidak ada TODO setengah jadi.
- **Jangan menampilkan data palsu sebagai fakta.** Setiap nilai data yang tampil ke warga harus punya sumber (provenance). Jangan menggelembungkan metrik (mis. skor kelengkapan).
- **Mobile-first.** Default satu kolom, lebar di `sm:` (640px) ke atas.
- **Back-office UI** mengikuti standar di [`docs/bmad/standards/back-office-ui-design-guidelines.md`](docs/bmad/standards/back-office-ui-design-guidelines.md). Engineering: [`docs/bmad/standards/nextjs-engineering-standard.md`](docs/bmad/standards/nextjs-engineering-standard.md).
- Jangan commit secret. Pakai env var (`.env.local`, tidak di-track). Lihat [`.env.example`](.env.example).

## Catatan teknis

- Next.js 16 App Router — beberapa API berbeda dari versi lama. Cek dokumentasi di `node_modules/next/dist/docs/` saat ragu (lihat [AGENTS.md](AGENTS.md)).
- Halaman publik memakai ISR (`revalidate`) + cache; hindari `force-dynamic` kecuali memang perlu.

## Lisensi kontribusi

Dengan mengirim PR, kamu setuju kontribusimu dilisensikan di bawah [MIT License](LICENSE).
