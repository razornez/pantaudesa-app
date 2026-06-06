import { getNoticeToneStyles } from "@/components/profil/admin-claim/adminClaimCopy";
import type { AdminClaimPageNotice } from "@/lib/admin-claim/eligibility";

export default function AdminClaimNotice({
  notice,
}: {
  notice: AdminClaimPageNotice | null;
}) {
  if (!notice) return null;

  return (
    <div className={`rounded-2xl border p-4 ${getNoticeToneStyles(notice.tone)}`}>
      <p className="text-sm font-black">{notice.title}</p>
      <p className="mt-1 text-sm leading-relaxed">{notice.message}</p>
    </div>
  );
}
