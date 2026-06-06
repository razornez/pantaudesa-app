"use client";

import { FileClock, ShieldCheck, UserRoundCog, XCircle } from "lucide-react";
import Link from "next/link";
import type { InternalDashboardSummary } from "@/lib/internal-admin/dashboard-types";
import { SectionHeading, Surface, formatWholeNumber } from "./shared";

function SnapshotCard({
  icon,
  title,
  value,
  note,
  href,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
  note: string;
  href: string;
}) {
  return (
    <Surface>
      <div className="space-y-4 p-4 sm:p-5">
        <div className="flex items-center gap-3">
          <span
            className="inline-flex h-10 w-10 items-center justify-center rounded-[1.1rem] bg-slate-50 text-[#1E1B4B]"
            style={{ boxShadow: "inset 0 0 0 1px rgba(15,23,42,0.06)" }}
          >
            {icon}
          </span>
          <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-slate-500">
            {title}
          </p>
        </div>
        <div>
          <p className="text-[30px] font-semibold text-slate-950" style={{ letterSpacing: "-0.05em" }}>
            {value}
          </p>
          <p className="mt-1 text-[13px] leading-6 text-slate-500">{note}</p>
        </div>
        <Link href={href} className="inline-flex items-center text-[12px] font-semibold text-slate-800">
          Buka detail
        </Link>
      </div>
    </Surface>
  );
}

export function OperationalSnapshot({ summary }: { summary: InternalDashboardSummary }) {
  return (
    <div className="space-y-4">
      <SectionHeading
        eyebrow="Snapshot operasional"
        title="Pertanyaan owner yang harus bisa dijawab dalam satu pandangan"
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SnapshotCard
          icon={<UserRoundCog size={18} aria-hidden />}
          title="Admin desa aktif"
          value={formatWholeNumber(summary.admins.activeMemberCount)}
          note={`${formatWholeNumber(summary.admins.verifiedMemberCount)} verified · ${formatWholeNumber(summary.admins.limitedMemberCount)} limited`}
          href="/internal-admin/claims"
        />
        <SnapshotCard
          icon={<ShieldCheck size={18} aria-hidden />}
          title="Desa tanpa verified"
          value={formatWholeNumber(summary.admins.desaWithoutVerifiedAdminCount)}
          note="Governance risk: belum ada admin utama yang siap jadi penanggung jawab."
          href="/internal-admin/claims"
        />
        <SnapshotCard
          icon={<FileClock size={18} aria-hidden />}
          title="Dokumen pending"
          value={formatWholeNumber(summary.documents.waitingVerifiedApprovalCount + summary.documents.processingCount)}
          note={`${formatWholeNumber(summary.documents.waitingVerifiedApprovalCount)} menunggu verified · ${formatWholeNumber(summary.documents.processingCount)} diproses internal`}
          href="/internal-admin/documents"
        />
        <SnapshotCard
          icon={<XCircle size={18} aria-hidden />}
          title="Reject + gagal"
          value={formatWholeNumber(summary.documents.rejectedCount + summary.documents.failedCount)}
          note="Sinyal sumber bermasalah, dokumen tidak aman, atau review masih buntu."
          href="/internal-admin/documents?status=FAILED"
        />
      </div>
    </div>
  );
}

