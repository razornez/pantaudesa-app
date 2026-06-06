# BMAD Standard — UI/UX Standard

Status: **ACTIVE STANDARD**  
Scope: semua halaman public, user profile, Admin Desa, Internal Admin, modal, form, table/list, dashboard-lite, dan mobile view PantauDesa.  
Goal: UI rapi, cepat dipahami, mobile-friendly, ringan, dan nyaman untuk user non-teknis.

---

## 1. Core UX Principles

PantauDesa dipakai oleh banyak tipe user:

- warga biasa
- admin desa
- admin internal
- user yang tidak terlalu paham teknologi
- user yang memakai HP kecil dan jaringan kurang stabil

Karena itu UI harus:

1. **Jelas** — user paham apa yang terjadi dan langkah berikutnya.
2. **Ringkas** — jangan terlalu banyak teks dan card.
3. **Mobile-first** — iPhone 12 mini wajib dicek.
4. **Tidak membingungkan** — hindari status ganda, summary redundan, dan copy teknis.
5. **Cepat terasa** — shell/shimmer muncul cepat, jangan blank/freeze.
6. **Konsisten** — badge, card, modal, tab, copy, dan spacing seragam.
7. **Accessible** — keyboard, focus, contrast, label, dan target tap harus layak.
8. **Trustworthy** — jangan tampilkan data palsu sebagai data asli.

---

## 2. Design Direction

Back office PantauDesa menggunakan style:

```text
Quiet luxury
```

Artinya:

- subtle
- bersih
- tidak terlalu ramai
- spacing lega tapi efisien
- warna lembut
- border/shadow tipis
- typography jelas
- card tidak terlalu besar
- animasi halus dan tidak berlebihan

Avoid:

- warna terlalu mencolok tanpa fungsi
- card terlalu banyak
- gradient berlebihan
- shadow terlalu berat
- icon terlalu besar
- text block panjang
- badge terlalu ramai

---

## 3. Mobile-First Rules

Wajib cek minimal:

```text
iPhone 12 mini / width 360px
```

Rules:

- Tidak boleh horizontal overflow kecuali area chip/tab yang memang sengaja scroll horizontal.
- Summary/chip yang banyak boleh horizontal scroll tipis, bukan turun banyak baris.
- Button harus mudah ditekan.
- Icon action di mobile ideal 12–16px.
- Card list jangan terlalu tinggi.
- Hindari 1 card 1 baris kalau informasi bisa dibuat compact tanpa mengorbankan kejelasan.
- Modal harus bisa scroll dan tombol tetap bisa dijangkau.
- Sticky bottom action boleh digunakan untuk modal/form panjang.
- Gunakan safe-area untuk iPhone/Safari jika tombol di bawah.

Acceptance:

```text
[ ] Tidak ada UI berdempetan
[ ] Tidak ada text penting yang wrap aneh
[ ] Tidak ada tombol keluar layar
[ ] Tidak ada modal yang tidak bisa scroll
[ ] Tidak ada card terlalu panjang tanpa alasan
```

---

## 4. Information Density Rules

Terlalu banyak informasi membuat user cepat lelah.

Rules:

- Jangan tampilkan summary yang sama dua kali.
- Jika header sudah punya summary, jangan ulang dalam card tepat di bawahnya.
- Gunakan metric/chip hanya untuk data yang benar-benar membantu keputusan.
- Hindari 4–6 card besar untuk data yang bisa jadi chip kecil.
- Di mobile, summary lebih baik compact chip/grid kecil.
- Jangan tampilkan field teknis yang tidak perlu untuk user.
- Gunakan progressive disclosure: detail muncul saat klik/expand/modal.

Example bad:

```text
Header: 13 total klaim, 3 diperiksa, 4 ditolak
Row bawah: Baru 3, Diperiksa 3, Disetujui 3
```

Fix:

```text
Pilih salah satu summary utama saja.
```

---

## 5. Copywriting Rules

Copy harus bahasa Indonesia sederhana.

Rules:

- Hindari istilah teknis tanpa penjelasan.
- Jangan tampilkan enum mentah.
- Gunakan kata kerja yang jelas: “Setujui”, “Tolak”, “Unggah”, “Lihat detail”.
- Rejection/error harus menjelaskan cara memperbaiki.
- Sensitive step harus punya helper text singkat.
- Jangan terlalu panjang.
- Jangan menakut-nakuti user, tapi tetap jelas konsekuensinya.

