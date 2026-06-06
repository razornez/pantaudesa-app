# Kebijakan Keamanan

## Melaporkan kerentanan

Jika kamu menemukan celah keamanan, **jangan buka issue publik**. Pelaporan publik bisa membahayakan pengguna sebelum perbaikan tersedia.

Laporkan secara privat melalui salah satu cara berikut:

- **GitHub Security Advisory** — tab **Security › Report a vulnerability** di repo ini (disarankan).
- **Email** — kirim ke maintainer (lihat kontak di profil repo / `CONTACT_EMAIL`).

Mohon sertakan:
- Deskripsi kerentanan & dampaknya.
- Langkah reproduksi (PoC bila ada).
- Versi/commit yang terdampak.

Kami berusaha merespons dalam waktu wajar dan akan mengabari perkembangan perbaikannya. Mohon beri waktu untuk memperbaiki sebelum mengungkap ke publik (responsible disclosure).

## Cakupan

Hal yang sangat kami perhatikan:
- Bocornya data pribadi pengguna (email, dll).
- Bypass autentikasi / otorisasi (mis. akses lintas-desa, IDOR).
- Eksekusi kode / injeksi (SQL, XSS).
- Pengungkapan secret (kunci API, kredensial DB).

## Praktik keamanan proyek

- Semua secret lewat environment variable (`.env.local`, tidak di-track git). Lihat [`.env.example`](.env.example).
- `SUPABASE_SERVICE_ROLE_KEY` & koneksi DB hanya dipakai server-side.
- Endpoint mutasi memverifikasi kepemilikan (admin desa hanya bisa mengubah desanya sendiri).
- Endpoint publik (suara warga, kontribusi dokumen) di-rate-limit dan kontribusi tidak auto-publish (selalu lewat review).

Terima kasih sudah membantu menjaga keamanan PantauDesa. 🔒
