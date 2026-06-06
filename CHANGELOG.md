# Changelog

Semua perubahan penting pada proyek PantauDesa didokumentasikan di sini.
Format mengikuti [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)

---

## [Unreleased]

> Fitur-fitur yang sedang dalam rencana atau pengerjaan.

- Suara warga: simpan ke database (sekarang masih data dummy di kode)
- Data desa: fetch dari database (sekarang masih data dummy)
- Upload avatar ke cloud storage (Supabase Storage / Cloudinary)
- Peta choropleth interaktif Indonesia (drill-down provinsi → kabupaten → desa)
- Follow desa / warga lain + feed aktivitas
- Search profil warga
- Sistem laporan konten (flag suara palsu)

---

## [2.0.0] — 2026-04-25

### Backend — Database, Autentikasi, dan API

Ini adalah versi terbesar sejak pertama kali project dibuat. Sebelum versi ini, PantauDesa hanya berjalan dengan data palsu (dummy) di dalam kode — tidak ada database, tidak ada akun nyata, tidak ada email yang dikirim. Di versi ini, fondasi backend yang sesungguhnya dibangun.

---

#### 🗄️ Database — Supabase + Prisma

**Apa yang berubah:**  
Data user sekarang disimpan di database sungguhan, bukan di memori kode.

**Teknologi yang dipakai:**
- **Supabase** — layanan database PostgreSQL berbasis cloud. PostgreSQL adalah jenis database yang sangat populer dan andal, dipakai oleh perusahaan besar. Supabase menyediakan database ini secara gratis untuk skala kecil-menengah, lengkap dengan dashboard visual untuk melihat data.
- **Prisma** — alat bantu yang menghubungkan kode Next.js ke database. Prisma memastikan struktur data selalu sesuai antara kode dan database, dan mencegah banyak bug umum.

**Tabel yang dibuat di database:**

| Tabel | Isi |
|-------|-----|
| `users` | Data pengguna: nama, username, email, bio, foto profil, role (WARGA/DESA/ADMIN) |
| `accounts` | Menghubungkan akun user dengan provider login (email magic link) |
| `sessions` | Sesi login aktif — siapa yang sedang login dan kapan sesinya berakhir |
| `verification_tokens` | Token sementara untuk verifikasi magic link |

**File baru:**
- `prisma/schema.prisma` — "blueprint" struktur database, tempat mendefinisikan tabel dan relasinya
- `src/lib/db.ts` — koneksi ke database yang dioptimalkan agar tidak membuka terlalu banyak koneksi sekaligus (penting untuk serverless seperti Vercel)

---

#### 🔐 Autentikasi — NextAuth v5 + Magic Link

**Apa yang berubah:**  
Sebelumnya login hanya simulasi — kode OTP muncul langsung di layar dan tidak ada email yang benar-benar dikirim. Sekarang login menggunakan sistem nyata.

**Cara kerjanya (Magic Link):**
1. User masukkan email di halaman `/login`
2. Sistem kirim email berisi tombol "Masuk ke PantauDesa" via **Resend**
3. User klik tombol di email → langsung masuk, tidak perlu password
4. Sesi login disimpan di database

**Kenapa Magic Link, bukan password?**  
Password bisa lupa, bisa bocor. Magic link lebih aman dan lebih mudah — user hanya butuh akses ke emailnya. Pola ini dipakai oleh Notion, Linear, dan banyak aplikasi modern.

**Teknologi yang dipakai:**
- **NextAuth v5 (Auth.js)** — library autentikasi standar industri untuk Next.js. Menangani semua hal kompleks: pembuatan sesi, keamanan token, redirect setelah login, dll.
- **Resend** — layanan pengiriman email khusus developer. Email dikirim dari domain `razornez.net` yang sudah terverifikasi. Gratis hingga 3.000 email/bulan.

**File baru:**
- `src/lib/auth.ts` — konfigurasi NextAuth: provider email Resend, adapter database Prisma, callback untuk menyimpan role user ke sesi
- `src/app/api/auth/[...nextauth]/route.ts` — endpoint API yang menangani semua request login (kirim email, verifikasi token, buat sesi)

---

#### 👤 API Pengguna

**Apa yang berubah:**  
Ada endpoint API nyata untuk membaca dan mengubah data pengguna, bukan lagi manipulasi state di browser.

**Endpoint yang dibuat:**

| Method | URL | Fungsi |
|--------|-----|--------|
| `GET` | `/api/users/me` | Ambil data profil pengguna yang sedang login |
| `PATCH` | `/api/users/me` | Update nama, bio, atau foto profil |
| `POST` | `/api/users/register` | Simpan username dan nama saat pertama kali daftar |

**Keamanan:** Semua endpoint dicek sesinya — jika tidak login, langsung ditolak dengan respons `401 Unauthorized`.

---

#### 🔄 Halaman yang Diperbarui

**`/login`**
- Sebelum: form palsu, kode OTP muncul di layar, tidak ada email terkirim
- Sesudah: kirim magic link nyata ke email user, tampilkan halaman konfirmasi "Cek emailmu!"

**`/login/verify`** *(halaman baru)*
- Ditampilkan setelah magic link terkirim
- Instruksi cek spam, tombol kembali jika email salah

**`/daftar`**
- Sebelum: 4 langkah dengan OTP palsu, data disimpan di browser saja
- Sesudah: 2 langkah — (1) isi nama/username/bio → disimpan ke database, (2) upload foto profil opsional
- Catatan: untuk daftar, user harus login dulu via magic link, lalu melengkapi profil

**`/profil/saya`** *(edit profil)*
- Sebelum: perubahan nama/bio hanya tersimpan di browser, hilang saat refresh
- Sesudah: perubahan dikirim ke `PATCH /api/users/me` dan tersimpan permanen di database

