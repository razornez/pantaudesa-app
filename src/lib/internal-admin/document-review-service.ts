import { db } from "@/lib/db";
import { Prisma } from "@/generated/prisma";
import { writeAuditEvent } from "@/lib/admin-claim/audit";
import { AUDIT_EVENT } from "@/lib/admin-claim/audit-events";
import {
  AI_MAPPABLE_DESA_SELECT,
  createAiMappingDraft,
  createDesaMappingUpdateData,
  generateManualMappingDraft,
  getMappingFieldKeys,
  readAiMappingDraft,
  sanitizeMappingFields,
  toAiMappingDraftJson,
  type AiMappingFieldValue,
} from "@/lib/admin-claim/ai-mapping";
import { createNotifications, createNotification, NOTIF_TYPE } from "@/lib/notifications/create-notification";
import {
  getChangedVersionFields,
  readVillageVersionCandidate,
  type DesaVersionSnapshot,
} from "@/lib/versioning/desa-versioning";
import {
  failVillageDataVersionForDocument,
  publishVillageDataVersion,
  syncReviewReadyVillageVersion,
  writeDesaDataAuditEvent,
} from "@/lib/versioning/village-data-persistence";
import {
  findDocumentForReview,
  getRequestActorMeta,
  toDesaVersionSnapshot,
} from "@/lib/internal-admin/document-review";
import { buildReviewCandidateForDocument } from "@/lib/internal-admin/review-candidate";
import {
  createActiveTemplateFieldBindingMap,
  resolveEffectiveTemplateFieldEngine,
} from "@/lib/village-data/field-engine";
import {
  validateDraftGenerationStatus,
  validateDraftSaveStatus,
  validateFailStatus,
  validatePublishStatus,
} from "@/lib/internal-admin/document-review-policy";
import type { DraftMappingPatchBody, PublishReviewBody } from "@/lib/internal-admin/document-review-validation";

type DbClient = Exclude<typeof db, null>;
type JsonishValue =
  | string
  | number
  | boolean
  | null
  | Prisma.InputJsonObject
  | Prisma.InputJsonArray;

interface ActorContext {
  userId: string;
  requestMeta: ReturnType<typeof getRequestActorMeta>;
}

function normalizeComparableValue(value: unknown) {
  if (value === null || value === undefined) return "__null__";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return JSON.stringify(value);
  return JSON.stringify(value);
}

function resolveRequestedFieldValidation(
  field: Awaited<ReturnType<typeof buildReviewCandidateForDocument>>["fields"][number],
  requestedValue: unknown,
) {
  const manualMatches =
    field.manualCandidate &&
    normalizeComparableValue(field.manualCandidate.value) === normalizeComparableValue(requestedValue);
  if (manualMatches) {
    const manualCandidate = field.manualCandidate;
    if (!manualCandidate) {
      return {
        status: field.validationStatus,
        message: field.validationMessage,
      };
    }
    return {
      status: manualCandidate.validationStatus,
      message: manualCandidate.validationMessage,
    };
  }

  const fetchedMatches =
    field.fetchedCandidate &&
    normalizeComparableValue(field.fetchedCandidate.value) === normalizeComparableValue(requestedValue);
  if (fetchedMatches) {
    const fetchedCandidate = field.fetchedCandidate;
    if (!fetchedCandidate) {
      return {
        status: field.validationStatus,
        message: field.validationMessage,
      };
    }
    return {
      status: fetchedCandidate.validationStatus,
      message: fetchedCandidate.validationMessage,
    };
  }

  if (!Object.hasOwn(field, "manualCandidate") && !Object.hasOwn(field, "fetchedCandidate")) {
    return {
      status: field.validationStatus,
      message: field.validationMessage,
    };
  }

  return {
    status: "invalid" as const,
    message: "Nilai publish tidak cocok dengan candidate review yang tersedia.",
  };
}

