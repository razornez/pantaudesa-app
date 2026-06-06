export type DashboardPriorityTone = "critical" | "warning" | "good" | "info";

export interface DashboardOfficialReference {
  totalCount: number;
  sourceName: string;
  sourceUrl: string;
  sourceDate: string;
  lastCheckedAt: string;
}

export interface DashboardCoverageSummary {
  trackedDesaCount: number;
  officialTotalDesaCount: number;
  coveragePercent: number;
  sourceBackedDesaCount: number;
  fallbackDesaCount: number;
  noUsablePublicDataCount: number;
  officialReference: DashboardOfficialReference;
}

export interface DashboardAdminSummary {
  activeMemberCount: number;
  verifiedMemberCount: number;
  limitedMemberCount: number;
  desaWithVerifiedAdminCount: number;
  desaWithoutVerifiedAdminCount: number;
}

export interface DashboardDocumentSummary {
  waitingVerifiedApprovalCount: number;
  processingCount: number;
  publishedCount: number;
  rejectedCount: number;
  failedCount: number;
}

export interface DashboardComponentHealthRow {
  componentKey: string;
  label: string;
  totalFields: number;
  sourceBackedFields: number;
  fallbackFields: number;
  missingFields: number;
  sourceBackedRatio: number;
}

export interface DashboardQualitySummary {
  publishedFieldCount: number;
  sourceBackedFieldCount: number;
  fallbackFieldCount: number;
  components: DashboardComponentHealthRow[];
}

export interface DashboardPrioritySignal {
  id: string;
  tone: DashboardPriorityTone;
  eyebrow: string;
  title: string;
  description: string;
  href: string;
  ctaLabel: string;
}

export interface DashboardInsightStep {
  id: string;
  tone: DashboardPriorityTone;
  title: string;
  body: string;
  href: string;
  ctaLabel: string;
}

export interface DashboardTrafficState {
  kind: "unconfigured";
  title: string;
  body: string;
  providerLabel: string;
}

export interface InternalDashboardSummary {
  coverage: DashboardCoverageSummary;
  admins: DashboardAdminSummary;
  documents: DashboardDocumentSummary;
  quality: DashboardQualitySummary;
  priorities: DashboardPrioritySignal[];
  nextSteps: DashboardInsightStep[];
  traffic: DashboardTrafficState;
}

export type DashboardRankingPreset =
  | "least_complete"
  | "source_backed_best"
  | "most_comments"
  | "unresolved_comments"
  | "docs_pending"
  | "no_verified_admin"
  | "dummy_heavy"
  | "outdated";

export interface DashboardRankingFilters {
  q: string;
  provinsi: string;
  kabupaten: string;
  kecamatan: string;
  preset: DashboardRankingPreset | null;
}

export interface DashboardVillageRankingItem {
  desaId: string;
  desaSlug: string;
  desaName: string;
  locationLabel: string;
  dataStatusLabel: string;
  sourceBackedFields: number;
  fallbackFields: number;
  publishedFields: number;
  visibleFieldCount: number;
  completenessRatio: number;
  unresolvedVoiceCount: number;
  totalVoiceCount: number;
  pendingDocumentCount: number;
  rejectedDocumentCount: number;
  failedDocumentCount: number;
  verifiedAdminCount: number;
  lastPublishedAt: string | null;
  riskScore: number;
  summaryLabel: string;
  tone: DashboardPriorityTone;
  workHref: string;
  publicHref: string;
}

export interface InternalDashboardRankingResponse {
  filters: DashboardRankingFilters;
  items: DashboardVillageRankingItem[];
}