Good:

```text
Dokumen belum bisa diproses karena file buram. Unggah ulang dokumen yang lebih jelas.
```

Bad:

```text
FAILED_VALIDATION_ERROR_DOCUMENT_UNREADABLE
```

---

## 6. Status, Badge, and Label Rules

Badges harus konsisten.

Rules:

- Gunakan badge untuk status penting saja.
- Jangan menumpuk banyak badge di satu baris jika membuat wrap berantakan.
- Status harus punya tone konsisten:
  - success: approved/published/verified
  - warning: pending/in review/due soon
  - danger: rejected/failed/overdue
  - info: neutral/processing
- Jangan pakai warna berbeda untuk arti yang sama.
- Badge text harus pendek.
- Di mobile, badge harus `whitespace-nowrap` bila memungkinkan.

Examples:

```text
Verified
Terbatas
Diproses
Tayang
Gagal
Menunggu
```

Avoid:

```text
Verified Resmi Aktif Admin Desa
```

---

## 7. Navigation and Tabs

Rules:

- Tab tidak perlu terlihat seperti card besar.
- Active tab cukup dengan text color + underline jika ruang sempit.
- Semua tab harus konsisten, bukan hanya tab aktif tertentu.
- Horizontal scroll boleh untuk mobile.
- Jangan ada border/shadow berlebihan pada setiap tab item.
- Label tab pendek.

Back office Admin Desa tabs:

```text
Profil
List Admin
Dokumen
Suara
Notifikasi
```

Internal Admin tabs:

```text
Pengajuan
Dokumen
Perpanjangan
```

---

## 8. Card Rules

Card harus membantu grouping, bukan membuat halaman terasa berat.

Rules:

- Gunakan card untuk unit informasi yang memang berbeda.
- Jangan terlalu banyak nested card.
- Jangan membuat card summary besar kalau chip cukup.
- Padding mobile lebih kecil dari desktop.
- Gunakan shadow/border tipis.
- Card clickable harus jelas tapi tidak berlebihan.
- Empty card harus punya pesan jelas.

Recommended padding:

```text
Mobile card: p-3 / p-4
Desktop card: p-5 / p-6
```

---

## 9. Forms

Rules:

- Label wajib jelas.
- Placeholder bukan pengganti label.
- Required field harus jelas.
- Helper text hanya untuk field yang butuh konteks.
- Error berada dekat field.
- Submit button harus jelas status loading-nya.
- Jangan pakai field manual jika data bisa otomatis dari profile/database.
- Form sensitif harus memberi instruksi singkat.

Examples:

- Suara warga wajib login → jangan tampilkan field “Namamu”.
- Admin desa reject claim → wajib ada alasan dan instruksi perbaikan.
- Upload dokumen → tampilkan batas ukuran, format, dan tanggung jawab.

---

## 10. Modal and Dialog Rules

Rules:

- Modal mobile harus scrollable.
- Panel modal harus punya `max-height` berdasarkan viewport.
- Gunakan `100dvh` jika perlu untuk mobile browser.
- Tombol utama/batal harus tetap bisa dijangkau.
- Gunakan sticky bottom action untuk modal panjang.
- Jangan biarkan keyboard/mobile bar menutup tombol.
- Modal harus punya title jelas.
- Destructive modal harus jelaskan konsekuensi.

Mobile modal acceptance:

```text
[ ] Bisa scroll sampai bawah
[ ] Tombol aksi terlihat dan bisa ditekan
[ ] Tidak ketutup browser bottom bar
[ ] Tidak overflow horizontal
```

---

## 11. Loading, Skeleton, and Empty State

Rules:

- Gunakan skeleton/shimmer untuk halaman yang query data.
- Jangan tampilkan spinner kosong untuk halaman kompleks.
- Skeleton harus mirip struktur konten.
- Jangan gunakan fake data.
- Jika data belum load, jangan tampilkan data lama yang salah.
- Empty state harus jujur.

Good empty state:

```text
Belum ada dokumen yang diunggah.
```

Bad:

```text
Data tidak tersedia
```

Jika error:

```text
Data belum bisa dimuat. Coba refresh atau hubungi admin jika masalah berlanjut.
```

---

## 12. Performance UX Rules

Target:

