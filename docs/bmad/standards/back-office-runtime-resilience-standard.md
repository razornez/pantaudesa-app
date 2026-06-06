# Back Office Runtime Resilience Standard

## Purpose

Standar ini melengkapi standardisasi engineering back office. Tujuannya bukan hanya membuat code rapi, tetapi juga memastikan halaman back office tetap usable ketika runtime lokal, pool Postgres, atau read path tertentu sedang sempit atau tidak stabil.

## Core Principle

Back office dianggap **belum standard-complete** bila hanya lolos:

- lint
- build
- typecheck
- module cleanup

tetapi masih gagal saat:

- koneksi Prisma lokal timeout
- pool Postgres sempit
- filter/search/ranking memicu burst query
- read-heavy page tidak punya fallback/read strategy

## Mandatory Checklist

### 1. Separate structure from resilience

Setiap task back office wajib ditutup di dua level:

- **structure compliance**
  - page tipis
  - service/repository/policy terpisah
  - no duplicated logic
  - typed payload
- **runtime resilience compliance**
  - read path tidak mudah tumbang karena bottleneck lokal
  - UI punya degraded mode yang jelas
  - error tidak langsung mematikan workflow utama

### 2. Audit every read path

Untuk setiap halaman back office, petakan semua jalur baca:

- summary
- filter options
- search
- ranking
- history
- audit trail
- dropdown dependency
- modal prefetch

Setiap read path harus dijawab:

- Prisma-only?
- ada fallback?
- ada cache/dedupe?
- aman saat pool sempit?

### 3. Filter, search, and ranking are high risk by default

Komponen berikut tidak boleh dianggap “ringan” tanpa audit khusus:

- filter wilayah
- autocomplete/search
- ranking explorer
- tab dengan multiple panel fetch
- cards yang refetch saat preset berubah

Semua surface ini wajib diuji dalam kondisi:

- first load
- rapid filter change
- query param change
- empty result
- database slow / timeout

### 4. Degraded mode must be intentional

Kalau runtime utama gagal, back office harus punya salah satu:

- fallback read path
- empty state jujur
- partial UI disable dengan penjelasan jelas
- cached/session-shared result

Jangan tampilkan:

- pesan generik tanpa konteks
- spinner berkepanjangan tanpa jalan keluar
- angka palsu
- workflow yang tampak hidup tapi diam-diam gagal load data

### 5. Local runtime is part of QA

Back office tidak boleh dianggap selesai hanya karena production-shape code rapi. QA wajib mencakup runtime lokal karena banyak operasi harian owner/dev dilakukan dari local environment.

Minimum yang harus dicek:

- local `next dev`
- local Prisma connectivity
- local pool bottleneck behavior
- localhost/browser interaction pada filter dan action utama

### 6. P2024 / P1001 / P1002 are not “ops-only”

Error berikut harus dianggap bagian dari scope engineering back office:

- `P2024` connection pool timeout
- `P1001` can't reach database
- `P1002` database timeout

Artinya:

- tangani di service/read path
- mapping ke user message harus jujur
- fallback/read alternative harus dipertimbangkan

### 7. Back office critical reads should prefer safe fallback when feasible

Untuk read path ringan atau read-mostly yang sering dipakai:

- filter option lists
- queue/history summary
- ranking inputs
- compact dashboard metrics

bila feasible, sediakan fallback ke jalur yang lebih tahan, misalnya Supabase Data API atau read adapter lain yang sudah approved.

### 8. Avoid burst-query UX

UI tidak boleh memicu query berlebihan tanpa kontrol:

- debounce untuk search input
- lazy ranking load setelah kriteria dipilih
- do not auto-open long lists on first load if not needed
- abort stale requests
- avoid duplicate parent + child fetch for same payload

### 9. Reports must state resilience status honestly

Setiap report BMAD wajib menyebut:

- read path mana yang Prisma-only
- read path mana yang sudah punya fallback
- kondisi degraded mode yang sudah diuji
- blocker yang masih tersisa

Jangan menulis “standard complete” bila resilience path belum ditutup.

### 10. Completion gate

Task back office baru boleh dianggap **full close** jika:

1. structure compliance lulus
2. functional flow lulus
3. degraded runtime behavior sudah diuji
4. report menyatakan statusnya dengan jujur

## Recommended Verification

- `npx tsc --noEmit`
- `npm run lint`
- `npm test`
- `npm run build`
- browser/manual QA pada halaman utama task
- one degraded-mode check:
  - DB slow
  - pool sempit
  - fallback path active

## Anti-Patterns

Jangan ulangi pola ini:

- “code sudah rapi jadi pasti aman”
- “lolos build berarti back office beres”
- “error koneksi lokal bukan scope task”
- “filter/search kecil jadi tidak perlu fallback”
- “ranking langsung tampil semua tanpa memikirkan burst read dan UX scroll”
