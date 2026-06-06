import { describe, expect, it } from "vitest";
import {
  buildTemplateChangeNotifications,
  filterActiveAdminDesaNotificationRecipients,
} from "@/lib/admin-desa/template-change-notifications";

describe("template change notifications", () => {
  it("targets only affected active admin desa members", () => {
    const recipients = filterActiveAdminDesaNotificationRecipients([
      { userId: "verified", status: "VERIFIED" },
      { userId: "limited", status: "LIMITED" },
      { userId: "revoked", status: "REVOKED" },
      { userId: "expired", status: "EXPIRED" },
    ]);

    expect(recipients).toEqual(["verified", "limited"]);
  });

  it("builds template composition change notifications with affected component metadata", () => {
    const notifications = buildTemplateChangeNotifications({
      desaId: "desa-a",
      templateId: "tpl-a",
      templateName: "Template Umum Desa",
      recipientUserIds: ["verified", "limited"],
      addedComponentLabels: ["Agenda Desa"],
      removedComponentLabels: [],
    });

    expect(notifications).toHaveLength(2);
    expect(notifications[0]).toMatchObject({
      userId: "verified",
      desaId: "desa-a",
      type: "TEMPLATE_COMPONENTS_CHANGED",
      title: "Template data desa berubah",
    });
    expect(notifications[0].body).toContain("Agenda Desa");
    expect(notifications[0].metadata).toMatchObject({
      templateId: "tpl-a",
      templateName: "Template Umum Desa",
      addedComponentLabels: ["Agenda Desa"],
      removedComponentLabels: [],
    });
  });
});
