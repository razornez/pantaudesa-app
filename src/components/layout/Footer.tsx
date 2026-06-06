import { BarChart3 } from "lucide-react";
import { FOOTER } from "@/lib/copy";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-slate-900 text-slate-400 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col items-center md:items-start gap-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-md bg-indigo-500 flex items-center justify-center">
                <BarChart3 size={15} className="text-white" />
              </div>
              <span className="font-semibold text-white text-sm">
                Pantau<span className="text-indigo-400">Desa</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 max-w-xs text-center md:text-left">
              {FOOTER.tagline}
            </p>
          </div>
          <p className="text-xs text-center text-slate-600">Baca angka bersama sumber dan dokumen pendukungnya.</p>
          <p className="text-xs text-slate-600">{FOOTER.copyright(year)}</p>
        </div>
      </div>
    </footer>
  );
}
