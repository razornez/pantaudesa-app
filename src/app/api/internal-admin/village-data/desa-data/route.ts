import { NextRequest, NextResponse } from "next/server";
import { requireInternalAdminSession } from "@/lib/auth/internal-admin";
import { db } from "@/lib/db";
import { handleApiError } from "@/lib/api-error";
import { isDatabaseConnectivityError } from "@/lib/db-connectivity";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";
import {
  buildComponentProgressLens,
  matchPublishedRowsToComponents,
} from "@/lib/internal-admin/component-progress-lens";
import {
  buildRuntimeTemplateManifest,
  mergeResolvedFieldsWithCatalogManifest,
  toRuntimeProgressSources,
} from "@/lib/village-data/runtime-template-manifest";
import { DEFAULT_TEMPLATE_KEY } from "@/lib/village-data/template-constants";

const PAGE_SIZE = 20;

type DesaListRow = {
  id: string;
  nama: string;
  slug: string;
  kecamatan: string;
  kabupaten: string;
  provinsi: string;
  websiteUrl: string | null;
  kategori: string | null;
  tahunData: number | null;
  jumlahPenduduk: number | null;
  dataStatus: string;
  dataSourceLabel: string | null;
  dataPublishedAt: string | Date | null;
};

type TemplateRow = {
  id: string;
  key: string;
  name: string;
};

type TemplateAssignmentRow = {
  desaId: string;
  templateId: string;
};

type TemplateComponentRow = {
  id: string;
  templateId: string;
  componentKey: string;
  label: string;
  displayOrder: number;
  isDefaultVisible: boolean;
};

type DetailFieldRow = {
  componentId: string;
  fieldKey: string;
  label: string;
  displayOrder: number;
};

type VisibilityRow = {
  desaId: string;
  componentId: string;
  isVisible: boolean;
};

type PublishedFieldRow = {
  desaId: string;
  fieldKey: string;
  componentId: string;
};

type VersionRow = {
  desaId: string;
};

function computeLegacyFilledFieldCount(input: {
  websiteUrl: string | null;
  kategori: string | null;
  tahunData: number | null;
  jumlahPenduduk: number | null;
}) {
  return [input.websiteUrl, input.kategori, input.tahunData, input.jumlahPenduduk].filter(
    (value) => value !== null && value !== undefined && value !== "",
  ).length;
}

