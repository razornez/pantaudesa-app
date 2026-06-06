import {
  COMPONENT_LABEL_FALLBACKS,
  DASHBOARD_TRAFFIC_EMPTY_STATE,
  INDONESIA_DESA_REFERENCE,
  INTERNAL_DASHBOARD_ROUTE,
} from "./dashboard-constants";
import type {
  DashboardAdminSummary,
  DashboardComponentHealthRow,
  DashboardDocumentSummary,
  DashboardInsightStep,
  DashboardPrioritySignal,
  DashboardPriorityTone,
  DashboardRankingFilters,
  DashboardVillageRankingItem,
  DashboardQualitySummary,
  InternalDashboardSummary,
} from "./dashboard-types";

interface SummaryDesaRow {
  id: string;
  nama: string;
  slug: string;
  provinsi: string;
  kabupaten: string;
  kecamatan: string;
  dataStatus: string;
  dataPublishedAt: Date | null;
}

interface PublishedFieldRow {
  desaId: string;
  sourceId: string | null;
  componentKey: string;
  componentLabel: string;
}

interface AdminMemberRow {
  desaId: string;
  status: string;
}

interface DocumentRow {
  desaId: string;
  status: string;
}

interface VoiceRow {
  desaId: string;
  status: string;
}

interface TemplateFieldCatalogRow {
  componentKey: string;
  label: string;
  fieldCount: number;
}

type RankingDesaRow = SummaryDesaRow;

interface TemplateVisibilityRow {
  desaId: string;
  componentId: string;
  isVisible: boolean;
}

interface TemplateAssignmentRow {
  desaId: string;
  components: Array<{
    id: string;
    componentKey: string;
    label: string;
    isDefaultVisible: boolean;
    fieldCount: number;
  }>;
}

interface VillageMetric {
  publishedFields: number;
  sourceBackedFields: number;
  fallbackFields: number;
  verifiedAdminCount: number;
  limitedAdminCount: number;
  pendingDocuments: number;
  rejectedDocuments: number;
  failedDocuments: number;
  processingDocuments: number;
  totalVoices: number;
  unresolvedVoices: number;
}

function clampPercent(value: number): number {
  if (!Number.isFinite(value) || value < 0) return 0;
  if (value > 100) return 100;
  return Number.parseFloat(value.toFixed(1));
}

function componentLabelFor(key: string): string {
  return (
    COMPONENT_LABEL_FALLBACKS.find((item) => item.componentKey === key)?.label ??
    key.replace(/_/g, " ")
  );
}

function toneWeight(tone: DashboardPriorityTone): number {
  switch (tone) {
    case "critical":
      return 4;
    case "warning":
      return 3;
    case "good":
      return 2;
    default:
      return 1;
  }
}

function sortPrioritySignals(items: DashboardPrioritySignal[]): DashboardPrioritySignal[] {
  return items.sort((left, right) => toneWeight(right.tone) - toneWeight(left.tone));
}

function buildVillageMetricMap(
  desaIds: string[],
  publishedFields: PublishedFieldRow[],
  members: AdminMemberRow[],
  documents: DocumentRow[],
  voices: VoiceRow[],
): Map<string, VillageMetric> {
  const metricMap = new Map<string, VillageMetric>();

  for (const desaId of desaIds) {
    metricMap.set(desaId, {
      publishedFields: 0,
      sourceBackedFields: 0,
      fallbackFields: 0,
      verifiedAdminCount: 0,
      limitedAdminCount: 0,
      pendingDocuments: 0,
      rejectedDocuments: 0,
      failedDocuments: 0,
      processingDocuments: 0,
      totalVoices: 0,
      unresolvedVoices: 0,
    });
  }

  for (const row of publishedFields) {
    const entry = metricMap.get(row.desaId);
    if (!entry) continue;
    entry.publishedFields += 1;
    if (row.sourceId) {
      entry.sourceBackedFields += 1;
    } else {
      entry.fallbackFields += 1;
    }
  }

  for (const member of members) {
    const entry = metricMap.get(member.desaId);
    if (!entry) continue;
    if (member.status === "VERIFIED") entry.verifiedAdminCount += 1;
    if (member.status === "LIMITED") entry.limitedAdminCount += 1;
  }

  for (const document of documents) {
    const entry = metricMap.get(document.desaId);
    if (!entry) continue;
    if (
      document.status === "WAITING_VERIFIED_APPROVAL" ||
      document.status === "PROCESSING"
    ) {
      entry.pendingDocuments += 1;
    }
    if (document.status === "PROCESSING") entry.processingDocuments += 1;
    if (document.status === "REJECTED") entry.rejectedDocuments += 1;
    if (document.status === "FAILED") entry.failedDocuments += 1;
  }

  for (const voice of voices) {
    const entry = metricMap.get(voice.desaId);
    if (!entry) continue;
    entry.totalVoices += 1;
    if (voice.status !== "RESOLVED") entry.unresolvedVoices += 1;
  }

  return metricMap;
}