```text
Shell/shimmer tampil < 1 detik
Data utama ideal < 1 detik
Jika data > 1 detik, user tetap melihat loading yang jelas
Jika data > 2 detik, wajib investigasi
```

UX rules:

- Jangan biarkan halaman blank.
- Jangan blocking semua layout karena satu query berat.
- Gunakan loading route segment.
- Gunakan compact skeleton agar halaman tidak terasa berat.
- Hindari skeleton terlalu banyak dan terlalu panjang.

---

## 13. Accessibility Rules

Minimum:

- Button punya label jelas.
- Icon-only button punya `aria-label`.
- Form input punya label.
- Modal punya role/dialog pattern atau accessible title.
- Focus ring tidak dihapus.
- Contrast teks harus cukup.
- Touch target minimal nyaman untuk mobile.
- Jangan bergantung pada warna saja untuk status; gunakan label text.

---

## 14. Table/List Rules

Back office lebih sering pakai list/card dibanding table di mobile.

Rules:

- Desktop boleh table jika kolom banyak dan user butuh scan cepat.
- Mobile gunakan card compact.
- List item harus punya hierarchy:
  - title
  - subtitle/context
  - status
  - action
- Action utama jangan terlalu banyak di satu item.
- Detail tambahan bisa masuk modal/expand.

---

## 15. Public Page Rules

Public page harus terasa ringan dan kredibel.

Rules:

- Jangan tampilkan draft/rejected data.
- Jangan tampilkan dummy sebagai data asli.
- Jika data belum lengkap, tampilkan empty state jujur.
- Sumber data ditampilkan jika membantu trust.
- Search/highlight harus langsung jelas.
- Loading beranda harus punya shimmer, bukan freeze.

---

## 16. Back Office Specific Rules

### Admin Desa

- Bahasa harus mudah dipahami admin non-teknis.
- Jangan terlalu banyak tab/summary dalam satu layar.
- Badge admin verified/limited harus kecil dan rapi.
- “Dashboard” besar tidak perlu jika belum ada kebutuhan jelas.
- List admin, dokumen, suara, notifikasi harus compact.

### Internal Admin

- Fokus pada antrean kerja, bukan dashboard analytics besar.
- Approval/reject harus memberi konteks cukup.
- Reject modal wajib scrollable dan punya instruksi perbaikan.
- Summary jangan double.
- Data sensitif jangan terlalu terekspos di list jika tidak perlu.

---

## 17. Operational Review Page Pattern

Gunakan pola ini untuk halaman back office yang tugas utamanya adalah review, validasi, publish, reject, atau approval. Referensi kualitas: halaman Intake Step 2 standalone.

### Design DNA

Halaman review PantauDesa harus terasa seperti alat kerja yang tenang, padat, dan bisa dipercaya. Vibe yang dituju bukan dashboard analytics besar, bukan form panjang, dan bukan halaman marketing. User harus merasa sedang memeriksa bukti, membandingkan perubahan, lalu mengambil keputusan.

Karakter visual:

- Halaman harus decision-first: user langsung melihat apa yang berubah, apa yang perlu dicek, dan aksi final apa yang tersedia.
- Informasi padat boleh ditampilkan jika hierarchy jelas: summary utama di header, detail operasional di komponen khusus, action final di section terpisah.
- Komponen boleh variatif selama fungsinya berbeda: diff theatre, coverage lens, validation panel, gallery, info strip, inspector, dan final action boleh punya model visual masing-masing.
- Variasi visual harus membantu scan, bukan dekorasi. Warna, border, chart, pill, tab, dan panel dipakai untuk membedakan jenis informasi.
- Jangan membuat semua komponen berbentuk card datar berisi judul dan teks. Minimal satu permukaan utama harus punya bentuk khas yang membantu pekerjaan, misalnya diff row, chart coverage, segmented tab, timeline, segmented control, progress bar, audit trail, or inspector drawer.
- Komponen utama boleh terasa berbeda, tetapi harus tetap satu bahasa: radius, border, shadow, label treatment, font size, dan color semantics tetap konsisten.

### Page Anatomy

Urutan yang direkomendasikan untuk halaman review operasional:

1. Context header: dokumen, target desa, status, dan aksi navigasi singkat.
2. Primary decision surface: diff, comparison, preview, atau evidence utama.
3. Supporting confidence surface: coverage, validation, audit, source quality, atau risk signal.
4. Secondary detail surface: gallery, detected fields, metadata, atau inspector.
5. Final action surface: publish, approve, reject, mark failed, atau return to queue.

