import Link from "next/link";
import { db } from "@/lib/db";
import { requireAdminDesaContext } from "@/lib/admin-desa/require-context";
import { BACK_OFFICE_COPY } from "@/lib/back-office-copy";
import AdminDesaSuaraStatusAction from "@/components/admin-desa/AdminDesaSuaraStatusAction";
import { ExternalLink, MessageSquare, MessagesSquare, ThumbsDown, ThumbsUp } from "lucide-react";
import { perfLog, perfStart } from "@/lib/perf";

export const dynamic = "force-dynamic";

const COPY = BACK_OFFICE_COPY.adminDesa.suara;

function CompactMetric({ label, value, note }: { label: string; value: number; note: string }) {
  return (
    <div className="rounded-2xl bg-white px-3 py-3 shadow-[inset_0_0_0_1px_rgba(15,23,42,0.06),0_10px_22px_-18px_rgba(15,23,42,0.3)] sm:px-4 sm:py-4">
      <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-slate-500 sm:text-[10px]">{label}</p>
      <p className="mt-1 text-[24px] font-bold leading-none text-slate-950 sm:text-[28px]">{value}</p>
      <p className="mt-1 text-[11px] leading-snug text-slate-500 sm:text-xs">{note}</p>
    </div>
  );
}

function FooterStat({ icon, value, label }: { icon: React.ReactNode; value: number | null; label: string }) {
  return (
    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-slate-50 px-2 py-1 text-[10px] font-medium text-slate-600 ring-1 ring-slate-200/70 sm:text-xs">
      {icon}{value !== null ? <span>{value}</span> : null}<span className="whitespace-nowrap">{label}</span>
    </span>
  );
}

export default async function AdminDesaSuaraPage() {
  const ctx = await requireAdminDesaContext("admin-desa.suara");

  const tVoices = perfStart();
  const voiceDesaKeys = [ctx.desa.id, ctx.desa.slug].filter(Boolean);
  const voices = db
    ? await db.voice.findMany({
        where: { desaId: { in: voiceDesaKeys } },
        orderBy: { createdAt: "desc" },
        take: 50,
        select: {
          id: true,
          category: true,
          text: true,
          isAnon: true,
          status: true,
          createdAt: true,
          resolvedAt: true,
          author: { select: { nama: true, username: true, email: true } },
          _count: { select: { replies: true, votes: true, helpfuls: true } },
        },
      })
    : [];
  perfLog("admin-desa.suara", "voice.findMany", tVoices);

  const summary = voices.reduce((acc, voice) => {
    acc.total += 1;
    acc.replies += voice._count.replies;
    acc.helpful += voice._count.helpfuls;
    if (voice.status === "OPEN") acc.open += 1;
    if (voice.status === "RESOLVED") acc.resolved += 1;
    return acc;
  }, { total: 0, replies: 0, helpful: 0, open: 0, resolved: 0 });

  return (
    <div className="space-y-5">
      <header className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-1.5">
          <p className="eyebrow text-[10px]">{COPY.headingEyebrow}</p>
          <h1 className="display text-[24px] sm:text-[30px] font-semibold text-slate-900 tracking-tight leading-tight">{COPY.headingTitle}</h1>
          <p className="text-sm text-slate-500 leading-relaxed max-w-2xl">{COPY.headingBody(ctx.desa.nama)}</p>
        </div>
        <Link href={`/desa/${ctx.desa.slug}/suara`} className="btn-lux btn-lux-ghost w-full sm:w-auto text-sm">
          {COPY.openPublicPage} <ExternalLink size={14} aria-hidden />
        </Link>
      </header>

      <section className="grid grid-cols-4 gap-1.5 sm:gap-2">
        <CompactMetric label={COPY.summary.total} value={summary.total} note={COPY.summary.publicInput} />
        <CompactMetric label={COPY.summary.open} value={summary.open} note={COPY.summary.unresolved} />
        <CompactMetric label={COPY.summary.replies} value={summary.replies} note={COPY.summary.discussions} />
        <CompactMetric label={COPY.summary.helpful} value={summary.helpful} note={COPY.summary.citizenResponse} />
      </section>

      <div className="notice-card notice-info text-sm leading-relaxed"><p className="font-semibold">{COPY.noticeTitle}</p><p className="mt-1 opacity-90">{COPY.noticeBody}</p></div>

      {voices.length === 0 ? (
        <div className="lux-card p-8 text-center text-sm text-slate-500">{COPY.empty}</div>
      ) : (
        <ul className="space-y-3">
          {voices.map((v) => {
            const author = v.isAnon ? COPY.authorAnonymous : (v.author?.nama ?? v.author?.username ?? v.author?.email ?? COPY.authorAnonymous);
            return (
              <li key={v.id} className="lux-card t-spring lift hover:shadow-lux-hover p-4 sm:p-5 space-y-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-2 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="pill-info rounded-full px-2.5 py-1 text-[11px] font-semibold">{COPY.category[v.category as keyof typeof COPY.category] ?? v.category}</span>
                      <AdminDesaSuaraStatusAction voiceId={v.id} currentStatus={v.status as "OPEN" | "IN_PROGRESS" | "RESOLVED"} />
                    </div>
                    <div className="text-xs text-slate-500">{author} · {new Date(v.createdAt).toLocaleDateString("id-ID", { dateStyle: "medium" })}</div>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5 sm:min-w-[168px]">
                    <div className="rounded-xl bg-slate-50 px-2 py-2 text-center shadow-[inset_0_0_0_1px_rgba(15,23,42,0.05)]"><p className="text-[10px] text-slate-500">{COPY.summary.replies}</p><p className="text-sm font-semibold text-slate-900 mt-0.5">{v._count.replies}</p></div>
                    <div className="rounded-xl bg-slate-50 px-2 py-2 text-center shadow-[inset_0_0_0_1px_rgba(15,23,42,0.05)]"><p className="text-[10px] text-slate-500">{COPY.summary.helpful}</p><p className="text-sm font-semibold text-slate-900 mt-0.5">{v._count.helpfuls}</p></div>
                    <div className="rounded-xl bg-slate-50 px-2 py-2 text-center shadow-[inset_0_0_0_1px_rgba(15,23,42,0.05)]"><p className="text-[10px] text-slate-500">Vote</p><p className="text-sm font-semibold text-slate-900 mt-0.5">{v._count.votes}</p></div>
                  </div>
                </div>
                <p className="text-sm text-slate-800 leading-relaxed">{v.text}</p>
                <div className="surface-divider pt-3 flex flex-nowrap items-center gap-1.5 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  <FooterStat icon={<MessagesSquare size={11} aria-hidden />} value={v._count.replies} label={COPY.labels.replies} />
                  <FooterStat icon={<ThumbsUp size={11} aria-hidden />} value={v._count.helpfuls} label={COPY.labels.helpful} />
                  <FooterStat icon={<ThumbsDown size={11} aria-hidden />} value={v._count.votes} label={COPY.labels.vote} />
                  <FooterStat icon={<MessageSquare size={11} aria-hidden />} value={null} label={COPY.labels.publicArchive} />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