---

#### ⚙️ Konfigurasi Teknis

**Environment Variables** (disimpan di Vercel, tidak di-commit ke GitHub):
- `DATABASE_URL` — alamat koneksi ke Supabase (Transaction Pooler, cocok untuk serverless)
- `DIRECT_URL` — alamat koneksi langsung, dipakai saat menjalankan migrasi database
- `AUTH_SECRET` — kunci enkripsi sesi (string acak 32 karakter, dibuat otomatis)
- `NEXTAUTH_URL` — URL production aplikasi di Vercel
- `RESEND_API_KEY` — kunci API Resend untuk mengirim email
- `RESEND_FROM` — alamat pengirim email

**Catatan keamanan:** Semua nilai di atas bersifat rahasia dan tidak pernah masuk ke kode atau GitHub. File `.env.local` dan `.env` sudah ada di `.gitignore`.

---

#### 🔁 Migrasi Role Pengguna

Role pengguna diubah dari huruf kecil ke huruf kapital agar sesuai standar Prisma/database:

| Sebelum | Sesudah | Arti |
|---------|---------|------|
| `"warga"` | `"WARGA"` | Warga biasa |
| `"desa"` | `"DESA"` | Perangkat/admin desa |
| `"admin"` | `"ADMIN"` | Admin PantauDesa |

Semua halaman yang mengecek role (admin panel, dashboard desa, profil) sudah diperbarui.

---

#### ⚠️ Apa yang Belum Berubah

Data desa, suara warga, dan notifikasi masih menggunakan data dummy di kode (`src/lib/mock-data.ts`, `src/lib/citizen-voice.ts`). Ini disengaja — backend untuk data desa akan dikerjakan di fase berikutnya setelah fondasi user selesai.

---

## [1.1.0] — 2026-04-24

### `feat(ux): registrasi warga, panduan FAQ, bandingkan desa, SEO global & 404`

Commit: `c0ed0eb`

#### Ditambahkan

**`/daftar`** — Registrasi Warga 4 Langkah
- Step 1 "info": nama (auto-generate username slug dari nama), username (a-z0-9_, 3–20 karakter, read-only setelah isi), email, bio opsional
- Step 2 "otp": verifikasi kode OTP 6 digit
- Step 3 "avatar": upload foto profil opsional dengan preview (Camera overlay button)
- Step 4 "done": sukses + redirect ke /profil/saya
- `ProgressDots` component — 4 titik animasi step indicator

**`/panduan`** — Panduan & FAQ (Server Component, SEO-ready)
- 5 seksi accordion `<details>/<summary>`: Memulai, Anggaran Desa, Suara Warga, Hak & Kewajiban, Akun & Profil
- Quick-nav pills per seksi (jump link ke anchor `#id`)
- CTA bottom: Daftar Sekarang + Cari Desamu
- `Metadata` export untuk SEO (title, description)

**`/bandingkan`** — Perbandingan Desa Side-by-Side (Client Component)
- `DesaPicker` — search dropdown dengan filter, exclude pilihan lawan
- `CompRow` — row perbandingan dengan winner highlight (emerald bold)
- Dual progress bar serapan anggaran
- Tabel: total anggaran, terealisasi, %, penduduk, anggaran/jiwa, fokus, provinsi, skor transparansi
- Tren 3 tahun terakhir (per desa)
- Ketersediaan dokumen (APBDes, Realisasi, RKP, LKPD)
- CTA link ke profil masing-masing desa

**`/not-found`** — 404 Redesign
- Ikon peta 🗺️ dalam kotak gradient dengan badge "?" overlay
- Copy citizen-friendly: "Desa ini tidak ada di peta kami"
- Dua tombol aksi (Beranda + Cari Desa) + link bantuan ke /panduan

#### Diubah

**`src/app/layout.tsx`**
- Full SEO metadata: OpenGraph (website, id_ID, siteName), Twitter card (`summary_large_image`), keywords array, robots `{index: true, follow: true}`
- Title template `"%s — PantauDesa"`

**`src/app/login/page.tsx`**
- Link /daftar menggantikan mailto:; validasi pesan mismatch role lebih jelas

**`src/components/layout/Navbar.tsx`**
- navLinks diperluas ke 5: tambah "Bandingkan" (/bandingkan) dan "Panduan" (/panduan)

---

## [1.0.0] — 2026-04-24

### `feat(profil-warga): profil user, trust badge 5 level, history suara & notifikasi`

Commit: `409cc57`

#### Ditambahkan

**`/profil/[username]`** — Profil Publik Warga
- Cover gradient otomatis sesuai tier badge (slate → sky → amber → indigo → violet)
- Avatar dengan ring-4 putih + fallback inisial berwarna
- Nama, @username, bio, tanggal bergabung
- **4 stat pill**: Suara, Terbukti Benar, Berguna, Diselesaikan
- **Trust Progress Bar**:
  - 5 emoji icon tier (Pengamat 👁️ → Warga Aktif 🙋 → Suara Terpercaya ⭐ → Pahlawan Desa 🦸 → Pejuang Desa 🏆)
  - Bar progress warna per tier + skor saat ini + milestone berikutnya
- **Riwayat suara** sebagai mini card: kategori badge, status badge, desa, waktu, stat votes/helpful/replies
- Tombol "Edit Profil" hanya muncul untuk pemilik profil

**`/profil/saya`** — Halaman Edit Privat
- Tab **Profil / Suara / Notifikasi** dengan badge counter
- Tab Profil:
  - Avatar editor dengan overlay kamera + file input hidden
  - Input nama (editable), username (read-only dengan label jelas)
  - Bio 160 karakter
  - Trust Card: badge tier + deskripsi + progress bar + poin berikutnya
  - Simpan dengan loading state → update session di AuthContext
