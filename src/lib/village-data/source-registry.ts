import type { PrismaClient, SourceType } from "@/generated/prisma";
import type { SourceTypeCode } from "@/lib/village-data/source-policy";

function mapSourceTypeCodeToRegistryType(sourceTypeCode: SourceTypeCode): SourceType {
  switch (sourceTypeCode) {
    case "OFFICIAL_WEBSITE":
      return "official_website";
    case "DOCUMENT_UPLOAD":
      return "official_document";
    case "GOVERNMENT_SOURCE":
    case "PROVINCE_PARTNER":
    case "TRUSTED_GOVERNANCE_SOURCE":
      return "other";
    case "SOURCE_INGESTION":
      return "official_website";
    default:
      return "manual";
  }
}

export async function ensureSourceRegistryEntry(params: {
  db: PrismaClient;
  desaId: string;
  desaName: string;
  sourceTypeCode: SourceTypeCode;
  sourceRegistryId?: string | null;
  sourceName: string;
  sourceUrl?: string | null;
}) {
  if (params.sourceRegistryId) {
    const existing = await params.db.dataSource.findUnique({
      where: { id: params.sourceRegistryId },
      select: { id: true },
    });
    if (existing) return existing.id;
  }

  const normalizedName = params.sourceName.trim();
  const normalizedUrl = params.sourceUrl?.trim() || null;

  const existing = await params.db.dataSource.findFirst({
    where: {
      desaId: params.desaId,
      OR: normalizedUrl
        ? [{ sourceUrl: normalizedUrl }, { sourceName: normalizedName }]
        : [{ sourceName: normalizedName }],
    },
    select: { id: true },
  });

  if (existing) return existing.id;

  const created = await params.db.dataSource.create({
    data: {
      desaId: params.desaId,
      scopeType: "desa",
      scopeName: params.desaName,
      sourceName: normalizedName,
      sourceUrl: normalizedUrl,
      sourceType: mapSourceTypeCodeToRegistryType(params.sourceTypeCode),
      accessStatus: "unknown",
      dataAvailability: "unknown",
      dataStatus: "needs_review",
      notes: `Registry dibuat dari ${params.sourceTypeCode}.`,
    },
    select: { id: true },
  });

  return created.id;
}