Rules:

- Surface utama harus muncul sebelum action final agar user mengambil keputusan dari bukti, bukan dari tombol.
- Final action tidak boleh menjadi review surface kedua. Jangan tampilkan ulang daftar perubahan yang sudah muncul di diff.
- History atau audit boleh ada, tetapi jangan mengambil fokus dari keputusan utama.
- Jika sebuah halaman punya lebih dari satu panel besar, setiap panel harus punya job yang berbeda dan mudah disebut dalam satu kalimat.

### Component Variety

Komponen back office tidak boleh semuanya terasa seperti kotak informasi yang sama. Variasi yang sehat adalah variasi berbasis fungsi.

Gunakan:

- Diff theatre untuk perubahan before/after dan filter perubahan.
- Coverage lens untuk ringkasan kelengkapan data dalam chart, bar, atau signal visual.
- Validation panel untuk status aman/error/warning dan issue list.
- Gallery atau preview strip untuk bukti dokumen dan hasil ekstraksi.
- Info strip untuk metadata singkat dan debugging opsional.
- Inspector drawer untuk data teknis yang tidak perlu tampil di permukaan utama.
- Final action section untuk keputusan akhir saja.

Hindari:

- Empat sampai enam card berurutan yang semuanya hanya punya title, paragraph, dan badge.
- Card di dalam card jika tidak ada alasan grouping yang kuat.
- Summary besar yang mengulang angka dari tab/filter tepat di bawahnya.
- Menambahkan panel baru hanya untuk menjelaskan panel sebelumnya.

### Information Density

Halaman boleh padat jika padatnya membantu pekerjaan.

- Satu informasi penting hanya tampil di satu tempat utama.
- Jangan ulang informasi yang sudah jelas di komponen lain. Jika diff sudah menjelaskan perubahan, final action tidak perlu mengulang daftar field yang sama.
- Copy instruksi panjang hanya dipakai jika user benar-benar butuh konteks untuk mengambil keputusan. Jika konteks sudah ada di card lain, hapus.
- Gunakan label kecil untuk scan cepat, bukan paragraf penjelas.
- Gunakan progressive disclosure untuk data teknis: drawer, expand, modal, atau inspector.
- Data teknis seperti parser, request id, raw JSON, dan confidence detail tidak masuk surface utama kecuali sedang debugging.

### Color And Label Semantics

Warna harus berfungsi sebagai bahasa operasional yang stabil.

- Warna tidak boleh monoton. Gunakan beberapa tone fungsional yang konsisten, misalnya emerald untuk baru/siap, indigo untuk update/review, rose untuk reject/hapus, slate untuk netral/sama, amber untuk warning.
- Legend warna harus modern dan compact. Desktop boleh memakai chip lengkap seperti `Warna hijau = Baru`; mobile harus dipadatkan menjadi satu baris seperti dot warna + label, tanpa horizontal scroll.
- Label kecil harus punya background/border halus jika berperan sebagai badge. Jangan hilangkan affordance visual sampai terlihat seperti teks biasa.
- Jangan bergantung pada warna saja. Setiap warna penting harus tetap punya label singkat seperti `Baru`, `Diperbarui`, `Dihapus`, atau `Sama`.
- Badge tidak perlu muncul jika informasi yang sama sudah terlihat dari row, tab, atau diff state.

### Mobile Behavior

Mobile harus tetap terasa seperti alat kerja, bukan versi rusak dari desktop.

- Mobile layout harus punya gutter kanan-kiri yang cukup. Jika teks atau legend tidak muat, ringkas label dan sedikit kecilkan font sebelum membuat scroll horizontal.
- Legend/status utama di mobile harus muat satu baris jika jumlah item kecil. Untuk empat item diff, gunakan dot warna + label singkat.
- Horizontal scroll hanya boleh untuk tab/chip yang memang interaktif dan jumlahnya tidak stabil. Jangan gunakan scroll horizontal untuk legend statis yang bisa diringkas.
- Jangan biarkan heading dan chip membuat first card terlalu tinggi. Jika perlu, kecilkan type scale mobile 1-2px.
- Filter tabs boleh turun baris, tetapi action utama dan informasi penting tidak boleh keluar dari viewport.
- Gutter kanan di card mobile harus dicek khusus karena chip kecil sering terlihat mepet ke border.