- Tab Suara: riwayat lengkap dengan status + stat inline + link ke halaman desa
- Tab Notifikasi: list notif (reply/vote/helpful/resolved), dot belum-dibaca, mark one/all read, empty state dengan BellOff icon

**`src/lib/user-profile.ts`** *(baru)*
- `UserBadge` type + `USER_BADGES` record (5 tier dengan label, emoji, warna, minScore)
- `computeTrustStats(username)` — hitung skor dari suara, votes, helpful, replies, resolved
- `getVoicesByAuthor(name)` — filter CitizenVoice by author name
- `UserNotification` type: id, type, voiceId, voiceText, fromName, isOfficial, message, createdAt, isRead
- `NOTIF_CONFIG` — icon & warna per tipe notifikasi
- `MOCK_NOTIFICATIONS` — notif realistis untuk Pak Muryanto & Ibu Sumarni
- `getNotifications(name)`, `getUnreadCount(name)`

**`src/components/user/UserAvatar.tsx`** *(baru)*
- Reusable dengan 4 size (sm/md/lg/xl)
- Fallback inisial + warna deterministik dari nama
- Support `avatarUrl` untuk gambar custom

**`src/components/user/BadgePill.tsx`** *(baru)*
- Variant `compact` (inline pill kecil) dan full (dengan deskripsi)

#### Diubah

**`src/lib/auth-mock.ts`**
- Role baru: `"warga"` (selain `"desa"` dan `"admin"`)
- `AuthUser` diperluas: `username` (unik, tidak bisa diubah), `bio?`, `joinedAt: Date`
- `MOCK_ACCOUNTS` — semua akun digabung, tambah 2 mock warga
- `getAccountByEmail()` sekarang mencari di `MOCK_ACCOUNTS` tunggal

**`src/lib/auth-context.tsx`**
- Tambah `revive()` untuk restore `Date` fields setelah `JSON.parse` dari sessionStorage

**`src/app/login/page.tsx`**
- **Tab switcher** Warga ↔ Desa/Admin di atas form
- Validasi role mismatch (warga email tidak bisa masuk lewat tab Desa)
- Demo email warga: pak.muryanto@gmail.com, ibu.sumarni@gmail.com

**`src/components/layout/Navbar.tsx`**
- Warga: avatar + nama depan, bell dengan badge unread count, link `/profil/saya`
- Desa/Admin: dashboard shortcut + logout (tidak berubah)
- Guest: tombol "Masuk" sederhana

---

## [0.9.0] — 2026-04-24
- Halaman `/panduan` — glossary dan FAQ keresahan warga
- Fitur "Bandingkan Desa" — perbandingan side-by-side 2–3 desa
- QR code per desa untuk transparansi offline-to-online
- Halaman `/cerita-data` — narasi investigatif berbasis data
- Backend nyata: Supabase Auth, PostgreSQL, S3 storage
- Integrasi data resmi: OMSPAN, SIPD, OpenData DJPK Kemenkeu
- Notifikasi push/email saat status dokumen berubah
- OTP via WhatsApp (Twilio/Fonnte) menggantikan simulasi

---

## [0.9.0] — 2026-04-24

### `feat(auth): portal login desa + dashboard desa + admin review panel`

Commit: `88908dd`

Implementasi sistem autentikasi dan manajemen konten desa — semuanya UI mockup siap-backend.
Login menggunakan **Email + OTP 6 digit** (no password) agar tidak ada credential yang bisa lupa atau lemah.

#### Ditambahkan

**`/login`** — Halaman Login Portal Desa
- Split layout: ilustrasi kiri (indigo gradient + feature list + mascot), form kanan
- **Flow 3 langkah**: email → OTP → success redirect
- OTP Input: 6 kotak terpisah, auto-focus, paste support (tempel langsung dari clipboard)
- Demo banner tampilkan kode OTP simulasi (mock email)
- Countdown resend 60 detik
- Redirect otomatis: role `desa` → `/desa-admin`, role `admin` → `/admin`

**`/desa-admin`** — Dashboard Utama Desa
- Topbar: logo, nama desa, bell (badge jika ada pending), avatar, logout
- Welcome card gradient dengan jumlah dokumen menunggu review
- 4 quick action cards: Upload Dokumen, Profil Desa, Dokumenku, Lihat Profil Publik
- Stats grid: Disetujui / Menunggu Review / Ditolak
- Panel info desa ringkas (penduduk, serapan %, wilayah)
- Recent docs list dengan status badge
- Alert card merah untuk dokumen yang ditolak + CTA upload ulang

**`/desa-admin/dokumen`** — Upload & Riwayat Dokumen
- Form kiri: jenis dokumen (dropdown), tahun, file upload
- Drop zone drag-and-drop dengan animasi scale saat drag aktif
- Validasi: hanya PDF/Excel, maks 10 MB
- Simulasi progress bar upload 0–100%
- Riwayat unggahan kanan: status badge + catatan admin jika ditolak
- Success toast animated setelah upload sukses

**`/desa-admin/profil`** — Pengaturan Profil Desa
- Section **Identitas** — read-only (kecamatan, kabupaten, provinsi, penduduk, anggaran)
- Section **Kontak & Web** — website URL, email, nomor telepon/WA
- Section **Potensi** — potensi unggulan, mata pencaharian
- Section **Sumber Data API** — URL integrasi SIPD/OMSPAN/custom (dengan penjelasan cara kerja)
- Section **Keamanan** — ganti PIN 6 digit + konfirmasi + toggle show/hide
- Auto-save indicator di topbar setelah simpan

