import {
  CLAIM_STATUS_BADGE_TEXT,
  CLAIM_STATUS_COPY,
} from "@/components/profil/admin-claim/adminClaimCopy";
import type { AdminClaimStateCard } from "@/lib/data/admin-claim-read";

export default function ClaimStatusBadge({
  status,
  compact = false,
}: {
  status: AdminClaimStateCard["status"];
  compact?: boolean;
}) {
  const copy = CLAIM_STATUS_COPY[status];
  const label = CLAIM_STATUS_BADGE_TEXT[status];

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-wide ${copy.tone}`}
      title={label.full}
    >
      {compact ? label.short : label.full}
    </span>
  );
}
