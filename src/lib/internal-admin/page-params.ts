import {
  VALID_CLAIM_STATUSES,
  VALID_INTERNAL_DOCUMENT_STATUSES,
} from "./constants";

export type ClaimQueueStatus = (typeof VALID_CLAIM_STATUSES)[number];
export type InternalDocumentStatus =
  (typeof VALID_INTERNAL_DOCUMENT_STATUSES)[number];
export type RenewalStateFilter = "ALL" | "OVERDUE" | "DUE_SOON";

export interface ClaimsPageInput {
  page: number;
  statusFilter: string;
  desaId: string;
}

export function parseDocumentStatusFilter(status?: string): InternalDocumentStatus | null {
  return status && (VALID_INTERNAL_DOCUMENT_STATUSES as readonly string[]).includes(status)
    ? (status as InternalDocumentStatus)
    : null;
}

export function parseFocusDocumentId(focus?: string): string {
  return typeof focus === "string" ? focus : "";
}

export function parseClaimsPageInput(params: { status?: string; page?: string; desaId?: string }): ClaimsPageInput {
  return {
    page: Math.max(1, Number.parseInt(params.page ?? "1", 10)),
    statusFilter: params.status ?? "",
    desaId: params.desaId ?? "",
  };
}

export function parseClaimStatuses(statusFilter: string): readonly ClaimQueueStatus[] {
  return statusFilter && VALID_CLAIM_STATUSES.includes(statusFilter as ClaimQueueStatus)
    ? [statusFilter as ClaimQueueStatus]
    : VALID_CLAIM_STATUSES;
}

export function parseRenewalStateFilter(state?: string): RenewalStateFilter {
  return state === "OVERDUE" || state === "DUE_SOON" ? state : "ALL";
}
