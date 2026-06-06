import type { Metadata } from "next";
import Link from "next/link";
import {
  BookOpen, Search, ShieldCheck,
  TrendingUp, ArrowRight, ChevronDown,
  Megaphone, Users, HelpCircle, ClipboardCheck, FileSearch, MapPin,
} from "lucide-react";
import { AUTHORITY_HIGHLIGHTS, PHILOSOPHY } from "@/lib/copy";

export const metadata: Metadata = {
  title: "Panduan & FAQ — PantauDesa",
  description: "Pelajari cara menggunakan PantauDesa untuk memantau anggaran desa, bersuara, dan mendorong transparansi.",
};

// ─── Types ────────────────────────────────────────────────────────────────────

interface FAQItem { q: string; a: string }
interface Section {
  id:       string;
  icon:     React.ElementType;
  title:    string;
  color:    string;
  textColor:string;
  items:    FAQItem[];
}

// ─── Content ──────────────────────────────────────────────────────────────────

const SECTIONS: Section[] = [
  {
    id: "memulai", icon: BookOpen, title: "Memulai",
    color: "bg-indigo-50", textColor: "text-indigo-700",
    items: [
      {
        q: "Apa itu PantauDesa?",
        a: "PantauDesa adalah platform publik yang memudahkan warga memantau penggunaan anggaran dana desa. Setiap tahun, setiap desa di Indonesia menerima miliaran rupiah dari negara — PantauDesa membantu kamu memastikan uang itu digunakan dengan benar.",
      },
      {
        q: "Apakah perlu akun untuk melihat data?",
        a: "Tidak. Semua data anggaran, profil desa, dan suara warga bisa dilihat siapapun tanpa akun. Akun hanya diperlukan jika kamu ingin ikut bersuara, memberikan vote, atau membalas komentar.",
      },
      {
        q: "Bagaimana cara mendaftar?",
        a: "Klik 'Daftar' di navbar, isi nama dan email, lalu verifikasi dengan kode OTP yang kami kirimkan. Proses selesai dalam 2 menit — tidak perlu password.",
      },
      {
        q: "Apakah data yang ditampilkan akurat?",
        a: "Data yang sudah terverifikasi bersumber dari dokumen resmi yang diupload oleh pihak desa dan telah melalui review admin PantauDesa. Data yang belum diverifikasi diberi label jelas. Integrasi dengan data resmi SIPD dan OMSPAN sedang dikembangkan.",
      },
    ],
  },
  {
    id: "anggaran", icon: TrendingUp, title: "Memahami Anggaran Desa",
    color: "bg-emerald-50", textColor: "text-emerald-700",
    items: [
      {
        q: "Apa itu Dana Desa?",
        a: "Dana Desa adalah anggaran yang langsung ditransfer dari pemerintah pusat ke rekening desa. Besarnya bervariasi Rp 600 juta – 2+ miliar tergantung jumlah penduduk, luas wilayah, dan kondisi geografis.",
      },
      {
        q: "Apa yang dimaksud 'serapan anggaran'?",
        a: "Serapan anggaran adalah persentase dana yang sudah benar-benar digunakan dari total yang diterima. Serapan 85% ke atas dianggap baik. Serapan rendah bisa berarti dana tidak dimanfaatkan, administrasi lambat, atau masalah lainnya.",
      },
      {
        q: "Apa itu APBDes?",
        a: "APBDes (Anggaran Pendapatan dan Belanja Desa) adalah rencana keuangan desa untuk satu tahun. Mirip dengan APBN tapi untuk desa. Warga berhak meminta dan mendapatkan salinannya secara gratis.",
      },
      {
        q: "Dari mana saja sumber pendapatan desa?",
        a: "Ada 4 sumber utama: (1) Dana Desa dari APBN ~65%, (2) ADD (Alokasi Dana Desa) dari kabupaten ~25%, (3) PADes (Pendapatan Asli Desa) seperti hasil usaha ~5%, (4) Bantuan Keuangan dari provinsi/kabupaten ~5%.",
      },
    ],
  },
  {
    id: "suara", icon: Megaphone, title: "Suara Warga",
    color: "bg-amber-50", textColor: "text-amber-700",
    items: [
      {
        q: "Apa itu 'Suara Warga'?",
        a: "Suara Warga adalah fitur untuk melaporkan kondisi nyata di desamu — jalan berlubang, posyandu tidak aktif, BLT tidak cair, dll. Berbeda dari pengaduan formal, suara warga tidak perlu tanda tangan atau bahasa baku.",
      },
      {
        q: "Apa bedanya vote 'Benar' vs 'Bohong'?",
        a: "Warga lain yang tahu kondisi desamu bisa mengkonfirmasi apakah laporan itu benar atau tidak. Semakin banyak yang vote Benar, semakin terpercaya suara tersebut dan semakin besar kemungkinan mendapat perhatian.",
      },
      {
        q: "Bisakah saya melaporkan secara anonim?",
        a: "Ya. Saat mengirim suara, ada opsi 'Kirim anonim'. Nama kamu tidak akan ditampilkan, tapi laporan tetap bisa dilihat publik. Untuk membangun reputasi sebagai suara terpercaya, sebaiknya gunakan nama asli.",
      },
      {
        q: "Bagaimana desa merespons suara warga?",
        a: "Perangkat desa yang sudah terdaftar di PantauDesa bisa membalas dengan 'Respons Resmi Desa' yang ditandai dengan ikon perisai hijau. Respons resmi mendapat sorotan khusus agar mudah ditemukan warga.",
      },
    ],
  },
  {
    id: "hak", icon: ShieldCheck, title: "Hak & Kewajiban Warga",
    color: "bg-violet-50", textColor: "text-violet-700",
    items: [
      {
        q: "Apakah saya berhak meminta dokumen anggaran desa?",
        a: "Ya, ini dijamin oleh UU Desa No. 6 Tahun 2014 dan Permendagri tentang transparansi desa. APBDes, laporan realisasi, dan RKP Desa wajib tersedia untuk publik. Jika ditolak, itu pelanggaran hukum.",
      },
      {
        q: "Apa yang bisa dilakukan jika desa tidak transparan?",
        a: "Langkah pertama: minta langsung ke kepala desa. Jika tidak direspons dalam seminggu, eskalasi ke BPD (Badan Permusyawaratan Desa). Lalu ke kecamatan, inspektorat kabupaten, atau laporkan ke LAPOR.go.id (hotline 1708).",
      },
      {
        q: "Apa itu BPD dan apa fungsinya?",
        a: "BPD adalah lembaga perwakilan warga yang mengawasi kepala desa. Anggotanya dipilih dari warga desa. BPD berwenang meminta laporan ke kepala desa dan bisa menjadi jembatan warga dalam mendapatkan informasi anggaran.",
      },
      {
        q: "Berapa lama desa punya waktu untuk merespons pengaduan?",
        a: "Jika laporan disampaikan lewat LAPOR.go.id, instansi terkait wajib merespons dalam 5 hari kerja. Jika laporan langsung ke desa, tidak ada batas waktu resmi tapi BPD bisa menekan kepala desa untuk merespons.",
      },
    ],
  },
  {
    id: "akun", icon: Users, title: "Akun & Profil",
    color: "bg-sky-50", textColor: "text-sky-700",
    items: [
      {
        q: "Apa itu 'Trust Badge' dan bagaimana cara mendapatkannya?",
        a: "Trust Badge mencerminkan seberapa aktif dan terpercaya suara-suaramu. Ada 5 level: Pengamat 👁️ → Warga Aktif 🙋 → Suara Terpercaya ⭐ → Pahlawan Desa 🦸 → Pejuang Desa 🏆. Skor bertambah dari setiap suara yang dibuat, divote benar, atau dianggap berguna.",
      },
      {
        q: "Bisakah saya mengganti username?",
        a: "Tidak. Username bersifat permanen setelah akun dibuat, mirip seperti @handle di media sosial. Pilih dengan cermat karena username ini yang akan dikenal orang lain.",
      },
      {
        q: "Bagaimana cara melihat profil warga lain?",
        a: "Setiap akun memiliki halaman profil publik di /profil/[username]. Kamu bisa melihat badge, statistik, dan riwayat suara mereka. Klik nama author di kartu suara untuk langsung ke profil mereka.",
      },
      {
        q: "Bagaimana notifikasi bekerja?",
        a: "Kamu akan mendapat notifikasi jika ada yang membalas suaramu, memberikan vote, atau jika masalah yang kamu laporkan mendapat respons resmi desa. Notifikasi bisa dilihat di halaman Profil → tab Notifikasi.",
      },
    ],
  },
];