**`/admin`** — Panel Review Admin PantauDesa
- Dark topbar dengan pending counter badge
- 4 stat cards: total/pending/disetujui/ditolak
- Filter bar per status
- ReviewCard expandable: preview placeholder + textarea catatan admin +
  tombol **Setujui & Publish** (emerald) / **Tolak & Kembalikan** (rose)
- Pending docs diexpand default + sorted pending-first
- Perubahan status tersimpan di state lokal (optimistic)

**`src/lib/auth-mock.ts`** *(baru)*
- Mock accounts: 2 desa + 1 admin (email siap demo)
- `generateOTP(email)` + `verifyOTP(email, code)` dengan TTL 5 menit
- `UploadedDoc` type dengan status `menunggu_review | disetujui | ditolak`
- 4 mock uploaded documents dengan berbagai status

**`src/lib/auth-context.tsx`** *(baru)*
- `AuthProvider` + `useAuth()` hook
- Persist session ke `sessionStorage` (hilang saat tab ditutup)
- `login(user)` + `logout()` actions

#### Diubah

**`src/components/layout/Navbar.tsx`**
- Tombol **"Masuk Portal Desa"** untuk guest (kanan desktop)
- **Dashboard shortcut** + **logout** untuk user yang sudah login
- Navbar tersembunyi di `/login`, `/desa-admin*`, `/admin*` (halaman punya header sendiri)

**`src/app/layout.tsx`**
- Wrap seluruh app dengan `<AuthProvider>`

---

## [0.8.0] — 2026-04-24

### `feat(visual): reduce illustration overload + cleanup unused image assets`

Commit: `88908dd`

#### Diubah

**`src/components/desa/TransparansiCard.tsx`**
- Hapus 2 banner landscape gambar (tab Transparansi & Perangkat) — diganti header ikon berwarna
- Tab icons: `BarChart3` (transparansi), `Users2` (perangkat), `FileText` (dokumen)
- Thumbnail `illustrationDocs` dipertahankan di tab Dokumen (ukuran kompak 48×48px)

**`src/components/desa/KelengkapanDesa.tsx`**
- Hapus texture overlay + ilustrasi desa di header
- Diganti: `bg-slate-800` solid + emoji icon `🏛️` — lebih bersih, tidak ramai

**`src/components/desa/DesaHeroCard.tsx`**
- Hapus thumbnail kondisional desa baik/buruk (96×56px) di strip potensi
- Diganti: strip `bg-slate-50/50` murni teks — lebih clean

#### Dihapus dari `public/`

- `images/bg-pattern.webp` — tidak dipakai di manapun
- Root-level file ASET 1–6 + "gambaran desa baik" (semua sudah di-copy ke `/images/`)

#### Diperbarui

**`src/lib/assets.ts`**
- Hapus entry `bgPattern` dan `textureSoft`
- Tambah entri baru: `textureLight`, `textureDark`, `illustrationHakWarga`,
  `illustrationEskalasi`, `illustrationTransparansi`, `illustrationPerangkat`, `illustrationDesaBaik`

---

## [0.7.0] — 2026-04-24

### `feat(suara): VoiceCard lengkap — foto bukti, vote benar/bohong, thread komentar, respons resmi desa`

Commit: `2fbf5f3` (VoiceCard, VoiceStats, SuaraWargaSection update, /suara page update)

Ekspansi besar fitur Suara Warga: dari feed komentar sederhana menjadi ruang partisipasi
warga yang nyata — dengan bukti foto, verifikasi komunitas via vote, percakapan dua arah,
dan saluran respons resmi dari perangkat desa.

#### Ditambahkan

**`src/components/desa/VoiceCard.tsx`** *(baru)*
- Komponen kartu suara warga yang dapat digunakan ulang (dipakai di `/desa/[id]/suara` dan `/suara`)
- **Grid foto bukti**: tampilkan maks 4 foto, sisanya ditampilkan sebagai "+N"; klik foto membuka lightbox fullscreen
- **Badge status penanganan** di setiap kartu:
  - `Belum` — rose, ikon `AlertCircle`
  - `Proses` — amber, ikon `Clock`
  - `Selesai` — emerald, ikon `CheckCircle2`
- **Vote Benar / Bohong**: tombol one-shot per sesi dengan optimistic counter — setelah memilih satu, keduanya disabled
- **Thread komentar collapsible**: toggle show/hide dengan hitungan komentar di tombol
- **Form reply langsung**: input nama (opsional, default anonim) + textarea + tombol Kirim / Batal — muncul di dalam thread tanpa navigasi
- **Respons resmi desa disorot khusus**:
  - Background emerald, border emerald, badge "Resmi Desa" dengan ikon perisai (`Shield`)
  - Jika thread belum dibuka, preview snippet respons resmi muncul sebagai CTA collapsible hijau di bawah teks suara
- Tombol "berguna" disabled setelah diklik (state `helpedIds` dikirim dari parent agar konsisten lintas render)

**`src/components/suara/VoiceStats.tsx`** *(baru)*
- 4 stat card berwarna: Total Suara (indigo), Belum Ditangani (rose), Sedang Diproses (amber), Sudah Selesai (emerald + rata-rata hari penyelesaian)
- **Bar chart** suara per kategori menggunakan Recharts: kolom total berwarna per kategori + overlay kolom resolved (hijau muda)
- **Pie chart donut** distribusi status penanganan (merah/kuning/hijau) dengan Legend dan tooltip
- **Ranking desa paling aktif bersuara**: medali 🥇🥈🥉 untuk 3 besar, progress bar resolusi, jumlah total + breakdown belum/selesai per desa