function resolvePublishValue(
  field: Awaited<ReturnType<typeof buildReviewCandidateForDocument>>["fields"][number],
  requestedFields: Record<string, AiMappingFieldValue>,
) {
  if (Object.hasOwn(requestedFields, field.fieldKey)) {
    return requestedFields[field.fieldKey] ?? null;
  }
  return field.proposedValue as AiMappingFieldValue;
}

type ServiceResult<T> =
  | { ok: true; data: T }
  | { ok: false; status: number; body: Record<string, unknown> };

function serviceError(status: number, error: string): ServiceResult<never> {
  return { ok: false, status, body: { error } };
}

function isFallbackReviewStatus(
  status: "WAITING_VERIFIED_APPROVAL" | "PROCESSING" | "PUBLISHED" | "REJECTED" | "FAILED",
) {
  return status === "WAITING_VERIFIED_APPROVAL";
}

function normalizeRequestedFieldKeys(input: unknown) {
  if (typeof input !== "object" || input === null || Array.isArray(input)) return [];
  return Object.keys(input);
}

function serializeDataDesaValue(value: JsonishValue) {
  if (value === null) {
    return {
      valueText: null,
      valueJson: Prisma.JsonNull as Prisma.NullableJsonNullValueInput,
    };
  }
  if (typeof value === "string") {
    return { valueText: value, valueJson: undefined };
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return { valueText: null, valueJson: value };
  }
  return { valueText: null, valueJson: value };
}

function toSourceLabel(inputMode: string, sourceTypeCode: string | null) {
  if (inputMode === "STRUCTURED_SUBMISSION") return "Admin Desa structured submission";
  if (inputMode === "INTERNAL_SOURCE_ENTRY") return "Internal source-backed input";
  if (inputMode === "SOURCE_INGESTION") return "Source ingestion";
  if (sourceTypeCode) return sourceTypeCode.replaceAll("_", " ").toLowerCase();
  return "Dokumen Admin Desa";
}

export async function createDocumentDraftMapping(params: {
  db: DbClient;
  documentId: string;
  actor: ActorContext;
}): Promise<
  ServiceResult<{
    reused: boolean;
    aiMappingStatus: string;
    draft: ReturnType<typeof generateManualMappingDraft>;
  }>
> {
  const doc = await findDocumentForReview(params.db, params.documentId);
  if (!doc) return serviceError(404, "Document not found");

  const statusError = validateDraftGenerationStatus(doc.status);
  if (statusError) return serviceError(statusError.status, statusError.error);

  const existingDraft = readAiMappingDraft(doc.aiMappingResult);
  if (existingDraft) {
    return {
      ok: true,
      data: {
        reused: true,
        aiMappingStatus: doc.aiMappingStatus ?? "DRAFT_READY_REVIEW",
        draft: existingDraft,
      },
    };
  }

  const draft = generateManualMappingDraft();

  await params.db.adminDesaDocument.update({
    where: { id: params.documentId },
    data: {
      aiMappingStatus: "DRAFT_PENDING_REVIEW",
      aiMappingResult: toAiMappingDraftJson(draft),
      updatedAt: new Date(),
    },
  });

  await writeAuditEvent({
    eventType: AUDIT_EVENT.INTERNAL_AI_MAPPING_RUN,
    desaId: doc.desaId,
    actorUserId: params.actor.userId,
    actorRole: "INTERNAL_ADMIN",
    entityType: "AdminDesaDocument",
    entityId: params.documentId,
    metadata: {
      title: doc.title,
      generator: draft.generator,
    },
    ...params.actor.requestMeta,
  });

  return {
    ok: true,
    data: {
      reused: false,
      aiMappingStatus: "DRAFT_PENDING_REVIEW",
      draft,
    },
  };
}

export async function saveDocumentDraftMapping(params: {
  db: DbClient;
  documentId: string;
  body: DraftMappingPatchBody;
  actor: ActorContext;
}): Promise<
  ServiceResult<{
    reused: boolean;
    aiMappingStatus: string;
    draft: ReturnType<typeof createAiMappingDraft>;
  }>