const METHOD_STEPS = [
  "Sumber publik ditemukan dan diberi catatan asalnya.",
  "Dokumen diklasifikasi sebagai APBDes, realisasi, profil, atau bahan pendukung.",
  "Nilai contoh tetap ditandai (mock), sementara sumber belum otomatis dianggap benar final.",
  "Review dilakukan sebelum status yang lebih kuat diberikan.",
  "Warga membaca dokumen asli dan konteks sebelum bertanya atau menyimpulkan.",
];

const GUIDE_NOTES = [
  {
    title: "Cara membaca data tanpa menuduh",
    body: "PantauDesa membantu warga membaca sumber dan dokumen. Kesimpulan tetap perlu melihat dokumen asli, konteks desa, dan pihak yang berwenang.",
    icon: FileSearch,
  },
  {
    title: "Metodologi ringkas",
    body: "Data dirapikan dari sumber publik, dokumen pendukung, status review, dan catatan pembaruan agar warga tahu mana yang bisa mulai dicek.",
    icon: ClipboardCheck,
  },
  {
    title: "Pilot awal Arjasari",
    body: "Area awal dipakai untuk belajar menata sumber, dokumen, dan status dengan hati-hati sebelum cakupan diperluas.",
    icon: MapPin,
  },
];

// ─── FAQ Accordion ────────────────────────────────────────────────────────────