**`src/components/desa/SuaraWargaSection.tsx`** *(diperbarui)*
- Form kini mendukung **upload foto bukti**:
  - Tombol lampir foto (tersembunyi di `<input type="file">`, trigger via `ref.click()`)
  - Maks 3 foto per kiriman
  - Thumbnail preview 80×64px dengan tombol ×  hapus per foto (hover reveal)
  - URL dibuat via `URL.createObjectURL` (client-only, tanpa server untuk MVP)
- Feed diperbarui menggunakan `VoiceCard` baru
- `CitizenVoice` yang dikirim via form kini menyertakan `photos[]`, `votes`, `status: "open"`, `replies: []`

**`src/app/suara/page.tsx`** *(diperbarui)*
- Tombol **"Lihat statistik"** di hero banner toggle `VoiceStats` panel — stats tersembunyi secara default
- Feed diperbarui menggunakan `VoiceCard` dengan desa badge (📍 nama desa → link ke profil desa) di atas tiap kartu
- `helpedIds` state di-share ke semua kartu agar tombol berguna konsisten

**`src/lib/citizen-voice.ts`** *(diperluas)*
- Tipe baru: `VoiceStatus` (`"open" | "in_progress" | "resolved"`)
- Tipe baru: `VoiceReply` — field `isOfficialDesa: boolean` menandai respons dari perangkat desa
- `CitizenVoice` diperluas: `photos: string[]`, `votes: { benar: number; bohong: number }`, `status`, `resolvedAt?`, `replies: VoiceReply[]`
- `STATUS_CONFIG` — record konfigurasi UI per status (label panjang, label pendek, bg/text/border Tailwind)
- 16 mock voices lintas 5 desa (Sukamaju, Harapan Jaya, Maju Bersama, Baru Makmur, Pura Harapan) dengan thread percakapan realistis, respons resmi kades, vote counts, dan foto bukti
- Getter baru:
  - `getVoiceStats()` → total, resolved, inProgress, open, desaCount, avgResolutionDays
  - `getDesaRanking()` → array desa diurutkan by total suara, dengan breakdown open/resolved
  - `getCategoryStats()` → array per kategori dengan total dan resolved count

---

## [0.6.0] — 2026-04-24

### `feat(nav+detail): navigasi Suara Warga + integrasi seksi ke halaman detail desa`

Commit: `2fbf5f3`

#### Ditambahkan

**`src/app/desa/[id]/suara/page.tsx`** *(baru)*
- Halaman khusus suara warga per desa, dipisah dari halaman detail agar tidak menumpuk
- `generateStaticParams()` untuk semua desa → SSG (20 halaman di-pre-render)
- Mini header desa: nama, lokasi (kecamatan + kabupaten), status badge
- Full `SuaraWargaSection` dengan desaId + desaNama
- Back link ke `/desa/[id]`

**`src/app/suara/page.tsx`** *(baru)*
- Halaman global agregasi suara seluruh desa — rute `/suara` di menu navbar
- Hero section dengan stats: total suara + jumlah desa + jumlah suara selesai
- CTA "Ceritakan" → membuka desa selector dengan search field → redirect ke `/desa/[id]/suara`
- Filter bar: dropdown desa + 6 category pill toggle
- Feed `GlobalVoiceCard` = VoiceCard baru dibungkus desa badge per kartu

#### Diubah

**`src/components/layout/Navbar.tsx`**
- Tambah menu item ketiga: **Suara Warga** → `/suara` (desktop + mobile)
- Logo ganti dari `BarChart3` Lucide icon → `<Image src={ASSETS.logo} />` (32×32, object-cover, shadow-sm)

**`src/app/desa/[id]/page.tsx`**
- Import + render `SeharusnyaAdaSection` di bawah header desa
- Import + render `TanggungJawabSection` setelah seksi Dokumen
- Suara Warga diubah dari full section menjadi **preview card** yang menautkan ke `/desa/[id]/suara`:
  - Banner gradient indigo–violet dengan jumlah suara aktif
  - 2 preview voice teratas (`getVoicesForDesa(id).slice(0, 2)`)
  - Footer CTA "Lihat semua suara & tambahkan ceritamu"
- Hapus import `SuaraWargaSection` (dipindah ke halaman terpisah)

---

## [0.5.0] — 2026-04-24

### `feat(civic): seksi hak warga "Seharusnya Ada" + panel eskalasi "Tanggung Jawab"`

Commit: `2fbf5f3`

Dua seksi baru yang mengubah halaman detail desa dari laporan pasif menjadi alat
advokasi aktif: warga bisa tahu apa yang seharusnya ada di desanya, dan tahu ke mana
harus melapor kalau sesuatu tidak beres.

#### Ditambahkan

**`src/lib/expectations.ts`** *(baru)*
- Fungsi murni `getExpectations(desa: Desa): DesaExpectation`
- Kalkulasi otomatis dari data desa nyata:
  - Jumlah KK yang seharusnya dapat BLT = 20% Dana Desa ÷ Rp 3.600.000
  - Jumlah posyandu seharusnya ada = total penduduk ÷ 500
  - APBDes breakdown 5 bidang berdasarkan bobot kategori desa (Infrastruktur, Kesehatan, dll.)
- Item diberi tag: `wajib` (harus ada), `direncanakan` (ada di APBDes), `tanyakan` (perlu dikonfirmasi)

**`src/components/desa/SeharusnyaAdaSection.tsx`** *(baru)*
- Banner gelap dengan nominal dana desa: *"Dengan Rp X, desa ini seharusnya bisa…"*
- Checklist 3 grup per status:
  - **Wajib** (emerald ✓) — hak yang harus ada berdasarkan regulasi
  - **Direncanakan** (indigo) — sesuai APBDes yang ada
  - **Tanyakan** (amber ?) — patut dikonfirmasi ke perangkat desa
