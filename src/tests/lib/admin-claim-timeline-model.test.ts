import { describe, expect, it } from "vitest";
import {
  buildAdminClaimTimelineSteps,
  getAdminClaimTimelineSummary,
} from "@/components/profil/admin-claim/adminClaimTimelineModel";

describe("admin claim timeline model", () => {
  it("starts with active first step when no claim exists", () => {
    const steps = buildAdminClaimTimelineSteps(null, null);
    const summary = getAdminClaimTimelineSummary(steps);

    expect(steps[0]?.state).toBe("active");
    expect(steps[1]?.state).toBe("upcoming");
    expect(summary.doneCount).toBe(0);
    expect(summary.activeIndex).toBe(0);
  });

  it("marks verified admin flow as fully done", () => {
    const steps = buildAdminClaimTimelineSteps(
      {
        id: "claim-1",
        desaId: "desa-1",
        desaName: "Desa Maju",
        status: "APPROVED",
        method: "WEBSITE_TOKEN",
        officialEmail: null,
        hasActiveToken: true,
        verifiedAt: new Date().toISOString(),
        websiteUrl: "https://desa.id",
        tokenExpiresAt: null,
        rejectedAt: null,
        rejectionReason: null,
      },
      {
        id: "member-1",
        desaId: "desa-1",
        desaName: "Desa Maju",
        status: "VERIFIED",
        role: "VERIFIED_ADMIN",
        joinedAt: new Date().toISOString(),
      }
    );

    const summary = getAdminClaimTimelineSummary(steps);

    expect(steps.every((step) => step.state === "done")).toBe(true);
    expect(summary.allDone).toBe(true);
    expect(summary.doneCount).toBe(4);
  });
});
