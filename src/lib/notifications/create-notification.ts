import { db } from "@/lib/db";

// Notification type constants — match what AdminDesaNotifikasiClient renders icons for.
export const NOTIF_TYPE = {
  DOCUMENT_UPLOADED_WAITING:  "DOCUMENT_UPLOADED_WAITING",   // to VERIFIED admins
  DOCUMENT_APPROVED:          "DOCUMENT_APPROVED",            // to uploader
  DOCUMENT_REJECTED:          "DOCUMENT_REJECTED",            // to uploader
  DOCUMENT_PUBLISHED:         "DOCUMENT_PUBLISHED",           // to uploader
  DOCUMENT_FAILED:            "DOCUMENT_FAILED",              // to uploader
  INVITE_ACCEPTED:            "INVITE_ACCEPTED",              // to inviter
  RENEWAL_REMINDER:           "RENEWAL_REMINDER",             // to member
  RENEWAL_EXPIRED:            "RENEWAL_EXPIRED",              // to member
  CLAIM_SUBMITTED:            "CLAIM_SUBMITTED",              // internal only (no in-app)
  CLAIM_APPROVED:             "CLAIM_APPROVED",               // to claimant
  CLAIM_REJECTED:             "CLAIM_REJECTED",               // to claimant
  VOICE_CREATED:              "VOICE_CREATED",                // to active desa admins
  VOICE_REPLY_CREATED:        "VOICE_REPLY_CREATED",          // to active desa admins / voice author
  VOICE_VOTED:                "VOICE_VOTED",                  // to active desa admins
  VOICE_HELPFUL:              "VOICE_HELPFUL",                // to active desa admins / voice author
  TEMPLATE_COMPONENTS_CHANGED: "TEMPLATE_COMPONENTS_CHANGED",  // to affected active desa admins
  TEMPLATE_ASSIGNMENT_CHANGED: "TEMPLATE_ASSIGNMENT_CHANGED",  // to affected active desa admins
} as const;

export type NotifType = typeof NOTIF_TYPE[keyof typeof NOTIF_TYPE];

interface CreateNotifInput {
  userId: string;
  type: NotifType;
  title: string;
  body: string;
  desaId?: string | null;
  metadata?: Record<string, unknown>;
}

/**
 * Fire-and-forget in-app notification creation.
 * Errors are logged but never thrown — notification failure must never
 * break the calling transaction or response.
 */
export async function createNotification(input: CreateNotifInput): Promise<void> {
  if (!db) return;
  try {
    await db.adminDesaNotification.create({
      data: {
        userId: input.userId,
        type: input.type,
        title: input.title,
        body: input.body,
        desaId: input.desaId ?? null,
        channel: "in_app",
        metadata: (input.metadata ?? undefined) as never,
        sentAt: new Date(),
      },
    });
  } catch (err) {
    // Intentionally silent: notification loss is acceptable, transaction failure is not.
    console.error("[createNotification] failed:", err);
  }
}

/**
 * Bulk create notifications for multiple recipients.
 * Same fire-and-forget guarantee.
 */
export async function createNotifications(inputs: CreateNotifInput[]): Promise<void> {
  if (!db || inputs.length === 0) return;
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (db.adminDesaNotification.createMany as any)({
      data: inputs.map((i) => ({
        userId: i.userId,
        type: i.type,
        title: i.title,
        body: i.body,
        desaId: i.desaId ?? null,
        channel: "in_app",
        metadata: i.metadata ?? undefined,
        sentAt: new Date(),
      })),
    });
  } catch (err) {
    console.error("[createNotifications] failed:", err);
  }
}