- Verdict bar di bawah: persentase serapan + kalimat kontekstual berdasarkan tone

**`src/lib/responsibility.ts`** *(baru)*
- Fungsi murni `getResponsibilities(desa: Desa): ProblemCategory[]`
- 6 kategori masalah: `infrastruktur`, `bansos`, `anggaran`, `korupsi`, `perizinan`, `pelayanan`
- Tiap kategori memiliki 3 level eskalasi, diisi dengan nama nyata dari data desa:
  - Level 1: Kepala Desa + nomor kontak
  - Level 2: Camat / BPD + kecamatan
  - Level 3: Inspektorat / ORI / KPK + kabupaten
- Tiap level: deskripsi tindakan, link `tel:`, URL eksternal (LAPOR.go.id, inspektorat, ORI, dll.)

**`src/components/desa/TanggungJawabSection.tsx`** *(baru — client component)*
- Banner gelap dengan judul seksi
- 6 tab kategori dengan emoji icon — aktif per klik
- Timeline eskalasi bernomor dengan garis vertikal: lingkaran 1=hijau, 2=kuning, 3=merah
- Tiap step: nama kontak, deskripsi tindakan, tombol tel:, link eksternal
- Tips warga per kategori
- CTA bar universal LAPOR.go.id di bagian bawah

**`src/components/desa/SuaraWargaSection.tsx`** *(baru — client component)*
- 6 category pill selector (bukan dropdown) dengan animasi scale + ring saat aktif
- Textarea dengan counter karakter yang berubah warna: slate → amber (70%) → rose (90%)
- Custom toggle switch anonim — UI native tanpa library
- Validasi submit: min 10 karakter + kategori wajib dipilih
- Success state dengan ikon `Sparkles` dan pesan terima kasih
- Feed voice card dengan thumbs-up optimistik + toggle "lihat X cerita lainnya"

---

## [0.4.0] — 2026-04-24

### `feat(hero): revamp hero section — hero.webp, film grain, brush highlight, receipt card, live ticker, ⌘K`

Commit: `c7ede61`

Hero section didesain ulang dari nol: dari gradient flat yang "biasa saja" menjadi
visual yang hidup, punya karakter kuat, dan langsung menyampaikan nilai platform.

#### Ditambahkan

**`src/components/home/HeroSection.tsx`** *(baru — client component)*
- **Background layered**:
  - `hero.webp` sebagai base fill layer (object-cover)
  - Gradient directional `linear-gradient(105deg, rgba(55,48,163,1.00) 0% → rgba(124,58,237,0.05) 100%)` di atas gambar — indigo penuh di kiri, transparan di kanan sehingga gambar terlihat
  - SVG film-grain noise via data URI (`opacity: 0.038`) untuk tekstur halus
- **Brush-highlight sweep** pada kata *"desamu"*: pseudo-element `::before` dengan background amber sweeping dari `scaleX(0)` ke `scaleX(1)` pada delay 0.8s
- **Struk receipt miring** (`rotate-6`): daftar 5 bidang APBDes + progress bar per bidang, animasi pengisian dimulai 900ms setelah load
- **Live ticker marquee**: 3 set item (total desa, transparansi baik, warga aktif) berputar 28s infinite loop dengan CSS `translateX`
- **Keyboard shortcut ⌘K / Ctrl+K** → `router.push("/desa")` via `useEffect` + `keydown` listener
- **Stagger fade-up**: tiap elemen hero masuk bertahap dengan delay 0ms, 100ms, 200ms, 400ms
- Props: `totalDesa: number`, `tahun: number`

**`src/app/globals.css`**
- `@keyframes ticker` — `translateX(0 → -33.333%)` untuk marquee 3-set
- `.animate-ticker` — `animation: ticker 28s linear infinite`
- `.brush-highlight::before` — amber sweep dengan `transform-origin: left`, delay 0.8s
- `.receipt-perf` — `radial-gradient(circle, #e2e8f0 4px, transparent 4px)` dot background
- Fade-up animation: `@keyframes fadeUp` + `.animate-fade-up` + `.animation-delay-{100,200,400}`

#### Diubah

**`src/app/page.tsx`**
- Ganti inline hero JSX dengan `<HeroSection totalDesa={...} tahun={...} />`

---

## [0.3.0] — 2026-04-23

### `feat(language): humanize all UI copy — from jargon to citizen voice`

Commit: `9def2c3`

Perubahan fundamental pada identitas platform: dari dashboard keuangan menjadi
suara rakyat. Seluruh teks UI ditulis ulang dari bahasa jargon anggaran ke bahasa
yang langsung dipahami warga tanpa latar belakang keuangan.

#### Arsitektur Baru

| File | Peran |
|---|---|
| `src/lib/copy.ts` | Satu sumber kebenaran seluruh teks UI — tidak ada string yang di-hardcode di komponen manapun (DRY) |
| `src/lib/verdicts.ts` | Fungsi murni yang menghasilkan pesan berjiwa berdasarkan data — tanpa efek samping (SRP) |
| `src/lib/utils.ts` | Tambah `getVerdictColors()` — mapping tone → Tailwind classes, memisahkan UI concern dari domain logic (ISP) |
| `src/components/ui/VerdictBanner.tsx` | Komponen reusable untuk menampilkan verdict di mana saja (DRY) |

#### Transformasi Bahasa

