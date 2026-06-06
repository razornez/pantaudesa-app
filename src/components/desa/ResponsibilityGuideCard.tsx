import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Scale } from "lucide-react";
import { RESPONSIBILITY_CARD } from "@/lib/copy";
import { ASSETS } from "@/lib/assets";

export default function ResponsibilityGuideCard() {
  return (
    <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl bg-amber-500 text-white">
          <Scale size={18} />
        </div>
        <div className="flex-1">
          <p className="text-base font-black text-amber-950">{RESPONSIBILITY_CARD.title}</p>
          <p className="mt-2 text-sm leading-relaxed text-amber-800">
            {RESPONSIBILITY_CARD.body}
          </p>
          <Link
            href="/panduan/kewenangan"
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-amber-600 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-amber-700"
          >
            {RESPONSIBILITY_CARD.cta}
            <ArrowRight size={14} />
          </Link>
          <p className="mt-3 text-[10px] text-amber-700/70 leading-relaxed">
            {RESPONSIBILITY_CARD.disclaimer}
          </p>
        </div>
        <div className="hidden w-24 flex-shrink-0 self-end sm:block">
          <Image src={ASSETS.mascotStanding} alt="Pak Waspada" width={96} height={132} className="object-contain" />
        </div>
      </div>
    </section>
  );
}
