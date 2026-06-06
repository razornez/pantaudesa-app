import { db } from "@/lib/db";

export interface DashboardSummaryRepositoryPayload {
  desaRows: Array<{
    id: string;
    nama: string;
    slug: string;
    provinsi: string;
    kabupaten: string;
    kecamatan: string;
    dataStatus: string;
    dataPublishedAt: Date | null;
  }>;
  publishedFieldRows: Array<{
    desaId: string;
    sourceId: string | null;
    componentKey: string;
    componentLabel: string;
  }>;
  memberRows: Array<{
    desaId: string;
    status: string;
  }>;
  documentRows: Array<{
    desaId: string;
    status: string;
  }>;
  voiceRows: Array<{
    desaId: string;
    status: string;
  }>;
  componentCatalogRows: Array<{
    componentKey: string;
    label: string;
    fieldCount: number;
  }>;
}

export interface DashboardRankingRepositoryPayload {
  desaRows: DashboardSummaryRepositoryPayload["desaRows"];
  publishedFieldRows: DashboardSummaryRepositoryPayload["publishedFieldRows"];
  memberRows: DashboardSummaryRepositoryPayload["memberRows"];
  documentRows: DashboardSummaryRepositoryPayload["documentRows"];
  voiceRows: DashboardSummaryRepositoryPayload["voiceRows"];
  assignments: Array<{
    desaId: string;
    components: Array<{
      id: string;
      componentKey: string;
      label: string;
      isDefaultVisible: boolean;
      fieldCount: number;
    }>;
  }>;
  overrides: Array<{
    desaId: string;
    componentId: string;
    isVisible: boolean;
  }>;
}

export async function readDashboardSummaryRepositoryPayload(): Promise<DashboardSummaryRepositoryPayload> {
  if (!db) {
    throw new Error("Database client unavailable");
  }

  const [desaRows, publishedFieldRows, memberRows, documentRows, voiceRows, componentCatalogRows] =
    await Promise.all([
      db.desa.findMany({
        select: {
          id: true,
          nama: true,
          slug: true,
          provinsi: true,
          kabupaten: true,
          kecamatan: true,
          dataStatus: true,
          dataPublishedAt: true,
        },
      }),
      db.dataDesa.findMany({
        where: {
          status: "PUBLISHED",
          isActive: true,
        },
        select: {
          desaId: true,
          sourceId: true,
          component: {
            select: {
              componentKey: true,
              label: true,
            },
          },
        },
      }),
      db.desaAdminMember.findMany({
        where: {
          revokedAt: null,
          status: { in: ["LIMITED", "VERIFIED"] },
        },
        select: {
          desaId: true,
          status: true,
        },
      }),
      db.adminDesaDocument.findMany({
        select: {
          desaId: true,
          status: true,
        },
      }),
      db.voice.findMany({
        select: {
          desaId: true,
          status: true,
        },
      }),
      db.villageDetailComponent.findMany({
        where: { status: "ACTIVE" },
        select: {
          componentKey: true,
          label: true,
          fieldStandards: {
            where: { status: "ACTIVE" },
            select: { id: true },
          },
        },
      }),
    ]);

  return {
    desaRows: desaRows.map((row) => ({
      ...row,
      dataStatus: row.dataStatus,
    })),
    publishedFieldRows: publishedFieldRows.map((row) => ({
      desaId: row.desaId,
      sourceId: row.sourceId,
      componentKey: row.component.componentKey,
      componentLabel: row.component.label,
    })),
    memberRows: memberRows.map((row) => ({
      desaId: row.desaId,
      status: row.status,
    })),
    documentRows: documentRows.map((row) => ({
      desaId: row.desaId,
      status: row.status,
    })),
    voiceRows: voiceRows.map((row) => ({
      desaId: row.desaId,
      status: row.status,
    })),
    componentCatalogRows: componentCatalogRows.map((row) => ({
      componentKey: row.componentKey,
      label: row.label,
      fieldCount: row.fieldStandards.length,
    })),
  };
}

