const guideItems = [
  "Admin Desa adalah akses keanggotaan untuk mewakili satu desa di PantauDesa, bukan tanda bahwa semua data publik desa sudah terverifikasi.",
  "Satu akun hanya boleh mewakili atau mengelola satu desa.",
  "Verifikasi admin bisa melalui email resmi desa atau token yang dipasang di website resmi desa.",
  "Token website harus dipasang di halaman yang mudah diakses dari website resmi desa.",
  "Token website perlu diperbarui setiap 6 bulan agar hubungan dengan website resmi desa tetap valid.",
  "Pengajuan dibuat berarti klaim sedang diproses dan verifikasi masih perlu diselesaikan.",
  "Admin terbatas berarti akses admin awal sudah aktif, tetapi belum penuh ke kanal resmi desa.",
  "Admin terverifikasi berarti akun sudah terhubung penuh ke kanal resmi desa dan boleh mengundang admin lain.",
  "Admin hasil undangan selalu mulai dari status admin terbatas, bukan langsung admin terverifikasi.",
  "Satu desa maksimal memiliki 5 admin. Jika batas tercapai, undangan baru tidak bisa dikirim.",
  "Hubungi Admin dipakai untuk bantuan, klarifikasi, atau melaporkan dugaan admin palsu.",
  "Jika kamu tidak lagi mewakili desa tersebut, hubungi tim PantauDesa agar status admin ditinjau ulang.",
];

const faqs = [
  {
    q: "Bisakah saya mengelola lebih dari satu desa?",
    a: "Tidak. Satu akun hanya boleh mewakili atau mengelola satu desa di PantauDesa.",
  },
  {
    q: "Apakah admin terverifikasi berarti data desa juga terverifikasi?",
    a: "Tidak. Admin terverifikasi adalah status keanggotaan admin, bukan status verifikasi data publik desa. Data publik desa tetap mengikuti alur review yang terpisah.",
  },
  {
    q: "Mengapa hanya admin utama desa yang boleh mengundang admin lain?",
    a: "Karena undangan admin adalah tindakan sensitif. Hanya admin yang sudah terhubung penuh ke kanal resmi desa yang boleh melakukannya.",
  },
  {
    q: "Apa yang terjadi setelah seseorang menerima undangan admin?",
    a: "Admin yang menerima undangan akan masuk sebagai admin terbatas dan tetap harus menjalani verifikasi sendiri untuk naik menjadi admin terverifikasi.",
  },
  {
    q: "Apa yang harus saya lakukan jika tidak punya akses ke email resmi desa?",
    a: "Gunakan metode verifikasi melalui website resmi desa. Jika keduanya tidak memungkinkan, gunakan fitur Hubungi Admin dan jelaskan kendalanya.",
  },
  {
    q: "Apa yang harus saya lakukan jika tidak punya akses ke website resmi desa?",
    a: "Gunakan metode verifikasi melalui email resmi desa. Jika keduanya tidak memungkinkan, gunakan fitur Hubungi Admin dan sertakan bukti pendukung.",
  },
  {
    q: "Apa yang harus saya lakukan jika salah mengirim undangan ke email yang salah?",
    a: "Saat ini belum ada fitur pembatalan undangan yang sudah terkirim. Undangan akan tetap berlaku sampai masa berlakunya habis.",
  },
  {
    q: "Apa yang harus saya lakukan jika saya menduga ada admin palsu?",
    a: "Jangan menuduh secara publik. Gunakan fitur Hubungi Admin untuk melaporkan kecurigaan secara aman agar tim PantauDesa bisa meninjaunya.",
  },
];

export default function AdminClaimHelpSection() {
  return (
    <section className="lux-card p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-black text-slate-900">Panduan dan FAQ Admin Desa</p>
          <p className="mt-1 max-w-2xl text-xs leading-relaxed text-slate-500">
            Semua catatan penting dan pertanyaan umum ditempatkan dalam satu area agar halaman klaim terasa lebih rapi.
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-5 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Panduan singkat</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {guideItems.map((item) => (
              <div key={item} className="rounded-xl bg-slate-50 px-3 py-2 text-xs leading-relaxed text-slate-600">
                {item}
              </div>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Pertanyaan umum</p>
          <div className="mt-3 space-y-2">
            {faqs.map((faq) => (
              <details key={faq.q} className="group rounded-xl border border-slate-100 bg-slate-50">
                <summary className="flex list-none cursor-pointer items-center justify-between px-3 py-2.5 text-xs font-bold text-slate-900">
                  {faq.q}
                  <span className="ml-2 text-slate-400 transition-transform group-open:rotate-180">v</span>
                </summary>
                <div className="border-t border-slate-100 px-3 pb-3 pt-2 text-xs leading-relaxed text-slate-600">
                  {faq.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
