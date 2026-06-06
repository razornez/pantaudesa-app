import { db } from "@/lib/db";
import type { AuditEventType } from "@/lib/admin-claim/audit-events";

export interface AuditPayload {
  eventType: AuditEventType;
  desaId?: string;
  actorUserId?: string;
  actorRole?: string;
  actorDisplayNameSnapshot?: string;
  targetUserId?: string;
  entityType?: string;
  entityId?: string;
  claimId?: string;
  method?: string;
  previousStatus?: string;
  nextStatus?: string;
  reasonCategory?: string;
  reasonText?: string;
  evidenceType?: string;
  evidenceUrl?: string;
  evidenceHash?: string;
  ipAddress?: string;
  userAgent?: string;
  location?: string;
  metadata?: Record<string, unknown>;
  beforeSnapshotJson?: Record<string, unknown>;
  afterSnapshotJson?: Record<string, unknown>;
}

export async function writeAuditEvent(payload: AuditPayload): Promise<void> {
  if (!db) {
    console.warn("[audit] DB unavailable — audit event not written:", payload.eventType);
    return;
  }
  try {
    await db.adminClaimAudit.create({
      data: {
        eventType:                payload.eventType,
        desaId:                   payload.desaId,
        actorUserId:              payload.actorUserId,
        actorRole:                payload.actorRole,
        actorDisplayNameSnapshot: payload.actorDisplayNameSnapshot,
        targetUserId:             payload.targetUserId,
        entityType:               payload.entityType,
        entityId:                 payload.entityId,
        claimId:                  payload.claimId,
        method:                   payload.method,
        previousStatus:           payload.previousStatus,
        nextStatus:               payload.nextStatus,
        reasonCategory:           payload.reasonCategory,
        reasonText:               payload.reasonText,
        evidenceType:             payload.evidenceType,
        evidenceUrl:              payload.evidenceUrl,
        evidenceHash:             payload.evidenceHash,
        ipAddress:                payload.ipAddress,
        userAgent:                payload.userAgent,
        location:                 payload.location,
        beforeSnapshotJson: payload.beforeSnapshotJson
          ? JSON.parse(JSON.stringify(payload.beforeSnapshotJson))
          : undefined,
        afterSnapshotJson: payload.afterSnapshotJson
          ? JSON.parse(JSON.stringify(payload.afterSnapshotJson))
          : undefined,
        metadata: payload.metadata ? JSON.parse(JSON.stringify(payload.metadata)) : undefined,
      },
    });
  } catch (err) {
    // Audit failure must never crash the main flow
    console.error("[audit] Failed to write audit event:", payload.eventType, err);
  }
}