> {
  const doc = await findDocumentForReview(params.db, params.documentId);
  if (!doc) return serviceError(404, "Document not found");

  const statusError = validateDraftSaveStatus(doc.status);
  if (statusError) return serviceError(statusError.status, statusError.error);

  const existingDraft = readAiMappingDraft(doc.aiMappingResult) ?? generateManualMappingDraft();
  const nextDraft = createAiMappingDraft({
    generatedAt: existingDraft.generatedAt,
    generator: existingDraft.generator,
    fields: params.body.fields ?? existingDraft.fields,
    notes:
      typeof params.body.notes === "string" ? params.body.notes : existingDraft.notes,
  });

  await params.db.adminDesaDocument.update({
    where: { id: params.documentId },
    data: {
      aiMappingStatus: "DRAFT_READY_REVIEW",
      aiMappingResult: toAiMappingDraftJson(nextDraft),
      updatedAt: new Date(),
    },
  });

  const { buildVillageVersionCandidateForDesa } = await import("@/lib/versioning/desa-versioning");
  const draftVersionCandidate = await buildVillageVersionCandidateForDesa({
    desaId: doc.desaId,
    mappedFields: nextDraft.fields,
    createdAt: nextDraft.generatedAt,
  });

  const reviewReadyVersion = draftVersionCandidate
    ? await syncReviewReadyVillageVersion({
        desaId: doc.desaId,
        sourceDocumentId: params.documentId,
        title: doc.title,
        sourceLabel: "Draft review internal",
        reviewNote: nextDraft.notes ?? null,
        changedFields: draftVersionCandidate.changedFields,
        proposedSnapshot: draftVersionCandidate.proposedSnapshot,
        beforeSnapshot: draftVersionCandidate.baseSnapshot,
        createdByUserId: params.actor.userId,
      })
    : { persisted: false as const };

  await writeAuditEvent({
    eventType: AUDIT_EVENT.INTERNAL_DOCUMENT_REVIEWED,
    desaId: doc.desaId,
    actorUserId: params.actor.userId,
    actorRole: "INTERNAL_ADMIN",
    entityType: "AdminDesaDocument",
    entityId: params.documentId,
    metadata: {
      title: doc.title,
      action: "draft_saved",
      fieldCount: Object.keys(nextDraft.fields).length,
      versionNumber: reviewReadyVersion.versionNumber ?? null,
    },
    ...params.actor.requestMeta,
  });

  await writeDesaDataAuditEvent({
    desaId: doc.desaId,
    sourceDocumentId: params.documentId,
    villageDataVersionId: reviewReadyVersion.id ?? null,
    actorUserId: params.actor.userId,
    actorRole: "INTERNAL_ADMIN",
    eventType: AUDIT_EVENT.INTERNAL_DOCUMENT_REVIEWED,
    eventLabel: "Draft review disimpan",
    previousStatus: doc.status,
    nextStatus: doc.status,
    note: nextDraft.notes ?? null,
    metadata: {
      title: doc.title,
      action: "draft_saved",
      fieldCount: Object.keys(nextDraft.fields).length,
      versionNumber: reviewReadyVersion.versionNumber ?? null,
    },
  });

  return {
    ok: true,
    data: {
      reused: true,
      aiMappingStatus: "DRAFT_READY_REVIEW",
      draft: nextDraft,
    },
  };
}

export async function publishReviewedDocument(params: {
  db: DbClient;
  documentId: string;
  body: PublishReviewBody;
  actor: ActorContext;
}): Promise<
  ServiceResult<{
    documentId: string;
    newStatus: "PUBLISHED";
    versionNumber: number;
    appliedFields: string[];
  }>