export async function readDashboardRankingRepositoryPayload(input: {
  q: string;
  provinsi: string;
  kabupaten: string;
  kecamatan: string;
}): Promise<DashboardRankingRepositoryPayload> {
  if (!db) {
    throw new Error("Database client unavailable");
  }

  const where = {
    ...(input.q
      ? {
          OR: [
            { nama: { contains: input.q, mode: "insensitive" as const } },
            { kecamatan: { contains: input.q, mode: "insensitive" as const } },
            { kabupaten: { contains: input.q, mode: "insensitive" as const } },
            { provinsi: { contains: input.q, mode: "insensitive" as const } },
          ],
        }
      : {}),
    ...(input.provinsi
      ? { provinsi: { equals: input.provinsi, mode: "insensitive" as const } }
      : {}),
    ...(input.kabupaten
      ? { kabupaten: { equals: input.kabupaten, mode: "insensitive" as const } }
      : {}),
    ...(input.kecamatan
      ? { kecamatan: { equals: input.kecamatan, mode: "insensitive" as const } }
      : {}),
  };

  const desaRows = await db.desa.findMany({
    where,
    select: {
      id: true,
      nama: true,
      slug: true,
      provinsi: true,
      kabupaten: true,
      kecamatan: true,
      dataStatus: true,
      dataPublishedAt: true,
    },
  });

  const desaIds = desaRows.map((desa) => desa.id);
  if (desaIds.length === 0) {
    return {
      desaRows: [],
      publishedFieldRows: [],
      memberRows: [],
      documentRows: [],
      voiceRows: [],
      assignments: [],
      overrides: [],
    };
  }

  const [publishedFieldRows, memberRows, documentRows, voiceRows, assignments, overrides] =
    await Promise.all([
      db.dataDesa.findMany({
        where: {
          desaId: { in: desaIds },
          status: "PUBLISHED",
          isActive: true,
        },
        select: {
          desaId: true,
          sourceId: true,
          component: {
            select: {
              componentKey: true,
              label: true,
            },
          },
        },
      }),
      db.desaAdminMember.findMany({
        where: {
          desaId: { in: desaIds },
          revokedAt: null,
          status: { in: ["LIMITED", "VERIFIED"] },
        },
        select: {
          desaId: true,
          status: true,
        },
      }),
      db.adminDesaDocument.findMany({
        where: { desaId: { in: desaIds } },
        select: {
          desaId: true,
          status: true,
        },
      }),
      db.voice.findMany({
        where: { desaId: { in: desaIds } },
        select: {
          desaId: true,
          status: true,
        },
      }),
      db.desaDetailTemplateAssignment.findMany({
        where: { desaId: { in: desaIds } },
        select: {
          desaId: true,
          template: {
            select: {
              components: {
                where: { status: "ACTIVE" },
                select: {
                  id: true,
                  componentKey: true,
                  label: true,
                  isDefaultVisible: true,
                  fieldStandards: {
                    where: { status: "ACTIVE" },
                    select: { id: true },
                  },
                },
              },
            },
          },
        },
      }),
      db.desaDetailComponentVisibility.findMany({
        where: { desaId: { in: desaIds } },
        select: {
          desaId: true,
          componentId: true,
          isVisible: true,
        },
      }),
    ]);

  return {
    desaRows: desaRows.map((row) => ({
      ...row,
      dataStatus: row.dataStatus,
    })),
    publishedFieldRows: publishedFieldRows.map((row) => ({
      desaId: row.desaId,
      sourceId: row.sourceId,
      componentKey: row.component.componentKey,
      componentLabel: row.component.label,
    })),
    memberRows: memberRows.map((row) => ({
      desaId: row.desaId,
      status: row.status,
    })),
    documentRows: documentRows.map((row) => ({
      desaId: row.desaId,
      status: row.status,
    })),
    voiceRows: voiceRows.map((row) => ({
      desaId: row.desaId,
      status: row.status,
    })),
    assignments: assignments.map((row) => ({
      desaId: row.desaId,
      components: row.template.components.map((component) => ({
        id: component.id,
        componentKey: component.componentKey,
        label: component.label,
        isDefaultVisible: component.isDefaultVisible,
        fieldCount: component.fieldStandards.length,
      })),
    })),
    overrides: overrides.map((row) => ({
      desaId: row.desaId,
      componentId: row.componentId,
      isVisible: row.isVisible,
    })),
  };
}

