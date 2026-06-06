import type {
  AdminClaimProfileData,
  AdminClaimProfileSummaryData,
} from "@/lib/data/admin-claim-read";
import type { AdminClaimProfileDetail } from "@/lib/admin-claim/profile-cache";

export async function fetchAdminClaimProfile({
  detail = "full",
  signal,
}: {
  detail?: AdminClaimProfileDetail;
  signal?: AbortSignal;
}) {
  const response = await fetch(`/api/admin-claim/profile?detail=${detail}`, { signal });

  if (!response.ok) {
    throw new Error(`admin claim profile load failed: ${response.status}`);
  }

  return (await response.json()) as AdminClaimProfileSummaryData | AdminClaimProfileData;
}