> {
  const requestedFields = sanitizeMappingFields(params.body.fields);
  const note = params.body.note;
  const doc = await params.db.adminDesaDocument.findUnique({
    where: { id: params.documentId },
    select: {
      id: true,
      desaId: true,
      status: true,
      title: true,
      inputMode: true,
      sourceTypeCode: true,
      sourceUrl: true,
      sourceRegistryId: true,
      sourceEvidenceJson: true,
      normalizedSourceText: true,
      structuredValuesJson: true,
      aiMappingStatus: true,
      aiMappingResult: true,
      uploadedById: true,
    },
  });
  if (!doc) return serviceError(404, "Document not found");

  const statusError = validatePublishStatus(doc.status);
  if (statusError) return serviceError(statusError.status, statusError.error);

  const candidate = await buildReviewCandidateForDocument({
    desaId: doc.desaId,
    inputMode: doc.inputMode,
    sourceTypeCode: doc.sourceTypeCode,
    sourceUrl: doc.sourceUrl,
    sourceRegistryId: doc.sourceRegistryId,
    sourceEvidenceJson: doc.sourceEvidenceJson,
    normalizedSourceText: doc.normalizedSourceText,
    structuredValuesJson: doc.structuredValuesJson,
    aiMappingResult: doc.aiMappingResult,
  });
  const activeTemplateEngine = await resolveEffectiveTemplateFieldEngine(doc.desaId);
  const activeFieldBindings = createActiveTemplateFieldBindingMap(activeTemplateEngine);

  const requestedFieldKeys = normalizeRequestedFieldKeys(params.body.fields);
  const requestedFieldKeySet = new Set(
    requestedFieldKeys.length > 0 ? requestedFieldKeys : candidate.fields.map((field) => field.fieldKey),
  );

  const invalidRequestedField = candidate.fields.find(
    (field) => {
      if (!requestedFieldKeySet.has(field.fieldKey)) return false;
      const requestedValue = resolvePublishValue(field, requestedFields);
      const validation = resolveRequestedFieldValidation(field, requestedValue);
      return validation.status !== "valid";
    },
  );
  if (invalidRequestedField) {
    const validation = resolveRequestedFieldValidation(
      invalidRequestedField,
      resolvePublishValue(invalidRequestedField, requestedFields),
    );
    return serviceError(
      422,
      validation.message ??
        `Field ${invalidRequestedField.fieldLabel} belum siap dipublish.`,
    );
  }

  const publishableCandidateFields = candidate.fields.filter(
    (field) => {
      if (!requestedFieldKeySet.has(field.fieldKey)) return false;
      const requestedValue = resolvePublishValue(field, requestedFields);
      const validation = resolveRequestedFieldValidation(field, requestedValue);
      return validation.status === "valid";
    },
  );
  const fieldWithoutActiveBinding = publishableCandidateFields.find((field) => {
    const binding = activeFieldBindings.get(field.fieldKey);
    return !binding?.componentId || !binding.fieldStandardId;
  });
  if (fieldWithoutActiveBinding) {
    return serviceError(
      422,
      `Field ${fieldWithoutActiveBinding.fieldLabel} belum sinkron dengan template aktif desa.`,
    );
  }
  const boundPublishableCandidateFields = publishableCandidateFields.map((field) => {
    const binding = activeFieldBindings.get(field.fieldKey)!;
    return {
      ...field,
      componentId: binding.componentId,
      fieldStandardId: binding.fieldStandardId,
      componentKey: binding.componentKey,
      componentLabel: binding.componentLabel,
      valueType: binding.valueType,
      isPublishableNow: binding.isPublishableNow,
    };
  });
  if (publishableCandidateFields.length === 0) {
    return serviceError(422, "Tidak ada field source-backed yang siap dipublish.");
  }

  const result = await params.db.$transaction(async (tx) => {
    const now = new Date();
    const fallbackVersionNumber = (await tx.adminClaimAudit.count({
      where: {
        desaId: doc.desaId,
        eventType: AUDIT_EVENT.INTERNAL_DATA_PUBLISHED,
      },
    })) + 1;

    let beforeSnapshot: Record<string, string | number | null> | null = null;
    let afterSnapshot: Record<string, string | number | null> | null = null;
    let fullBeforeSnapshot: DesaVersionSnapshot | null = null;
    let publishedSnapshot: DesaVersionSnapshot | null = null;

    const fieldKeys = getMappingFieldKeys(requestedFields);
    const desaBefore = await tx.desa.findUnique({
      where: { id: doc.desaId },
      select: AI_MAPPABLE_DESA_SELECT,
    });

    if (!desaBefore) {
      return { kind: "error" as const, status: 404, body: { error: "Desa not found" } };
    }

    fullBeforeSnapshot = toDesaVersionSnapshot(desaBefore);
    publishedSnapshot = { ...fullBeforeSnapshot };

    const beforeSnapshotMap: Record<string, string | number | null> = {};
    const afterSnapshotMap: Record<string, string | number | null> = {};

    for (const field of boundPublishableCandidateFields) {
      const publishValue = resolvePublishValue(field, requestedFields);
      beforeSnapshotMap[field.fieldKey] =
        field.currentValue === null ||
        typeof field.currentValue === "string" ||
        typeof field.currentValue === "number"
          ? (field.currentValue as string | number | null)
          : field.currentValuePreview;
      afterSnapshotMap[field.fieldKey] =
        publishValue === null ||
        typeof publishValue === "string" ||
        typeof publishValue === "number"
          ? (publishValue as string | number | null)
          : JSON.stringify(publishValue);
    }

    if (fieldKeys.length > 0) {
      beforeSnapshot = {};
      afterSnapshot = {};
      for (const key of fieldKeys) {
        const before = desaBefore[key];
        const after = requestedFields[key] ?? null;
        beforeSnapshot[key] =
          before === null || before === undefined
            ? null
            : typeof before === "string" || typeof before === "number"
              ? before
              : String(before);
        afterSnapshot[key] = after;
        publishedSnapshot[key] = after as AiMappingFieldValue;
      }
    }

    const mappingUpdateData = createDesaMappingUpdateData(requestedFields);

    for (const field of boundPublishableCandidateFields) {
      if (!field.componentId) continue;
      await tx.dataDesa.updateMany({
        where: {
          desaId: doc.desaId,
          componentId: field.componentId,
          fieldKey: field.fieldKey,
          isActive: true,
        },
        data: {
          isActive: false,
          status: "ARCHIVED",
          updatedAt: now,
        },
      });

      const serialized = serializeDataDesaValue(resolvePublishValue(field, requestedFields) as JsonishValue);
      await tx.dataDesa.create({
        data: {
          desaId: doc.desaId,
          templateId: activeTemplateEngine.resolvedTemplate.templateId,
          componentId: field.componentId,
          fieldStandardId: field.fieldStandardId,
          fieldKey: field.fieldKey,
          valueText: serialized.valueText,
          valueJson: serialized.valueJson,
          sourceId: doc.sourceRegistryId,
          sourceDocumentId: params.documentId,
          sourceUrl: doc.sourceUrl,
          sourceRegistryId: doc.sourceRegistryId,
          sourceTypeCode: doc.sourceTypeCode,
          sourceEvidenceJson:
            typeof doc.sourceEvidenceJson === "object" && doc.sourceEvidenceJson !== null
              ? doc.sourceEvidenceJson
              : undefined,
          sourceLabel: toSourceLabel(doc.inputMode, doc.sourceTypeCode),
          reviewNote: note,
          status: "PUBLISHED",
          isActive: true,
          publishedAt: now,
          reviewedById: params.actor.userId,
        },
      });
    }

    await tx.desa.update({
      where: { id: doc.desaId },
      data: {
        ...(fieldKeys.length > 0 ? mappingUpdateData : {}),
        dataSourceLabel: toSourceLabel(doc.inputMode, doc.sourceTypeCode),
        dataPublishedAt: now,
      },
    });

    await tx.adminDesaDocument.update({
      where: { id: params.documentId },
      data: {
        status: "PUBLISHED",
        publishedAt: now,
        aiMappingStatus: "DONE",
        updatedAt: now,
      },
    });

    const versionCandidate = readVillageVersionCandidate(doc.aiMappingResult);
    const effectivePublishedSnapshot = publishedSnapshot ?? fullBeforeSnapshot;
    const versionResult = effectivePublishedSnapshot
      ? await publishVillageDataVersion(
          {
            desaId: doc.desaId,
            sourceDocumentId: params.documentId,
            title: doc.title,
            sourceLabel: "Dokumen Admin Desa",
            reviewNote: note,
            changedFields: getChangedVersionFields({
              before: fullBeforeSnapshot,
              after: effectivePublishedSnapshot,
            }),
            proposedSnapshot:
              versionCandidate?.proposedSnapshot ?? effectivePublishedSnapshot,
            beforeSnapshot: fullBeforeSnapshot,
            publishedSnapshot: effectivePublishedSnapshot,
            createdByUserId: params.actor.userId,
            publishedByUserId: params.actor.userId,
            publishedAt: now,
          },
          tx,
        )
      : { persisted: false as const };

    return {
      kind: "ok" as const,
      beforeSnapshot: Object.keys(beforeSnapshotMap).length > 0 ? beforeSnapshotMap : beforeSnapshot,
      afterSnapshot: Object.keys(afterSnapshotMap).length > 0 ? afterSnapshotMap : afterSnapshot,
      fallbackVersionNumber,
      versionResult,
      appliedFields: publishableCandidateFields.map((field) => field.fieldKey),
      templateId: activeTemplateEngine.resolvedTemplate.templateId,
    };
  });

  if (result.kind === "error") {
    return { ok: false, status: result.status, body: result.body };
  }

  await writeAuditEvent({
    eventType: AUDIT_EVENT.INTERNAL_DATA_PUBLISHED,
    desaId: doc.desaId,
    actorUserId: params.actor.userId,
    actorRole: "INTERNAL_ADMIN",
    entityType: "AdminDesaDocument",
    entityId: params.documentId,
    previousStatus: doc.status,
    nextStatus: "PUBLISHED",
    reasonText: note ?? undefined,
    beforeSnapshotJson: result.beforeSnapshot ?? undefined,
    afterSnapshotJson: result.afterSnapshot ?? undefined,
    metadata: {
      title: doc.title,
      versionNumber: result.versionResult.versionNumber ?? result.fallbackVersionNumber,
      appliedFieldCount: result.appliedFields.length,
      templateId: result.templateId,
      beforeSnapshot: result.beforeSnapshot,
      afterSnapshot: result.afterSnapshot,
      reviewMode: isFallbackReviewStatus(doc.status) ? "internal_admin_fallback" : "standard",
    },
    ...params.actor.requestMeta,
  });

  await writeDesaDataAuditEvent({
    desaId: doc.desaId,
    sourceDocumentId: params.documentId,
    villageDataVersionId: result.versionResult.id ?? null,
    actorUserId: params.actor.userId,
    actorRole: "INTERNAL_ADMIN",
    eventType: AUDIT_EVENT.INTERNAL_DATA_PUBLISHED,
    eventLabel: isFallbackReviewStatus(doc.status)
      ? "Dipublikasikan via fallback admin internal"
      : "Dipublikasikan ke data desa",
    previousStatus: doc.status,
    nextStatus: "PUBLISHED",
    note: note,
    metadata: {
      title: doc.title,
      versionNumber: result.versionResult.versionNumber ?? result.fallbackVersionNumber,
      appliedFieldCount: result.appliedFields.length,
      templateId: result.templateId,
      reviewMode: isFallbackReviewStatus(doc.status) ? "internal_admin_fallback" : "standard",
    },
  });

  const activeAdmins = await params.db.desaAdminMember.findMany({
    where: { desaId: doc.desaId, status: { in: ["LIMITED", "VERIFIED"] } },
    select: { userId: true },
  });
  const recipientIds = new Set(activeAdmins.map((item) => item.userId));
  if (doc.uploadedById) recipientIds.add(doc.uploadedById);

  await createNotifications(
    Array.from(recipientIds).map((uid) => ({
      userId: uid,
      type: NOTIF_TYPE.DOCUMENT_PUBLISHED,
      title: "Dokumen dipublikasikan",
      body: `"${doc.title}" telah ditinjau dan dipublikasikan oleh tim PantauDesa. Data desa diperbarui sesuai isi dokumen.`,
      desaId: doc.desaId,
      metadata: {
        documentId: params.documentId,
        inputMode: doc.inputMode,
        sourceTypeCode: doc.sourceTypeCode,
      },
    })),
  );

  return {
    ok: true,
    data: {
      documentId: params.documentId,
      newStatus: "PUBLISHED",
      versionNumber: result.versionResult.versionNumber ?? result.fallbackVersionNumber,
      appliedFields: result.appliedFields,
    },
  };
}

