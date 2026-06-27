import { Zap } from "lucide-react";

type Fact = {
  angka: string;
  judul: string;
  body: string;
  provinsi: string;
  warna: "indigo" | "emerald" | "amber" | "rose" | "sky";
};

const FACTS: Fact[] = [
  {
    angka: "100%",
    judul: "Jawa Barat punya kelengkapan data hampir sempurna",
    body: "Dari 3.581 desa di Jabar, 6 dari 7 field data utama—penduduk, luas wilayah, dana desa, koordinat, topografi, dan kategori IDM—berhasil dicapai ≥99%. Ternyata data resmi itu ada, tinggal dikumpulkan.",
    provinsi: "Jawa Barat",
    warna: "emerald",
  },
  {
    angka: "7.810",
    judul: "Jawa Tengah punya lebih banyak desa dari Papua dan Jabar digabung",
    body: "Jateng menyimpan 7.810 desa—lebih dari Papua (7.181) dan Jabar (3.581) sekaligus. Dana desanya 100% tercatat dan penduduknya 100% terlacak, tapi koordinat OSM baru 42%.",
    provinsi: "Jawa Tengah",
    warna: "indigo",
  },
  {
    angka: "226",
    judul: "Yahukimo punya koordinat OSM meski hanya bisa dicapai lewat udara",
    body: "Yahukimo adalah salah satu kabupaten paling terisolir di Indonesia—tidak ada jalan raya, akses hanya via penerbangan. Namun sukarelawan OSM berhasil memetakan 226 desa. Lebih baik dari banyak kabupaten di Jawa.",
    provinsi: "Papua Pegunungan",
    warna: "sky",
  },
  {
    angka: "5.000+",
    judul: "DJPK belum mencatat desa di 4 provinsi Papua yang lahir tahun 2022",
    body: "Provinsi Papua Selatan, Papua Tengah, Papua Pegunungan, dan Papua Barat Daya sudah 3 tahun berdiri, tapi basis data dana desa nasional (DJPK) belum diperbarui. Dana mengalir, tapi pencatatan pusat ketinggalan.",
    provinsi: "Papua",
    warna: "amber",
  },
  {
    angka: "40",
    judul: "Nduga—zona konflik aktif—sudah punya 40 desa terpetakan di OSM",
    body: "Nduga adalah kabupaten dengan akses paling terbatas di Indonesia. Tapi 40 desa sudah ada di peta OpenStreetMap, kemungkinan besar dari pemetaan kemanusiaan untuk respons bencana dan bantuan.",
    provinsi: "Papua Pegunungan",
    warna: "rose",
  },
  {
    angka: "8%",
    judul: "Hanya 8% desa Jabar yang punya portal OpenSID",
    body: "Meski Jabar adalah provinsi dengan data paling lengkap di PantauDesa, hanya 300 dari 3.581 desa yang mempublikasikan data lewat portal desa digital (OpenSID). Transparansi online masih sangat terbatas.",
    provinsi: "Jawa Barat",
    warna: "indigo",
  },
  {
    angka: "0",
    judul: "Jakarta punya 0 desa—ibukota negara tak tersentuh sistem ini",
    body: "DKI Jakarta tidak memiliki satu pun desa. Semua unit administrasinya adalah kelurahan, bukan desa. Artinya Jakarta tidak dapat dana desa, tidak punya skor IDM, dan tidak terdeteksi di PantauDesa. Ibukota negara berada di luar radar sistem desa nasional.",
    provinsi: "DKI Jakarta",
    warna: "rose",
  },
];

const colorMap = {
  indigo: {
    card: "border-indigo-100 bg-indigo-50",
    badge: "bg-indigo-100 text-indigo-700",
    angka: "text-indigo-700",
    dot: "bg-indigo-400",
  },
  emerald: {
    card: "border-emerald-100 bg-emerald-50",
    badge: "bg-emerald-100 text-emerald-700",
    angka: "text-emerald-700",
    dot: "bg-emerald-400",
  },
  amber: {
    card: "border-amber-100 bg-amber-50",
    badge: "bg-amber-100 text-amber-700",
    angka: "text-amber-700",
    dot: "bg-amber-400",
  },
  rose: {
    card: "border-rose-100 bg-rose-50",
    badge: "bg-rose-100 text-rose-700",
    angka: "text-rose-700",
    dot: "bg-rose-400",
  },
  sky: {
    card: "border-sky-100 bg-sky-50",
    badge: "bg-sky-100 text-sky-700",
    angka: "text-sky-700",
    dot: "bg-sky-400",
  },
};

export default function SurprisingFactsSection() {
  return (
    <section>
      <div className="mb-4 max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-wide text-amber-600 flex items-center gap-1.5">
          <Zap size={12} />
          Fakta mengejutkan dari data
        </p>
        <h2 className="mt-1 text-lg font-semibold text-slate-800">
          Yang kami temukan saat mengumpulkan data 18.000+ desa
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Dari Jawa Barat ke Papua, data pemerintah menyimpan cerita yang tidak selalu terduga.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {FACTS.map((fact) => {
          const c = colorMap[fact.warna];
          return (
            <div
              key={fact.judul}
              className={`rounded-2xl border p-4 flex flex-col gap-2 ${c.card}`}
            >
              <div className="flex items-start justify-between gap-2">
                <p className={`text-2xl font-black leading-none ${c.angka}`}>{fact.angka}</p>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${c.badge}`}>
                  {fact.provinsi}
                </span>
              </div>
              <p className="text-sm font-bold text-slate-800 leading-snug">{fact.judul}</p>
              <p className="text-xs text-slate-500 leading-relaxed">{fact.body}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