| Konteks | Sebelum | Sesudah |
|---|---|---|
| Status badge | "Rendah" | "Perlu Diawasi" |
| Status badge | "Sedang" | "Perlu Ditingkatkan" |
| Label budget | "Belum Terserap" | "Belum Jelas Penggunaannya" |
| Label budget | "Terealisasi" | "Sudah Digunakan" |
| Label budget | "Total Anggaran" | "Uang yang Diterima Desa" |
| Progress bar | "Penyerapan Anggaran" | "Anggaran yang sudah dipakai" |
| Verdict serapan | *(tidak ada)* | Kalimat jujur otomatis, contoh: *"Sebagian besar anggaran (Rp 682 Jt) belum jelas penggunaannya. Desa ini perlu pengawasan serius dari warganya."* |
| Section APBDes | "Rincian APBDes per Bidang" | "Anggaran Ini Dipakai untuk Apa Saja?" |
| Bidang kode 1 | "Penyelenggaraan Pemerintahan Desa" | "Operasional Kantor & Gaji Perangkat Desa" |
| Bidang kode 2 | "Pelaksanaan Pembangunan Desa" | "Pembangunan Fisik (Jalan, Gedung, Drainase, dll.)" |
| Bidang kode 3 | "Pembinaan Kemasyarakatan Desa" | "Program Sosial & Kemasyarakatan" |
| Bidang kode 4 | "Pemberdayaan Masyarakat Desa" | "Pelatihan & Pemberdayaan Warga" |
| Bidang kode 5 | "Penanggulangan Bencana & Darurat" | "Dana Siaga Bencana & Darurat" |
| Output fisik label | "Target: 3.2 km" | "Seharusnya ada: 3.2 km" |
| Output fisik label | "Realisasi: 3.0 km" | "Sudah ada/dikerjakan: 3.0 km" |
| Section perangkat | "Perangkat Desa" | "Siapa yang Harus Kamu Tanya?" |
| Section riwayat | "Tren Serapan 5 Tahun" | "Apakah Kinerjanya Membaik dari Tahun ke Tahun?" |
| Verdict tren | "Naik X poin dalam 5 tahun" | "Bagus! Kinerjanya terus membaik — naik X poin selama 5 tahun terakhir." |
| Verdict tren | "Turun X poin" | "Waspada: kinerja makin memburuk setiap tahunnya — ini tanda bahaya." |
| Section skor | "Skor Transparansi" | "Seberapa Terbuka Desa Ini ke Warganya?" |
| Skor label | "Perlu Peningkatan" | "Desa ini kurang terbuka — kamu berhak meminta informasi" |
| Metrik skor | "Ketepatan Pelaporan" | "Laporan disampaikan tepat waktu?" |
| Metrik skor | "Kelengkapan Dokumen" | "Dokumen publik bisa diakses warga?" |
| Metrik skor | "Responsivitas Pengaduan" | "Cepat merespons pertanyaan warga?" |
| Section dokumen | "Dokumen Publik" | "Dokumen yang Bisa Kamu Minta ke Desa" |
| Dokumen belum ada | "Belum ada" | "Belum ada — kamu berhak memintanya!" |
| Section pengaduan | "Laporkan Masalah" | "Ada yang Tidak Beres?" |
| Teks pengaduan | Singkat & formal | Empatik: *"Jika ada yang tidak sesuai — jalan rusak padahal ada anggarannya, bansos tidak merata, fasilitas dijanjikan tapi tidak ada — kamu berhak melapor. Suaramu penting."* |
| Stats card | "Total Anggaran Nasional" | "Total Uang Negara untuk Desa" |
| Stats card | "Serapan Baik (≥85%)" | "Desa dengan Kinerja Baik" |
| Stats card | "Serapan Rendah (<60%)" | "Desa yang Perlu Diawasi" |
| Filter button | "Rendah <60%" | "Perlu Diawasi (<60%)" |
| Filter total | "Menampilkan X desa" | "Ditemukan X desa" |
| Tren chart | "Anggaran" / "Realisasi" | "Total Anggaran" / "Sudah Dipakai" |
| Donut chart | "Baik (≥85%)" | "Kinerja Baik (≥85%)" |
| Top table | "Perlu Perhatian" | "Desa yang Harus Diawasi" |
| Top table sub | "5 desa dengan serapan terendah..." | "5 desa dengan penggunaan anggaran paling rendah — warga perlu turun tangan" |
| Hero title | "Transparansi Penyerapan Anggaran Dana Desa" | "Uang desamu sudah dipakai untuk apa?" |
| Hero subtitle | Teknis & formal | *"Setiap tahun desamu mendapat miliaran rupiah dari negara. Uang itu untuk kamu — rakyatnya..."* |
| CTA button | "Cari Data Desa" | "Cari Desamu Sekarang" |
| Footer tagline | "Platform transparansi anggaran dan penyerapan dana desa Indonesia" | "Kami hadir untuk menjawab pertanyaan yang selama ini tidak pernah dijawab — tentang uang desamu." |
| Halaman `/desa` title | "Data Desa" | "Data Desa" *(tetap, sudah tepat)* |
| Kolom tabel | "Anggaran" | "Uang Diterima" |
| Kolom tabel | "Realisasi" | "Sudah Dipakai" |
| Kolom tabel | "Serapan" | "% Terpakai" |
| Link tabel | "Detail" | "Lihat Detail" |

#### Fitur Baru

- **VerdictBanner** muncul tepat di bawah progress bar di halaman detail — kalimat
  jujur otomatis yang langsung menjawab "ini artinya apa?" berdasarkan persentase
  serapan, tanpa warga perlu menghitung sendiri.
- **Hint text** di setiap bidang APBDes — kalimat pendek yang menjelaskan dengan
  bahasa manusia apa yang dimaksud tiap kategori anggaran.
- **Framing "Seharusnya ada / Sudah ada"** di output fisik — mengubah laporan
  teknis menjadi pernyataan berbasis hak warga.
- **Teks pengaduan yang empatik** — bukan sekadar link ke portal, tapi kalimat
  yang memeluk keresahan warga dan mempertegas bahwa melapor adalah hak mereka.

