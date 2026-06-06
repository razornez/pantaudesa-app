import { createNotifications, NOTIF_TYPE } from "@/lib/notifications/create-notification";

export type AdminDesaTemplateRecipientStatus = "LIMITED" | "VERIFIED" | "REVOKED" | "EXPIRED";

export interface AdminDesaTemplateRecipient {
  userId: string;
  status: AdminDesaTemplateRecipientStatus;
}

export interface TemplateChangeNotificationInput {
  desaId: string;
  templateId: string;
  templateName: string;
  recipientUserIds: string[];
  addedComponentLabels: string[];
  removedComponentLabels: string[];
}

export interface TemplateAssignmentNotificationInput {
  desaId: string;
  templateId: string;
  templateName: string;
  recipientUserIds: string[];
}

export function filterActiveAdminDesaNotificationRecipients(
  recipients: AdminDesaTemplateRecipient[],
): string[] {
  return recipients
    .filter((recipient) => recipient.status === "VERIFIED" || recipient.status === "LIMITED")
    .map((recipient) => recipient.userId);
}

function describeComponentChange(input: TemplateChangeNotificationInput): string {
  const changes = [
    input.addedComponentLabels.length > 0
      ? `ditambahkan: ${input.addedComponentLabels.join(", ")}`
      : null,
    input.removedComponentLabels.length > 0
      ? `dicopot: ${input.removedComponentLabels.join(", ")}`
      : null,
  ].filter((item): item is string => Boolean(item));

  return changes.length > 0
    ? changes.join("; ")
    : "susunan atau urutan komponen diperbarui";
}

export function buildTemplateChangeNotifications(input: TemplateChangeNotificationInput) {
  const body = `Template ${input.templateName} berubah: ${describeComponentChange(input)}. Silakan cek format isian data desa terbaru.`;

  return input.recipientUserIds.map((userId) => ({
    userId,
    type: NOTIF_TYPE.TEMPLATE_COMPONENTS_CHANGED,
    title: "Template data desa berubah",
    body,
    desaId: input.desaId,
    metadata: {
      templateId: input.templateId,
      templateName: input.templateName,
      addedComponentLabels: input.addedComponentLabels,
      removedComponentLabels: input.removedComponentLabels,
    },
  }));
}

export function buildTemplateAssignmentNotifications(input: TemplateAssignmentNotificationInput) {
  return input.recipientUserIds.map((userId) => ({
    userId,
    type: NOTIF_TYPE.TEMPLATE_ASSIGNMENT_CHANGED,
    title: "Template desa diganti",
    body: `Template data desa sekarang memakai ${input.templateName}. Silakan cek format isian terbaru sebelum mengirim data.`,
    desaId: input.desaId,
    metadata: {
      templateId: input.templateId,
      templateName: input.templateName,
    },
  }));
}

export async function notifyTemplateComponentsChanged(
  input: TemplateChangeNotificationInput,
): Promise<void> {
  await createNotifications(buildTemplateChangeNotifications(input));
}

export async function notifyTemplateAssignmentChanged(
  input: TemplateAssignmentNotificationInput,
): Promise<void> {
  await createNotifications(buildTemplateAssignmentNotifications(input));
}