function buildDesaCoverageRows(input: {
  desa: Array<
    DesaListRow & {
      _count: { villageDataVersions: number };
      detailTemplateAssignment: { template: TemplateRow } | null;
    }
  >;
  defaultTemplate: TemplateRow | null;
  componentsByTemplateId: Map<
    string,
    Array<{
      id: string;
      componentKey: string;
      label: string;
      displayOrder: number;
      isDefaultVisible: boolean;
      fields: Array<{ fieldKey: string; label: string }>;
    }>
  >;
  visibilityByDesaId: Map<string, Map<string, boolean>>;
  publishedRowsByDesaId: Map<string, Array<{ fieldKey: string; componentId: string }>>;
}) {
  return input.desa.map((item) => {
    const templateId =
      item.detailTemplateAssignment?.template.id ?? input.defaultTemplate?.id ?? null;
    const templateComponents = templateId ? input.componentsByTemplateId.get(templateId) ?? [] : [];
    const overrides = input.visibilityByDesaId.get(item.id) ?? new Map<string, boolean>();
    const fallbackFilled = computeLegacyFilledFieldCount(item);
    const publishedRows = input.publishedRowsByDesaId.get(item.id) ?? [];
    const shouldOverlayCatalog =
      (item.detailTemplateAssignment?.template.key ?? input.defaultTemplate?.key) ===
      DEFAULT_TEMPLATE_KEY;

    const runtimeManifest = buildRuntimeTemplateManifest({
      templateId: templateId ?? "fallback",
      templateKey:
        item.detailTemplateAssignment?.template.key ??
        input.defaultTemplate?.key ??
        DEFAULT_TEMPLATE_KEY,
      templateName:
        item.detailTemplateAssignment?.template.name ??
        input.defaultTemplate?.name ??
        "Template Umum Desa",
      visibleComponents: templateComponents
        .filter((component) =>
          overrides.has(component.id)
            ? overrides.get(component.id) === true
            : component.isDefaultVisible,
        )
        .map((component) => ({
          componentId: component.id,
          componentKey: component.componentKey,
          label: component.label,
          displayOrder: component.displayOrder,
          fields: shouldOverlayCatalog
            ? mergeResolvedFieldsWithCatalogManifest({
                componentId: component.id,
                componentKey: component.componentKey,
                componentLabel: component.label,
                fields: component.fields.map((field) => ({
                  fieldKey: field.fieldKey,
                  label: field.label,
                  valueType: "unknown",
                  isPublishableNow: true,
                  componentKey: component.componentKey,
                  componentLabel: component.label,
                })),
              })
            : component.fields.map((field) => ({
                fieldKey: field.fieldKey,
                label: field.label,
                valueType: "unknown",
                isPublishableNow: true,
                componentKey: component.componentKey,
                componentLabel: component.label,
              })),
        })),
      hiddenComponents: templateComponents
        .filter((component) =>
          overrides.has(component.id)
            ? overrides.get(component.id) !== true
            : !component.isDefaultVisible,
        )
        .map((component) => ({
          componentId: component.id,
          componentKey: component.componentKey,
          label: component.label,
          displayOrder: component.displayOrder,
          fields: shouldOverlayCatalog
            ? mergeResolvedFieldsWithCatalogManifest({
                componentId: component.id,
                componentKey: component.componentKey,
                componentLabel: component.label,
                fields: component.fields.map((field) => ({
                  fieldKey: field.fieldKey,
                  label: field.label,
                  valueType: "unknown",
                  isPublishableNow: true,
                  componentKey: component.componentKey,
                  componentLabel: component.label,
                })),
              })
            : component.fields.map((field) => ({
                fieldKey: field.fieldKey,
                label: field.label,
                valueType: "unknown",
                isPublishableNow: true,
                componentKey: component.componentKey,
                componentLabel: component.label,
              })),
        })),
    });

    const rowMatch = matchPublishedRowsToComponents({
      components: toRuntimeProgressSources(runtimeManifest),
      publishedRows,
    });
    const progress = buildComponentProgressLens({
      components: toRuntimeProgressSources(runtimeManifest),
      publishedFieldKeys: rowMatch.validFieldKeys,
    });

    return {
      ...item,
      filledFieldCount:
        runtimeManifest.visibleFieldCount > 0
          ? progress.aggregateFilledFieldCount
          : fallbackFilled,
      totalFieldCount:
        runtimeManifest.visibleFieldCount > 0 ? runtimeManifest.visibleFieldCount : fallbackFilled,
      filledSignalCount: progress.aggregateFilledSignalCount,
      totalSignalCount: progress.aggregateTotalSignalCount,
      mismatchPublishedFieldCount: rowMatch.mismatchRows.length,
    };
  });
}