export async function markDocumentReviewFailed(params: {
  db: DbClient;
  documentId: string;
  reason: string;
  actor: ActorContext;
}): Promise<ServiceResult<{ documentId: string; newStatus: "FAILED" }>> {
  const doc = await params.db.adminDesaDocument.findUnique({
    where: { id: params.documentId },
    select: { id: true, desaId: true, status: true, title: true, uploadedById: true },
  });

  if (!doc) return serviceError(404, "Document not found");

  const statusError = validateFailStatus(doc.status);
  if (statusError) return serviceError(statusError.status, statusError.error);

  const now = new Date();
  await params.db.adminDesaDocument.update({
    where: { id: params.documentId },
    data: {
      status: "FAILED",
      failedReason: params.reason,
      aiMappingStatus: "FAILED",
      updatedAt: now,
    },
  });

  await writeAuditEvent({
    eventType: AUDIT_EVENT.INTERNAL_DOCUMENT_FAILED,
    desaId: doc.desaId,
    actorUserId: params.actor.userId,
    actorRole: "INTERNAL_ADMIN",
    entityType: "AdminDesaDocument",
    entityId: params.documentId,
    previousStatus: doc.status,
    nextStatus: "FAILED",
    reasonText: params.reason,
    metadata: { title: doc.title },
    ...params.actor.requestMeta,
  });

  const failedVersion = await failVillageDataVersionForDocument({
    sourceDocumentId: params.documentId,
    reason: params.reason,
  });

  await writeDesaDataAuditEvent({
    desaId: doc.desaId,
    sourceDocumentId: params.documentId,
    villageDataVersionId: failedVersion.id ?? null,
    actorUserId: params.actor.userId,
    actorRole: "INTERNAL_ADMIN",
    eventType: AUDIT_EVENT.INTERNAL_DOCUMENT_FAILED,
    eventLabel: isFallbackReviewStatus(doc.status)
      ? "Ditolak via fallback admin internal"
      : "Ditandai gagal",
    previousStatus: doc.status,
    nextStatus: "FAILED",
    note: params.reason,
    metadata: {
      title: doc.title,
      versionNumber: failedVersion.versionNumber ?? null,
      reviewMode: isFallbackReviewStatus(doc.status) ? "internal_admin_fallback" : "standard",
    },
  });

  if (doc.uploadedById) {
    await createNotification({
      userId: doc.uploadedById,
      type: NOTIF_TYPE.DOCUMENT_FAILED,
      title: "Dokumen ditandai gagal",
      body: `"${doc.title}" tidak dapat diproses. Alasan: ${params.reason}`,
      desaId: doc.desaId,
      metadata: { documentId: params.documentId, reason: params.reason },
    });
  }

  return {
    ok: true,
    data: {
      documentId: params.documentId,
      newStatus: "FAILED",
    },
  };
}
