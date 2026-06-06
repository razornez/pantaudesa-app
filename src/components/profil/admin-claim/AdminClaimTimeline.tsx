import type { AdminClaimActiveClaim, AdminClaimActiveMember } from "@/lib/data/admin-claim-read";
import { AdminClaimTimelineCompact } from "./AdminClaimTimelineCompact";
import { AdminClaimTimelineFull } from "./AdminClaimTimelineFull";
import {
  buildAdminClaimTimelineSteps,
  getAdminClaimTimelineSummary,
} from "./adminClaimTimelineModel";

export default function AdminClaimTimeline({
  claim,
  member,
  compact = false,
}: {
  claim: AdminClaimActiveClaim | null;
  member: AdminClaimActiveMember | null;
  compact?: boolean;
}) {
  const steps = buildAdminClaimTimelineSteps(claim, member);
  const { doneCount, activeIndex, allDone, total } = getAdminClaimTimelineSummary(steps);

  if (compact) {
    return (
      <AdminClaimTimelineCompact
        steps={steps}
        doneCount={doneCount}
        activeIndex={activeIndex}
        allDone={allDone}
        total={total}
      />
    );
  }
  return <AdminClaimTimelineFull steps={steps} activeIndex={activeIndex} allDone={allDone} />;
}