async function listDesaDataViaSupabase(input: {
  q: string;
  provinsi: string;
  kabupaten: string;
  kecamatan: string;
  page: number;
}) {
  const client = getSupabaseAdminClient();
  if (!client) {
    return NextResponse.json({ error: "Database tidak tersedia sementara." }, { status: 503 });
  }

  const skip = (input.page - 1) * PAGE_SIZE;
  let desaQuery = client
    .from("desa")
    .select(
      "id,nama,slug,kecamatan,kabupaten,provinsi,websiteUrl,kategori,tahunData,jumlahPenduduk,dataStatus,dataSourceLabel,dataPublishedAt",
      { count: "exact" },
    )
    .order("nama", { ascending: true })
    .range(skip, skip + PAGE_SIZE - 1);

  if (input.q) {
    const escapedQuery = input.q.replace(/[%(),]/g, " ").trim();
    desaQuery = desaQuery.or(
      `nama.ilike.%${escapedQuery}%,kecamatan.ilike.%${escapedQuery}%,kabupaten.ilike.%${escapedQuery}%,provinsi.ilike.%${escapedQuery}%`,
    );
  }
  if (input.provinsi) desaQuery = desaQuery.eq("provinsi", input.provinsi);
  if (input.kabupaten) desaQuery = desaQuery.eq("kabupaten", input.kabupaten);
  if (input.kecamatan) desaQuery = desaQuery.eq("kecamatan", input.kecamatan);

  const { data: desaRows, count, error: desaError } = await desaQuery.returns<DesaListRow[]>();
  if (desaError) throw desaError;

  const filteredRows = desaRows ?? [];

  const { data: defaultTemplateRows, error: defaultTemplateError } = await client
    .from("village_detail_templates")
    .select("id,key,name")
    .eq("isDefault", true)
    .eq("status", "ACTIVE")
    .limit(1)
    .returns<TemplateRow[]>();
  if (defaultTemplateError) throw defaultTemplateError;
  const defaultTemplate = defaultTemplateRows?.[0] ?? null;

  const desaIds = filteredRows.map((item) => item.id);
  const { data: versionRows, error: versionError } = await client
    .from("village_data_versions")
    .select("desaId")
    .in("desaId", desaIds.length > 0 ? desaIds : ["__empty__"])
    .returns<VersionRow[]>();
  if (versionError) throw versionError;
  const versionCountByDesaId = new Map<string, number>();
  for (const row of versionRows ?? []) {
    versionCountByDesaId.set(row.desaId, (versionCountByDesaId.get(row.desaId) ?? 0) + 1);
  }

  const { data: assignmentRows, error: assignmentError } = await client
    .from("desa_detail_template_assignments")
    .select("desaId,templateId")
    .in("desaId", desaIds.length > 0 ? desaIds : ["__empty__"])
    .eq("isActive", true)
    .returns<TemplateAssignmentRow[]>();
  if (assignmentError) throw assignmentError;

  const assignedTemplateIds = [
    ...new Set((assignmentRows ?? []).map((row) => row.templateId).filter(Boolean)),
  ];
  const templateIds = [
    ...new Set([...assignedTemplateIds, ...(defaultTemplate ? [defaultTemplate.id] : [])]),
  ];

  const { data: templateRows, error: templateError } = await client
    .from("village_detail_templates")
    .select("id,key,name")
    .in("id", templateIds.length > 0 ? templateIds : ["__empty__"])
    .returns<TemplateRow[]>();
  if (templateError) throw templateError;
  const templatesById = new Map((templateRows ?? []).map((item) => [item.id, item]));

  const { data: componentRows, error: componentError } = await client
    .from("village_detail_components")
    .select("id,templateId,componentKey,label,displayOrder,isDefaultVisible")
    .in("templateId", templateIds.length > 0 ? templateIds : ["__empty__"])
    .eq("status", "ACTIVE")
    .returns<TemplateComponentRow[]>();
  if (componentError) throw componentError;

  const componentIds = (componentRows ?? []).map((item) => item.id);
  const { data: fieldRows, error: fieldError } = await client
    .from("detail_field_standards")
    .select("componentId,fieldKey,label,displayOrder")
    .in("componentId", componentIds.length > 0 ? componentIds : ["__empty__"])
    .eq("status", "ACTIVE")
    .order("displayOrder", { ascending: true })
    .returns<DetailFieldRow[]>();
  if (fieldError) throw fieldError;

  const { data: visibilityRows, error: visibilityError } = await client
    .from("desa_detail_component_visibility")
    .select("desaId,componentId,isVisible")
    .in("desaId", desaIds.length > 0 ? desaIds : ["__empty__"])
    .returns<VisibilityRow[]>();
  if (visibilityError) throw visibilityError;

  const { data: publishedRows, error: publishedError } = await client
    .from("data_desa")
    .select("desaId,fieldKey,componentId")
    .in("desaId", desaIds.length > 0 ? desaIds : ["__empty__"])
    .eq("status", "PUBLISHED")
    .eq("isActive", true)
    .returns<PublishedFieldRow[]>();
  if (publishedError) throw publishedError;

  const fieldsByComponentId = new Map<string, Array<{ fieldKey: string; label: string }>>();
  for (const row of fieldRows ?? []) {
    const list = fieldsByComponentId.get(row.componentId) ?? [];
    list.push({ fieldKey: row.fieldKey, label: row.label });
    fieldsByComponentId.set(row.componentId, list);
  }

  const componentsByTemplateId = new Map<
    string,
    Array<{
      id: string;
      componentKey: string;
      label: string;
      displayOrder: number;
      isDefaultVisible: boolean;
      fields: Array<{ fieldKey: string; label: string }>;
    }>
  >();
  for (const component of componentRows ?? []) {
    const list = componentsByTemplateId.get(component.templateId) ?? [];
    list.push({
      id: component.id,
      componentKey: component.componentKey,
      label: component.label,
      displayOrder: component.displayOrder,
      isDefaultVisible: component.isDefaultVisible,
      fields: fieldsByComponentId.get(component.id) ?? [],
    });
    componentsByTemplateId.set(component.templateId, list);
  }

  const visibilityByDesaId = new Map<string, Map<string, boolean>>();
  for (const row of visibilityRows ?? []) {
    const map = visibilityByDesaId.get(row.desaId) ?? new Map<string, boolean>();
    map.set(row.componentId, row.isVisible);
    visibilityByDesaId.set(row.desaId, map);
  }

  const publishedRowsByDesaId = new Map<string, Array<{ fieldKey: string; componentId: string }>>();
  for (const row of publishedRows ?? []) {
    const list = publishedRowsByDesaId.get(row.desaId) ?? [];
    list.push({ fieldKey: row.fieldKey, componentId: row.componentId });
    publishedRowsByDesaId.set(row.desaId, list);
  }

  const assignmentsByDesaId = new Map((assignmentRows ?? []).map((row) => [row.desaId, row]));
  const desa = filteredRows.map((item) => {
    const assignment = assignmentsByDesaId.get(item.id);
    const template = assignment ? templatesById.get(assignment.templateId) ?? null : null;
    return {
      ...item,
      _count: { villageDataVersions: versionCountByDesaId.get(item.id) ?? 0 },
      detailTemplateAssignment: template ? { template } : null,
    };
  });

  return NextResponse.json({
    desa: buildDesaCoverageRows({
      desa,
      defaultTemplate,
      componentsByTemplateId,
      visibilityByDesaId,
      publishedRowsByDesaId,
    }),
    total: count ?? filteredRows.length,
    page: input.page,
    pageSize: PAGE_SIZE,
  });
}