function FAQAccordion({ items }: { items: FAQItem[] }) {
  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <details key={i} className="group bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <summary className="flex items-center justify-between gap-3 px-5 py-4 cursor-pointer list-none hover:bg-slate-50 transition-colors">
            <span className="text-sm font-semibold text-slate-800 leading-snug">{item.q}</span>
            <ChevronDown size={16} className="text-slate-400 flex-shrink-0 group-open:rotate-180 transition-transform duration-200" />
          </summary>
          <div className="px-5 pb-4">
            <p className="text-sm text-slate-600 leading-relaxed">{item.a}</p>
          </div>
        </details>
      ))}
    </div>
  );
}

// ─── Section card ─────────────────────────────────────────────────────────────

function SectionBlock({ section }: { section: Section }) {
  const Icon = section.icon;
  return (
    <div id={section.id} className="space-y-3">
      <div className={`inline-flex items-center gap-2.5 px-4 py-2.5 rounded-2xl ${section.color}`}>
        <Icon size={18} className={section.textColor} />
        <h2 className={`text-base font-black ${section.textColor}`}>{section.title}</h2>
      </div>
      <FAQAccordion items={section.items} />
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function PanduanPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-10">

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 text-xs font-bold px-3 py-1.5 rounded-full">
          <HelpCircle size={13} /> Pusat Bantuan
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 leading-tight">
          Panduan & FAQ
        </h1>
        <p className="text-slate-500 text-sm max-w-xl mx-auto leading-relaxed">
          Semua yang perlu kamu tahu tentang memantau anggaran desa, bersuara, dan memperjuangkan transparansi.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-widest text-indigo-600">Arah PantauDesa</p>
          <h2 className="mt-3 text-xl font-black text-slate-900">{PHILOSOPHY.homeTitle}</h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-600">{PHILOSOPHY.homeIntro}</p>
          <p className="mt-3 text-sm leading-relaxed text-slate-600">{PHILOSOPHY.homeBody}</p>
          <div className="mt-4 rounded-2xl bg-indigo-50 px-4 py-3 text-sm leading-relaxed text-indigo-900">
            {PHILOSOPHY.homeClosing}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-widest text-amber-300">Batas Wewenang</p>
          <h2 className="mt-3 text-xl font-black text-white">{PHILOSOPHY.authorityTitle}</h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-300">{PHILOSOPHY.authorityIntro}</p>
          <div className="mt-4 space-y-2.5">
            {AUTHORITY_HIGHLIGHTS.map((item) => (
              <div key={item.level} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <p className="text-sm font-bold text-white">{item.level}</p>
                <p className="mt-1 text-xs leading-relaxed text-slate-300">{item.scope}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Quick nav ─────────────────────────────────────────────────────── */}
      <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
        <div className="max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-widest text-emerald-700">Metodologi & batas klaim</p>
          <h2 className="mt-2 text-xl font-black text-slate-900">Cara membaca data tanpa menuduh</h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            PantauDesa merapikan bahan baca warga. Sumber dan dokumen tetap menjadi rujukan utama, sementara nilai yang masih contoh ditandai langsung di dekat angkanya.
          </p>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {GUIDE_NOTES.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.title} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-emerald-700">
                  <Icon size={16} />
                </div>
                <p className="mt-3 text-sm font-black text-slate-900">{item.title}</p>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-600">{item.body}</p>
              </div>
            );
          })}
        </div>
        <ol className="mt-5 grid gap-2 text-sm leading-relaxed text-slate-600">
          {METHOD_STEPS.map((step, index) => (
            <li key={step} className="flex gap-3 rounded-2xl bg-emerald-50 px-4 py-3">
              <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-emerald-600 text-xs font-black text-white">
                {index + 1}
              </span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      </section>

      <div className="flex flex-wrap gap-2 justify-center">
        {SECTIONS.map(s => {
          const Icon = s.icon;
          return (
            <a
              key={s.id}
              href={`#${s.id}`}
              className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl border transition-all hover:scale-105 ${s.color} ${s.textColor} border-current/10`}
            >
              <Icon size={12} /> {s.title}
            </a>
          );
        })}
      </div>

      {/* ── Sections ──────────────────────────────────────────────────────── */}
      {SECTIONS.map(s => <SectionBlock key={s.id} section={s} />)}

      {/* ── CTA bottom ────────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-indigo-600 to-violet-600 rounded-3xl p-6 sm:p-8 text-center text-white">
        <p className="text-lg font-black mb-2">Masih ada pertanyaan?</p>
        <p className="text-indigo-200 text-sm mb-5">Hubungi kami langsung atau mulai eksplorasi data desa di sekitarmu.</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/daftar"
            className="inline-flex items-center justify-center gap-2 bg-white text-indigo-700 font-bold px-5 py-2.5 rounded-xl hover:bg-indigo-50 transition-colors text-sm"
          >
            <Users size={15} /> Daftar Sekarang
          </Link>
          <Link
            href="/desa"
            className="inline-flex items-center justify-center gap-2 bg-white/15 hover:bg-white/25 text-white font-bold px-5 py-2.5 rounded-xl transition-colors text-sm"
          >
            <Search size={15} /> Cari Desamu <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
}