#### Komponen yang Diubah

- `src/components/home/StatsCards.tsx`
- `src/components/home/TrendChart.tsx`
- `src/components/home/SerapanDonut.tsx`
- `src/components/home/AlertDiniSection.tsx`
- `src/components/desa/APBDesBreakdown.tsx`
- `src/components/desa/SkorTransparansiCard.tsx`
- `src/components/desa/OutputFisikCards.tsx`
- `src/components/desa/PerangkatDesaSection.tsx`
- `src/components/desa/RiwayatChart.tsx`
- `src/components/desa/DesaCard.tsx`
- `src/components/desa/DesaTable.tsx`
- `src/components/desa/SearchFilterBar.tsx`
- `src/components/layout/Footer.tsx`
- `src/app/page.tsx`
- `src/app/desa/[id]/page.tsx`

---

## [0.2.0] — 2026-04-23

### `feat(data): enrich desa model with APBDes, output fisik, perangkat, riwayat, transparansi`

Perluasan besar pada layer data dan halaman detail desa: dari dashboard angka sederhana
menjadi profil desa yang komprehensif dan akuntabel.

#### Ditambahkan

**Data Layer**
- `src/lib/types.ts` — interface baru: `APBDesItem`, `OutputFisik`, `PerangkatDesa`,
  `RiwayatTahunan`, `DokumenPublik`, `SkorTransparansi`, `PendapatanDesa`
- `src/lib/mock-data.ts` — 20 desa kini masing-masing memiliki:
  - APBDes breakdown 5 bidang dengan realisasi per bidang
  - Output fisik 3 program (target vs realisasi)
  - Profil 4 perangkat desa dengan kontak dan periode jabatan
  - Riwayat serapan 5 tahun (2020–2024) dengan tren realistis
  - 5 dokumen publik dengan status ketersediaan
  - Skor transparansi komposit (4 sub-indikator)
  - Breakdown sumber pendapatan desa (Dana Desa, ADD, PADes, Bantuan)

**Komponen Baru**
- `src/components/desa/APBDesBreakdown.tsx` — rincian anggaran per bidang dengan progress bar
- `src/components/desa/SkorTransparansiCard.tsx` — skor keterbukaan dengan 4 metrik
- `src/components/desa/OutputFisikCards.tsx` — capaian fisik program
- `src/components/desa/PerangkatDesaSection.tsx` — profil pejabat desa
- `src/components/desa/RiwayatChart.tsx` — line chart tren 5 tahun + mini tabel per tahun
- `src/components/desa/DownloadButton.tsx` — ekspor data desa ke CSV
- `src/components/home/AlertDiniSection.tsx` — panel peringatan desa serapan < 50%

**Halaman Detail Desa** (`/desa/[id]`)
- Tambah seksi: Sumber Pendapatan Desa
- Tambah seksi: Skor Transparansi
- Tambah seksi: Output Fisik
- Tambah seksi: Rincian APBDes per Bidang
- Tambah seksi: Tren 5 Tahun
- Tambah seksi: Perangkat Desa
- Tambah seksi: Dokumen Publik
- Tambah seksi: Laporkan Masalah
- Tambah tombol: Unduh Data CSV
- Tambah tombol: Kembali ke daftar (header)

**Halaman Beranda** (`/`)
- Tambah: Banner Skor Transparansi Nasional di bawah stats cards
- Tambah: Panel Peringatan Dini (desa < 50% serapan)
- Tambah: Peringkat rata-rata serapan per provinsi

#### Diubah

- `src/lib/types.ts` — `SummaryStats` tambah field `rataRataSkorTransparansi`
- `src/components/home/StatsCards.tsx` — tambah banner skor transparansi nasional

---

## [0.1.0] — 2026-04-23

### `init`

Commit: `00d2566`

Inisialisasi proyek PantauDesa — fondasi platform monitoring penyerapan anggaran dana desa.

#### Ditambahkan

**Struktur Proyek**
- Next.js 16 (App Router) + TypeScript 5 + Tailwind CSS 4 + Recharts

**Data Layer**
- `src/lib/types.ts` — interface `Desa`, `TrendData`, `SummaryStats`
- `src/lib/mock-data.ts` — 20 desa dari berbagai provinsi Indonesia
- `src/lib/utils.ts` — `formatRupiah`, `formatRupiahFull`, `getStatusColor`, `getStatusLabel`, `getSerapanColor`

**Komponen**
- `src/components/layout/Navbar.tsx` — navigasi sticky dengan mobile menu
- `src/components/layout/Footer.tsx` — footer dengan branding
- `src/components/home/StatsCards.tsx` — 6 kartu ringkasan nasional
- `src/components/home/TrendChart.tsx` — area chart anggaran vs realisasi bulanan
- `src/components/home/SerapanDonut.tsx` — donut chart distribusi status desa
- `src/components/home/TopDesaTable.tsx` — tabel desa terbaik & terendah
- `src/components/desa/SearchFilterBar.tsx` — pencarian + filter provinsi & status
- `src/components/desa/DesaCard.tsx` — kartu grid desa
- `src/components/desa/DesaTable.tsx` — tabel desa dengan sort
- `src/components/desa/BudgetBarChart.tsx` — bar chart anggaran vs realisasi

**Halaman**
- `/` — beranda dengan hero, stats, chart, top tables
- `/desa` — daftar desa dengan search, filter, sort, pagination, dual view
- `/desa/[id]` — detail desa: header, budget stats, chart, info panel
- `/_not-found` — halaman 404 custom

---

*Format: `[MAJOR.MINOR.PATCH]` — MAJOR: breaking change, MINOR: fitur baru, PATCH: bugfix.*