function buildVisibleFieldCountMap(
  desaIds: string[],
  assignments: TemplateAssignmentRow[],
  overrides: TemplateVisibilityRow[],
): Map<string, number> {
  const overrideMap = new Map<string, Map<string, boolean>>();
  for (const override of overrides) {
    const desaMap = overrideMap.get(override.desaId) ?? new Map<string, boolean>();
    desaMap.set(override.componentId, override.isVisible);
    overrideMap.set(override.desaId, desaMap);
  }

  const visibleFieldCountMap = new Map<string, number>();
  for (const desaId of desaIds) {
    visibleFieldCountMap.set(desaId, 0);
  }

  for (const assignment of assignments) {
    const desaOverrideMap = overrideMap.get(assignment.desaId) ?? new Map<string, boolean>();
    const visibleCount = assignment.components.reduce((total, component) => {
      const isVisible = desaOverrideMap.has(component.id)
        ? desaOverrideMap.get(component.id) === true
        : component.isDefaultVisible;
      return total + (isVisible ? component.fieldCount : 0);
    }, 0);
    visibleFieldCountMap.set(assignment.desaId, visibleCount);
  }

  return visibleFieldCountMap;
}

function buildDataStatusLabel(
  publishedFields: number,
  sourceBackedFields: number,
  dataStatus: string,
): string {
  if (sourceBackedFields > 0) return "Source-backed tersedia";
  if (publishedFields > 0) return "Masih fallback/dummy";
  if (dataStatus === "verified") return "Perlu cek publish";
  return "Belum ada data publik siap pakai";
}

function buildVillageTone(metric: VillageMetric, completenessRatio: number): DashboardPriorityTone {
  if (
    metric.verifiedAdminCount === 0 ||
    metric.failedDocuments > 0 ||
    completenessRatio < 35
  ) {
    return "critical";
  }
  if (
    metric.pendingDocuments > 0 ||
    metric.unresolvedVoices > 0 ||
    completenessRatio < 70
  ) {
    return "warning";
  }
  return "good";
}

function buildVillageRiskScore(metric: VillageMetric, completenessRatio: number): number {
  return Math.max(
    0,
    Math.min(
      100,
      Math.round(
        100 -
          completenessRatio +
          metric.pendingDocuments * 9 +
          metric.rejectedDocuments * 6 +
          metric.failedDocuments * 10 +
          metric.unresolvedVoices * 4 +
          (metric.verifiedAdminCount === 0 ? 18 : 0),
      ),
    ),
  );
}

