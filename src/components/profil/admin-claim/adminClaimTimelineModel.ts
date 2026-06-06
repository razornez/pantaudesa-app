import type { AdminClaimActiveClaim, AdminClaimActiveMember } from "@/lib/data/admin-claim-read";

export type StepState = "done" | "active" | "upcoming";

export interface AdminClaimTimelineStep {
  num: number;
  state: StepState;
  title: string;
  note: string;
}

export function buildAdminClaimTimelineSteps(
  claim: AdminClaimActiveClaim | null,
  member: AdminClaimActiveMember | null
): AdminClaimTimelineStep[] {
  const hasClaim = Boolean(claim);
  const hasMethod = Boolean(claim?.method);
  const hasVerifiedToken = Boolean(claim?.hasActiveToken || claim?.verifiedAt || member);
  const isLimited = member?.status === "LIMITED";
  const isVerified = member?.status === "VERIFIED";

  return [
    {
      num: 1,
      state: hasClaim ? "done" : "active",
      title: "Klaim diajukan",
      note: hasClaim ? "Klaim sudah tercatat di sistem." : "Pilih desa dan kirim klaim untuk memulai.",
    },
    {
      num: 2,
      state: !hasClaim ? "upcoming" : hasMethod ? "done" : "active",
      title: hasMethod && claim?.method === "WEBSITE_TOKEN" ? "Metode: Website" : "Metode: Email",
      note: !hasClaim
        ? "Tunggu klaim tercatat lebih dulu."
        : !hasMethod
        ? "Pilih metode verifikasi dan ikuti instruksinya."
        : claim?.method === "WEBSITE_TOKEN"
        ? "Token website sudah dipilih."
        : "Email verifikasi sudah dipilih.",
    },
    {
      num: 3,
      state: !hasMethod ? "upcoming" : hasVerifiedToken ? "done" : "active",
      title: claim?.method === "WEBSITE_TOKEN" ? "Token dicek di website" : "Email diverifikasi",
      note: !hasMethod
        ? "Selesaikan langkah 2 lebih dulu."
        : !hasVerifiedToken
        ? "Verifikasi masih menunggu. Cek email atau pasang token di website."
        : "Verifikasi berhasil. Status segera diperbarui.",
    },
    {
      num: 4,
      state: !hasVerifiedToken ? "upcoming" : isLimited || isVerified ? "done" : "active",
      title: isVerified ? "Admin terverifikasi aktif" : "Admin terbatas aktif",
      note: !hasVerifiedToken
        ? "Selesaikan verifikasi lebih dulu."
        : isVerified
        ? "Kamu sudah menjadi admin terverifikasi dan bisa mengundang admin lain."
        : "Akses admin terbatas sudah aktif. Selesaikan verifikasi untuk menjadi admin terverifikasi.",
    },
  ];
}

export function getAdminClaimTimelineSummary(steps: AdminClaimTimelineStep[]) {
  const doneCount = steps.filter((step) => step.state === "done").length;
  const activeIndex = steps.findIndex((step) => step.state === "active");
  const allDone = steps.every((step) => step.state === "done");
  return {
    doneCount,
    activeIndex,
    allDone,
    total: steps.length,
  };
}

export const TIMELINE_DOT_COLORS: Record<StepState, string> = {
  done: "bg-emerald-500",
  active: "bg-indigo-600",
  upcoming: "bg-slate-200",
};

export const TIMELINE_STATE_STYLES: Record<
  StepState,
  {
    dot: string;
    line: string;
    card: string;
    title: string;
    note: string;
    badge: string;
  }
> = {
  done: {
    dot: "bg-emerald-500 text-white ring-emerald-100",
    line: "bg-emerald-400",
    card: "border-emerald-100 bg-emerald-50",
    title: "text-emerald-800 font-bold",
    note: "text-emerald-600",
    badge: "bg-emerald-500 text-white",
  },
  active: {
    dot: "bg-indigo-600 text-white ring-indigo-100",
    line: "bg-slate-200",
    card: "border-indigo-100 bg-indigo-50",
    title: "text-indigo-800 font-bold",
    note: "text-indigo-600",
    badge: "bg-indigo-600 text-white",
  },
  upcoming: {
    dot: "bg-slate-200 text-slate-400 ring-slate-50",
    line: "bg-slate-100",
    card: "border-slate-100 bg-slate-50",
    title: "text-slate-400 font-semibold",
    note: "text-slate-400",
    badge: "bg-slate-200 text-slate-400",
  },
};