export async function GET(req: NextRequest) {
  try {
    const session = await requireInternalAdminSession();
    if (session instanceof NextResponse) return session;

    const sp = req.nextUrl.searchParams;
    const q        = sp.get("q")?.trim()         ?? "";
    const provinsi = sp.get("provinsi")?.trim()  ?? "";
    const kabupaten= sp.get("kabupaten")?.trim() ?? "";
    const kecamatan= sp.get("kecamatan")?.trim() ?? "";
    const page = Math.max(1, parseInt(sp.get("page") ?? "1", 10));
    const skip = (page - 1) * PAGE_SIZE;

    if (!db) {
      return NextResponse.json({ error: "Database tidak tersedia." }, { status: 503 });
    }

    try {
      const where = {
        ...(q ? {
          OR: [
            { nama:      { contains: q, mode: "insensitive" as const } },
            { kecamatan: { contains: q, mode: "insensitive" as const } },
            { kabupaten: { contains: q, mode: "insensitive" as const } },
            { provinsi:  { contains: q, mode: "insensitive" as const } },
          ],
        } : {}),
        ...(provinsi  ? { provinsi:  { equals: provinsi,  mode: "insensitive" as const } } : {}),
        ...(kabupaten ? { kabupaten: { equals: kabupaten, mode: "insensitive" as const } } : {}),
        ...(kecamatan ? { kecamatan: { equals: kecamatan, mode: "insensitive" as const } } : {}),
      } as Record<string, unknown>;

      const [desa, total, defaultTemplate] = await Promise.all([
        db.desa.findMany({
          where,
          orderBy: { nama: "asc" },
          skip,
          take: PAGE_SIZE,
          select: {
            id: true,
            nama: true,
            slug: true,
            kecamatan: true,
            kabupaten: true,
            provinsi: true,
            websiteUrl: true,
            kategori: true,
            tahunData: true,
            jumlahPenduduk: true,
            dataStatus: true,
            dataSourceLabel: true,
            dataPublishedAt: true,
            _count: { select: { villageDataVersions: true } },
            detailTemplateAssignment: {
              select: {
                template: { select: { id: true, key: true, name: true } },
              },
            },
          },
        }),
        db.desa.count({ where }),
        db.villageDetailTemplate.findFirst({
          where: { isDefault: true, status: "ACTIVE" },
          select: { id: true, key: true, name: true },
        }),
      ]);

      const desaIds = desa.map((item) => item.id);
      const templateIds = [
        ...new Set(
          desa
            .map((item) => item.detailTemplateAssignment?.template.id ?? defaultTemplate?.id ?? null)
            .filter((value): value is string => Boolean(value)),
        ),
      ];

      const [components, visibilityOverrides, publishedFieldRows] =
        templateIds.length > 0 && desaIds.length > 0
          ? await Promise.all([
              db.villageDetailComponent.findMany({
                where: {
                  templateId: { in: templateIds },
                  status: "ACTIVE",
                },
                select: {
                  id: true,
                  templateId: true,
                  componentKey: true,
                  label: true,
                  displayOrder: true,
                  isDefaultVisible: true,
                  fieldStandards: {
                    where: { status: "ACTIVE" },
                    orderBy: { displayOrder: "asc" },
                    select: {
                      fieldKey: true,
                      label: true,
                    },
                  },
                },
              }),
              db.desaDetailComponentVisibility.findMany({
                where: {
                  desaId: { in: desaIds },
                  templateId: { in: templateIds },
                },
                select: {
                  desaId: true,
                  componentId: true,
                  isVisible: true,
                },
              }),
              db.dataDesa.findMany({
                where: {
                  desaId: { in: desaIds },
                  status: "PUBLISHED",
                  isActive: true,
                },
                select: {
                  desaId: true,
                  fieldKey: true,
                  componentId: true,
                },
              }),
            ])
          : [[], [], []];

      const componentsByTemplateId = new Map<
        string,
        Array<{
          id: string;
          componentKey: string;
          label: string;
          displayOrder: number;
          isDefaultVisible: boolean;
          fields: Array<{ fieldKey: string; label: string }>;
        }>
      >();
      for (const component of components) {
        const list = componentsByTemplateId.get(component.templateId) ?? [];
        list.push({
          id: component.id,
          componentKey: component.componentKey,
          label: component.label,
          displayOrder: component.displayOrder,
          isDefaultVisible: component.isDefaultVisible,
          fields: component.fieldStandards.map((field) => ({
            fieldKey: field.fieldKey,
            label: field.label,
          })),
        });
        componentsByTemplateId.set(component.templateId, list);
      }

      const visibilityByDesaId = new Map<string, Map<string, boolean>>();
      for (const override of visibilityOverrides) {
        const map = visibilityByDesaId.get(override.desaId) ?? new Map<string, boolean>();
        map.set(override.componentId, override.isVisible);
        visibilityByDesaId.set(override.desaId, map);
      }

      const publishedRowsByDesaId = new Map<
        string,
        Array<{ fieldKey: string; componentId: string }>
      >();
      for (const row of publishedFieldRows) {
        const rows = publishedRowsByDesaId.get(row.desaId) ?? [];
        rows.push({
          fieldKey: row.fieldKey,
          componentId: row.componentId,
        });
        publishedRowsByDesaId.set(row.desaId, rows);
      }

      const desaWithCoverage = buildDesaCoverageRows({
        desa,
        defaultTemplate,
        componentsByTemplateId,
        visibilityByDesaId,
        publishedRowsByDesaId,
      });

      return NextResponse.json({ desa: desaWithCoverage, total, page, pageSize: PAGE_SIZE });
    } catch (error) {
      if (!isDatabaseConnectivityError(error)) throw error;
      return await listDesaDataViaSupabase({ q, provinsi, kabupaten, kecamatan, page });
    }
  } catch (error) {
    return handleApiError(error, "GET /api/internal-admin/village-data/desa-data");
  }
}