### Final Action And Provenance

Action final adalah keputusan, bukan tempat mengedit sumber data.

- Final action area harus minimal: tampilkan konteks singkat, input alasan reject jika perlu, dan tombol aksi utama. Jangan tampilkan ulang diff, coverage, atau legenda yang sudah ada di atas.
- Untuk data provenance, reviewer tidak boleh terlihat sebagai sumber data jika hanya memverifikasi dokumen. Jika nilai berasal dari dokumen upload, UI publish harus menjaga bahwa nilai yang dipublish tetap berasal dari dokumen tersebut, bukan override manual reviewer.
- Jika reviewer tidak setuju dengan nilai hasil ekstraksi, flow yang aman adalah reject atau minta upload perbaikan, bukan edit nilai agar terlihat berasal dari dokumen.
- Tombol final harus jelas dan tidak mengirim user ke loop. Jika publish/reject terjadi di halaman ini, antrean hanya menjadi tempat kembali setelah keputusan.
- Copy action harus menyebut keputusan nyata: `Publikasikan`, `Reject`, `Tandai gagal`, `Setujui`, atau `Tolak`. Hindari copy ambigu seperti `Lanjut review` jika review sudah sedang berlangsung.

### Visual QA Expectations

Sebelum halaman dianggap punya vibe yang sesuai:

- Cek desktop dan mobile.
- Cek first viewport, state setelah filter/tab berubah, dan area final action.
- Cari horizontal overflow, teks wrap aneh, badge terlalu mepet, dan card yang terlalu tinggi.
- Pastikan setiap komponen besar punya bentuk dan fungsi yang berbeda.
- Pastikan warna terasa variatif tetapi tidak ramai.
- Pastikan tidak ada informasi penting yang muncul dua kali di tempat berdekatan.

Acceptance:

```text
[ ] Summary utama hanya muncul sekali
[ ] Setiap komponen besar punya fungsi dan bentuk visual yang berbeda
[ ] Tidak ada list/detail yang mengulang diff atau coverage
[ ] Legend mobile muat satu baris tanpa horizontal scroll
[ ] Badge/label kecil tetap punya background/border halus
[ ] Warna dipakai sebagai semantic signal, bukan dekorasi acak
[ ] Final action section tidak menjadi review surface kedua
[ ] Provenance data jelas: reviewer tidak mengubah sumber data
```

---

## 18. Screenshot QA Rules

Saat diminta screenshot evidence:

- Jangan screenshot ketika masih shimmer/loading.
- Jangan screenshot halaman login kecuali yang diuji memang login.
- Jika layout rusak saat screenshot, langsung fix dulu.
- Cek mobile iPhone 12 mini.
- Cek desktop minimal 1366px.
- Screenshot harus mencakup perubahan UI yang relevan.

---

## 19. UI/UX Completion Checklist

```text
[ ] Mobile iPhone 12 mini dicek
[ ] Tidak ada horizontal overflow tidak sengaja
[ ] Tidak ada text wrap aneh pada badge/action penting
[ ] Tidak ada summary redundan
[ ] Tidak ada final action yang mengulang detail dari review surface utama
[ ] Tidak ada card terlalu besar tanpa alasan
[ ] Komponen review punya variasi visual sesuai fungsi
[ ] Legend/status compact di mobile dan tetap jelas
[ ] Modal mobile bisa scroll
[ ] Button penting bisa dijangkau
[ ] Empty state jujur
[ ] Loading state ada
[ ] Error state jelas
[ ] Copy sederhana dan tidak terlalu panjang
[ ] Tidak ada enum mentah tampil ke user
[ ] Focus ring/accessibility tidak rusak
[ ] Screenshot QA tidak diambil saat loading/login salah
[ ] Provenance data tidak kabur karena override manual reviewer
```

---

## 20. Done Means

UI/UX task selesai jika:

- user paham apa yang terjadi
- halaman nyaman di mobile
- tidak ada data palsu
- tidak ada layout berantakan
- tidak ada info double
- komponen utama terasa variatif tapi tetap satu bahasa desain
- action final tidak membingungkan alur review
- loading/error/empty state jelas
- screenshot/regression sudah dicek bila diperlukan