function buildOutdatedDays(date: Date | null): number {
  if (!date) return Number.MAX_SAFE_INTEGER;
  const diffMs = Date.now() - date.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

function buildVillageSummaryLabel(
  preset: DashboardRankingFilters["preset"],
  metric: VillageMetric,
  completenessRatio: number,
  visibleFieldCount: number,
  lastPublishedAt: Date | null,
): string {
  switch (preset) {
    case "least_complete":
      return `${Math.round(completenessRatio)}% lengkap · ${metric.sourceBackedFields}/${visibleFieldCount || 0} field source-backed`;
    case "source_backed_best":
      return `${metric.sourceBackedFields} field source-backed · ${Math.round(completenessRatio)}% siap tampil`;
    case "most_comments":
      return `${metric.totalVoices} suara warga · ${metric.unresolvedVoices} belum selesai`;
    case "unresolved_comments":
      return `${metric.unresolvedVoices} suara belum selesai · ${metric.totalVoices} total sinyal`;
    case "docs_pending":
      return `${metric.pendingDocuments} dokumen menunggu aksi · ${metric.processingDocuments} sedang diproses`;
    case "no_verified_admin":
      return metric.verifiedAdminCount === 0
        ? `${metric.limitedAdminCount} admin terbatas · belum ada verified`
        : `${metric.verifiedAdminCount} admin verified aktif`;
    case "dummy_heavy":
      return `${metric.fallbackFields} field fallback · ${metric.sourceBackedFields} source-backed`;
    case "outdated":
      return lastPublishedAt
        ? `Update terakhir ${buildOutdatedDays(lastPublishedAt)} hari lalu`
        : "Belum pernah publish data publik";
    default:
      return `${metric.sourceBackedFields} field source-backed`;
  }
}

function scoreVillageForPreset(
  preset: DashboardRankingFilters["preset"],
  metric: VillageMetric,
  completenessRatio: number,
  lastPublishedAt: Date | null,
): number {
  switch (preset) {
    case "least_complete":
      return completenessRatio;
    case "source_backed_best":
      return metric.sourceBackedFields * 100 + completenessRatio;
    case "most_comments":
      return metric.totalVoices * 100 + metric.unresolvedVoices;
    case "unresolved_comments":
      return metric.unresolvedVoices * 100 + metric.totalVoices;
    case "docs_pending":
      return metric.pendingDocuments * 100 + metric.failedDocuments * 10;
    case "no_verified_admin":
      return metric.verifiedAdminCount === 0 ? metric.limitedAdminCount + 1 : -1;
    case "dummy_heavy":
      return metric.fallbackFields * 100 - metric.sourceBackedFields;
    case "outdated":
      return buildOutdatedDays(lastPublishedAt);
    default:
      return 0;
  }
}

export function buildInternalDashboardSummary(input: {
  desaRows: SummaryDesaRow[];
  publishedFieldRows: PublishedFieldRow[];
  memberRows: AdminMemberRow[];
  documentRows: DocumentRow[];
  voiceRows: VoiceRow[];
  componentCatalog: TemplateFieldCatalogRow[];
}): InternalDashboardSummary {
  const desaIds = input.desaRows.map((desa) => desa.id);
  const metricMap = buildVillageMetricMap(
    desaIds,
    input.publishedFieldRows,
    input.memberRows,
    input.documentRows,
    input.voiceRows,
  );

  const trackedDesaCount = input.desaRows.length;
  const sourceBackedDesaCount = desaIds.filter(
    (desaId) => (metricMap.get(desaId)?.sourceBackedFields ?? 0) > 0,
  ).length;
  const publishedDesaCount = desaIds.filter(
    (desaId) => (metricMap.get(desaId)?.publishedFields ?? 0) > 0,
  ).length;
  const fallbackDesaCount = desaIds.filter((desaId) => {
    const metric = metricMap.get(desaId);
    return (metric?.publishedFields ?? 0) > 0 && (metric?.sourceBackedFields ?? 0) === 0;
  }).length;
  const noUsablePublicDataCount = trackedDesaCount - publishedDesaCount;

  const coveragePercent = clampPercent(
    (trackedDesaCount / INDONESIA_DESA_REFERENCE.totalCount) * 100,
  );

  const admins: DashboardAdminSummary = {
    activeMemberCount: input.memberRows.length,
    verifiedMemberCount: input.memberRows.filter((member) => member.status === "VERIFIED").length,
    limitedMemberCount: input.memberRows.filter((member) => member.status === "LIMITED").length,
    desaWithVerifiedAdminCount: new Set(
      input.memberRows
        .filter((member) => member.status === "VERIFIED")
        .map((member) => member.desaId),
    ).size,
    desaWithoutVerifiedAdminCount: desaIds.filter(
      (desaId) => (metricMap.get(desaId)?.verifiedAdminCount ?? 0) === 0,
    ).length,
  };

  const documents: DashboardDocumentSummary = {
    waitingVerifiedApprovalCount: input.documentRows.filter(
      (document) => document.status === "WAITING_VERIFIED_APPROVAL",
    ).length,
    processingCount: input.documentRows.filter((document) => document.status === "PROCESSING")
      .length,
    publishedCount: input.documentRows.filter((document) => document.status === "PUBLISHED").length,
    rejectedCount: input.documentRows.filter((document) => document.status === "REJECTED").length,
    failedCount: input.documentRows.filter((document) => document.status === "FAILED").length,
  };

  const componentSourceBackedMap = new Map<string, number>();
  const componentPublishedMap = new Map<string, number>();
  for (const row of input.publishedFieldRows) {
    componentPublishedMap.set(
      row.componentKey,
      (componentPublishedMap.get(row.componentKey) ?? 0) + 1,
    );
    if (row.sourceId) {
      componentSourceBackedMap.set(
        row.componentKey,
        (componentSourceBackedMap.get(row.componentKey) ?? 0) + 1,
      );
    }
  }

  const components: DashboardComponentHealthRow[] = input.componentCatalog
    .map((component) => {
      const publishedCount = componentPublishedMap.get(component.componentKey) ?? 0;
      const sourceBackedCount = componentSourceBackedMap.get(component.componentKey) ?? 0;
      const fallbackCount = Math.max(0, publishedCount - sourceBackedCount);
      const potentialFieldCount = Math.max(component.fieldCount * trackedDesaCount, 0);
      return {
        componentKey: component.componentKey,
        label: component.label,
        totalFields: potentialFieldCount,
        sourceBackedFields: sourceBackedCount,
        fallbackFields: fallbackCount,
        missingFields: Math.max(0, potentialFieldCount - publishedCount),
        sourceBackedRatio: clampPercent(
          potentialFieldCount > 0 ? (sourceBackedCount / potentialFieldCount) * 100 : 0,
        ),
      };
    })
    .sort((left, right) => left.sourceBackedRatio - right.sourceBackedRatio);

  const quality: DashboardQualitySummary = {
    publishedFieldCount: input.publishedFieldRows.length,
    sourceBackedFieldCount: input.publishedFieldRows.filter((row) => Boolean(row.sourceId)).length,
    fallbackFieldCount: input.publishedFieldRows.filter((row) => !row.sourceId).length,
    components,
  };

  const priorityCandidates: Array<DashboardPrioritySignal | null> = [
      documents.waitingVerifiedApprovalCount > 0
        ? {
            id: "docs-waiting-verified",
            tone: "warning" as const,
            eyebrow: "Prioritas dokumen",
            title: `${documents.waitingVerifiedApprovalCount} dokumen masih menunggu admin verified`,
            description:
              "Dokumen belum bergerak ke review internal. Ini memperlambat publish data publik baru.",
            href: "/internal-admin/documents?status=WAITING_VERIFIED_APPROVAL",
            ctaLabel: "Buka dokumen",
          }
        : null,
      documents.processingCount > 0
        ? {
            id: "docs-processing",
            tone: "warning" as const,
            eyebrow: "Antrean kerja",
            title: `${documents.processingCount} dokumen sedang diproses internal`,
            description:
              "Dokumen sudah siap disentuh reviewer. Dorong publish atau tandai gagal bila sumbernya tidak aman.",
            href: "/internal-admin/documents?status=PROCESSING",
            ctaLabel: "Lanjut review",
          }
        : null,
      fallbackDesaCount > 0
        ? {
            id: "fallback-desa",
            tone: "critical" as const,
            eyebrow: "Risiko publik",
            title: `${fallbackDesaCount} desa masih hidup di fallback/dummy`,
            description:
              "Halaman publik berisiko terlihat tipis atau kurang terpercaya. Desa ini perlu source-backed data dulu.",
            href: "/internal-admin/village-data?tab=desa-data",
            ctaLabel: "Cek data desa",
          }
        : null,
      admins.desaWithoutVerifiedAdminCount > 0
        ? {
            id: "desa-no-verified-admin",
            tone: "critical" as const,
            eyebrow: "Governance",
            title: `${admins.desaWithoutVerifiedAdminCount} desa belum punya admin verified`,
            description:
              "Operasional upload dan verifikasi data masih rentan macet karena belum ada penanggung jawab utama.",
            href: "/internal-admin/claims",
            ctaLabel: "Buka pengajuan",
          }
        : null,
      documents.failedCount + documents.rejectedCount > 0
        ? {
            id: "rejected-failed-docs",
            tone: "warning" as const,
            eyebrow: "Dokumen bermasalah",
            title: `${documents.failedCount + documents.rejectedCount} dokumen gagal atau ditolak`,
            description:
              "Ada sinyal kualitas sumber atau proses review yang perlu ditutup supaya antrean tidak berulang.",
            href: "/internal-admin/documents?status=FAILED",
            ctaLabel: "Lihat dokumen gagal",
          }
        : null,
      noUsablePublicDataCount > 0
        ? {
            id: "no-public-data",
            tone: "info" as const,
            eyebrow: "Coverage",
            title: `${noUsablePublicDataCount} desa belum punya data publik yang bisa dipakai`,
            description:
              "Desa ini sudah tercatat di PantauDesa, tetapi halaman publiknya belum punya isi yang layak ditampilkan.",
            href: "/internal-admin/intake",
            ctaLabel: "Buka intake",
          }
        : null,
  ];
  const priorities = sortPrioritySignals(
    priorityCandidates.filter((item): item is DashboardPrioritySignal => item !== null),
  );

  const nextSteps: DashboardInsightStep[] = [
    {
      id: "promote-source-backed",
      tone: sourceBackedDesaCount > 0 ? "good" : "warning",
      title: "Dorong desa yang sudah source-backed jadi etalase publik",
      body:
        sourceBackedDesaCount > 0
          ? `${sourceBackedDesaCount} desa sudah punya sinyal data real. Ini kandidat paling aman untuk dipromosikan lebih dulu.`
          : "Belum ada desa yang source-backed kuat. Tutup source quality dulu sebelum mendorong promosi publik.",
      href: `${INTERNAL_DASHBOARD_ROUTE}?preset=source_backed_best`,
      ctaLabel: "Lihat kandidat terbaik",
    },
    {
      id: "fix-worst-coverage",
      tone: fallbackDesaCount > 0 ? "critical" : "info",
      title: "Rapikan desa dengan coverage terendah lebih dulu",
      body:
        fallbackDesaCount > 0
          ? "Desa yang paling tipis datanya akan paling cepat menaikkan trust jika dilengkapi lebih dulu."
          : "Coverage publik sudah lumayan merata. Berikutnya kita bisa fokus ke quality per component.",
      href: `${INTERNAL_DASHBOARD_ROUTE}?preset=least_complete`,
      ctaLabel: "Buka ranking coverage",
    },
    {
      id: "connect-traffic",
      tone: "info",
      title: "Sambungkan traffic analytics sebelum bicara growth",
      body:
        "Saat ini dashboard baru bisa jujur bilang traffic belum aktif. Kita butuh analytics untuk tahu desa mana yang menarik pengunjung baru.",
      href: INTERNAL_DASHBOARD_ROUTE,
      ctaLabel: "Lihat status traffic",
    },
  ];

  return {
    coverage: {
      trackedDesaCount,
      officialTotalDesaCount: INDONESIA_DESA_REFERENCE.totalCount,
      coveragePercent,
      sourceBackedDesaCount,
      fallbackDesaCount,
      noUsablePublicDataCount,
      officialReference: INDONESIA_DESA_REFERENCE,
    },
    admins,
    documents,
    quality,
    priorities,
    nextSteps,
    traffic: DASHBOARD_TRAFFIC_EMPTY_STATE,
  };
}

export function buildVillageRankings(input: {
  desaRows: RankingDesaRow[];
  publishedFieldRows: PublishedFieldRow[];
  memberRows: AdminMemberRow[];
  documentRows: DocumentRow[];
  voiceRows: VoiceRow[];
  assignments: TemplateAssignmentRow[];
  overrides: TemplateVisibilityRow[];
  filters: DashboardRankingFilters;
  limit: number;
}): DashboardVillageRankingItem[] {
  const desaIds = input.desaRows.map((desa) => desa.id);
  const metricMap = buildVillageMetricMap(
    desaIds,
    input.publishedFieldRows,
    input.memberRows,
    input.documentRows,
    input.voiceRows,
  );
  const visibleFieldCountMap = buildVisibleFieldCountMap(
    desaIds,
    input.assignments,
    input.overrides,
  );

  const items = input.desaRows.map((desa) => {
    const metric = metricMap.get(desa.id) ?? {
      publishedFields: 0,
      sourceBackedFields: 0,
      fallbackFields: 0,
      verifiedAdminCount: 0,
      limitedAdminCount: 0,
      pendingDocuments: 0,
      rejectedDocuments: 0,
      failedDocuments: 0,
      processingDocuments: 0,
      totalVoices: 0,
      unresolvedVoices: 0,
    };
    const visibleFieldCount = visibleFieldCountMap.get(desa.id) ?? 0;
    const completenessRatio = clampPercent(
      visibleFieldCount > 0
        ? (metric.sourceBackedFields / visibleFieldCount) * 100
        : metric.sourceBackedFields > 0
          ? 100
          : 0,
    );
    const tone = buildVillageTone(metric, completenessRatio);
    const lastPublishedAt = desa.dataPublishedAt;

    return {
      desaId: desa.id,
      desaSlug: desa.slug,
      desaName: desa.nama,
      locationLabel: `${desa.kecamatan} · ${desa.kabupaten}`,
      dataStatusLabel: buildDataStatusLabel(
        metric.publishedFields,
        metric.sourceBackedFields,
        desa.dataStatus,
      ),
      sourceBackedFields: metric.sourceBackedFields,
      fallbackFields: metric.fallbackFields,
      publishedFields: metric.publishedFields,
      visibleFieldCount,
      completenessRatio,
      unresolvedVoiceCount: metric.unresolvedVoices,
      totalVoiceCount: metric.totalVoices,
      pendingDocumentCount: metric.pendingDocuments,
      rejectedDocumentCount: metric.rejectedDocuments,
      failedDocumentCount: metric.failedDocuments,
      verifiedAdminCount: metric.verifiedAdminCount,
      lastPublishedAt: lastPublishedAt?.toISOString() ?? null,
      riskScore: buildVillageRiskScore(metric, completenessRatio),
      summaryLabel: buildVillageSummaryLabel(
        input.filters.preset,
        metric,
        completenessRatio,
        visibleFieldCount,
        lastPublishedAt,
      ),
      tone,
      workHref: `/internal-admin/village-data?tab=desa-data&q=${encodeURIComponent(desa.nama)}`,
      publicHref: `/desa/${desa.slug}`,
    };
  });

  const sorted = items.sort((left, right) => {
    const leftMetric = metricMap.get(left.desaId)!;
    const rightMetric = metricMap.get(right.desaId)!;
    const leftDate = input.desaRows.find((desa) => desa.id === left.desaId)?.dataPublishedAt ?? null;
    const rightDate =
      input.desaRows.find((desa) => desa.id === right.desaId)?.dataPublishedAt ?? null;
    const leftScore = scoreVillageForPreset(
      input.filters.preset,
      leftMetric,
      left.completenessRatio,
      leftDate,
    );
    const rightScore = scoreVillageForPreset(
      input.filters.preset,
      rightMetric,
      right.completenessRatio,
      rightDate,
    );

    if (input.filters.preset === "least_complete") return leftScore - rightScore;
    if (input.filters.preset === "outdated") return rightScore - leftScore;
    if (input.filters.preset === "no_verified_admin") return rightScore - leftScore;
    return rightScore - leftScore;
  });

  if (input.filters.preset === "no_verified_admin") {
    return sorted.filter((item) => item.verifiedAdminCount === 0).slice(0, input.limit);
  }

  return sorted.slice(0, input.limit);
}

export function buildComponentCatalog(
  rows: Array<{
    componentKey: string;
    label: string;
    fieldCount: number;
  }>,
): TemplateFieldCatalogRow[] {
  const map = new Map<string, TemplateFieldCatalogRow>();

  for (const row of rows) {
    const existing = map.get(row.componentKey);
    if (!existing) {
      map.set(row.componentKey, {
        componentKey: row.componentKey,
        label: row.label || componentLabelFor(row.componentKey),
        fieldCount: row.fieldCount,
      });
      continue;
    }

    map.set(row.componentKey, {
      componentKey: row.componentKey,
      label: existing.label || row.label || componentLabelFor(row.componentKey),
      fieldCount: Math.max(existing.fieldCount, row.fieldCount),
    });
  }

  for (const fallback of COMPONENT_LABEL_FALLBACKS) {
    if (!map.has(fallback.componentKey)) {
      map.set(fallback.componentKey, {
        componentKey: fallback.componentKey,
        label: fallback.label,
        fieldCount: 0,
      });
    }
  }

  return [...map.values()];
}
