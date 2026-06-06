import { config as loadEnv } from "dotenv";
import { PrismaClient } from "../src/generated/prisma/index.js";
import {
  COMPONENT_CATALOG,
  DEFAULT_TEMPLATE_MANIFEST,
  LEGACY_TEMPLATE_MANIFESTS,
} from "./template-catalog.manifest.mjs";

loadEnv({ path: ".env.local", override: false });
loadEnv({ path: ".env", override: false });

// Template sync is an admin/seed job, not app runtime. Prefer DIRECT_URL when
// available so catalog writes do not compete with the runtime pooler. Runtime
// Next.js still uses DATABASE_URL; this override is scoped to this process only.
if (process.env.TEMPLATE_SYNC_DATABASE_URL) {
  process.env.DATABASE_URL = process.env.TEMPLATE_SYNC_DATABASE_URL;
} else if (
  process.env.DIRECT_URL &&
  process.env.TEMPLATE_SYNC_USE_DIRECT_URL !== "false"
) {
  process.env.DATABASE_URL = process.env.DIRECT_URL;
}

const db = new PrismaClient({
  datasources: {
    db: { url: process.env.DATABASE_URL },
  },
});
const args = new Set(process.argv.slice(2));
const dryRun = args.has("--dry-run") || process.env.TEMPLATE_SYNC_DRY_RUN === "true";
const stageTimeoutMs = Number(process.env.TEMPLATE_SYNC_STAGE_TIMEOUT_MS ?? 120_000);

function safeDatabaseTarget() {
  const rawUrl = process.env.DATABASE_URL ?? "";
  try {
    const parsed = new URL(rawUrl);
    return `${parsed.hostname}:${parsed.port || "5432"}/${parsed.pathname.replace(/^\//, "")}`;
  } catch {
    return "invalid-or-missing-database-url";
  }
}

async function runStage(label, task, options = {}) {
  const timeoutMs = options.timeoutMs ?? stageTimeoutMs;
  const startedAt = Date.now();
  console.log(`[template:sync] start ${label}`);

  let timeout;
  try {
    const result = await Promise.race([
      task(),
      new Promise((_, reject) => {
        timeout = setTimeout(() => {
          reject(
            new Error(
              `${label} timed out after ${timeoutMs}ms. Check DATABASE_URL/TEMPLATE_SYNC_DATABASE_URL and Supabase connectivity before retrying.`,
            ),
          );
        }, timeoutMs);
      }),
    ]);
    console.log(`[template:sync] done ${label} in ${Date.now() - startedAt}ms`);
    return result;
  } catch (error) {
    console.error(
      `[template:sync] failed ${label} after ${Date.now() - startedAt}ms`,
    );
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

async function supportsCatalogRelations() {
  try {
    await db.$queryRawUnsafe("SELECT 1 FROM village_component_catalog LIMIT 1");
    return true;
  } catch {
    return false;
  }
}

async function migratePerangkatFieldsToDedicatedComponent({
  templateId,
  sourceComponentIds,
  perangkatComponentId,
  perangkatFieldIdMap,
}) {
  if (!perangkatComponentId) return;

  const migratedFieldKeys = ["kepalaDesa", "perangkatDesa"];
  const normalizedSourceIds = [...new Set(sourceComponentIds)].filter(
    (componentId) => componentId && componentId !== perangkatComponentId,
  );
  if (normalizedSourceIds.length === 0) return;

  const sourceRows = await db.dataDesa.findMany({
    where: {
      templateId,
      componentId: { in: normalizedSourceIds },
      fieldKey: { in: migratedFieldKeys },
    },
    select: {
      id: true,
      desaId: true,
      fieldKey: true,
    },
  });

  for (const row of sourceRows) {
    const targetFieldStandardId = perangkatFieldIdMap.get(row.fieldKey) ?? null;
    const existingTargetRow = await db.dataDesa.findFirst({
      where: {
        templateId,
        componentId: perangkatComponentId,
        desaId: row.desaId,
        fieldKey: row.fieldKey,
        isActive: true,
        NOT: { id: row.id },
      },
      select: { id: true },
    });

    if (existingTargetRow) {
      await db.dataDesa.updateMany({
        where: { id: row.id },
        data: {
          status: "ARCHIVED",
          isActive: false,
          reviewNote:
            "Archived during template seed sync after perangkat fields moved into the dedicated perangkat component.",
        },
      });
      continue;
    }

    await db.dataDesa.updateMany({
      where: { id: row.id },
      data: {
        componentId: perangkatComponentId,
        fieldStandardId: targetFieldStandardId,
      },
    });
  }
}

function componentAnchorId(componentKey) {
  return componentKey.replaceAll("_", "-");
}

function catalogRuntimeMetadata(componentDef) {
  return {
    isDefaultVisible: componentDef.isDefaultVisible ?? true,
    displayOrder: componentDef.displayOrder ?? 0,
    rendererType: componentDef.rendererType,
    previewVariant: componentDef.previewVariant,
    detailSlot: componentDef.detailSlot,
    navLabel: componentDef.navLabel ?? componentDef.label,
    anchorId: componentDef.anchorId ?? componentAnchorId(componentDef.componentKey),
    publicGroupKey: componentDef.publicGroupKey ?? componentDef.detailSlot ?? null,
    publicTabKey: componentDef.publicTabKey ?? componentDef.componentKey,
    highlightFieldKeys: componentDef.highlightFieldKeys ?? null,
    renderConfigJson: componentDef.renderConfig ?? null,
  };
}

async function seedComponentCatalog(withCatalogTables) {
  const catalogByKey = new Map();

  if (!withCatalogTables) {
    for (const componentDef of COMPONENT_CATALOG) {
      catalogByKey.set(componentDef.componentKey, {
        id: null,
        componentKey: componentDef.componentKey,
      });
    }
    return catalogByKey;
  }

  for (const componentDef of COMPONENT_CATALOG) {
    const runtimeMetadata = catalogRuntimeMetadata(componentDef);
    const component = await db.villageComponentCatalog.upsert({
      where: { componentKey: componentDef.componentKey },
      create: {
        componentKey: componentDef.componentKey,
        label: componentDef.label,
        description: componentDef.description,
        componentType: componentDef.componentType,
        ...runtimeMetadata,
        status: "ACTIVE",
      },
      update: {
        label: componentDef.label,
        description: componentDef.description,
        componentType: componentDef.componentType,
        ...runtimeMetadata,
        status: "ACTIVE",
      },
    });

    catalogByKey.set(componentDef.componentKey, component);

    for (const fieldDef of componentDef.fields) {
      await db.villageComponentCatalogField.upsert({
        where: {
          catalogComponentId_fieldKey: {
            catalogComponentId: component.id,
            fieldKey: fieldDef.fieldKey,
          },
        },
        create: {
          catalogComponentId: component.id,
          fieldKey: fieldDef.fieldKey,
          label: fieldDef.label,
          valueType: fieldDef.valueType,
          isPublishableNow: fieldDef.isPublishableNow,
          isPublicVisible: true,
          displayOrder: fieldDef.displayOrder,
          status: "ACTIVE",
        },
        update: {
          label: fieldDef.label,
          valueType: fieldDef.valueType,
          isPublishableNow: fieldDef.isPublishableNow,
          isPublicVisible: true,
          displayOrder: fieldDef.displayOrder,
          status: "ACTIVE",
        },
      });
    }
  }

  return catalogByKey;
}

async function syncTemplatePlacements(templateId, orderedComponentDefs, catalogByKey) {
  const withCatalogTables = await supportsCatalogRelations();
  const existingPlacements = await db.villageDetailComponent.findMany({
    where: { templateId },
    select: {
      id: true,
      componentKey: true,
      fieldStandards: {
        select: { id: true, fieldKey: true },
      },
      _count: {
        select: {
          dataDesa: true,
          desaVisibility: true,
        },
      },
    },
  });

  const existingByKey = new Map(
    existingPlacements.map((placement) => [placement.componentKey, placement]),
  );
  const nextKeys = new Set(orderedComponentDefs.map((component) => component.componentKey));
  const placementIdByKey = new Map();
  const fieldStandardIdByComponentKey = new Map();

  for (const [index, componentDef] of orderedComponentDefs.entries()) {
    const catalogComponent = catalogByKey.get(componentDef.componentKey);
    if (!catalogComponent) {
      throw new Error(`Catalog component not found: ${componentDef.componentKey}`);
    }

    const placement = await db.villageDetailComponent.upsert({
      where: {
        templateId_componentKey: {
          templateId,
          componentKey: componentDef.componentKey,
        },
      },
      create: {
        templateId,
        ...(catalogComponent.id ? { catalogComponentId: catalogComponent.id } : {}),
        componentKey: componentDef.componentKey,
        label: componentDef.label,
        description: componentDef.description,
        componentType: componentDef.componentType,
        isDefaultVisible: componentDef.isDefaultVisible,
        displayOrder: index + 1,
        status: "ACTIVE",
      },
      update: {
        ...(catalogComponent.id ? { catalogComponentId: catalogComponent.id } : {}),
        label: componentDef.label,
        description: componentDef.description,
        componentType: componentDef.componentType,
        isDefaultVisible: componentDef.isDefaultVisible,
        displayOrder: index + 1,
        status: "ACTIVE",
      },
      select: {
        id: true,
      },
    });
    placementIdByKey.set(componentDef.componentKey, placement.id);

    const catalogFields =
      withCatalogTables && catalogComponent.id
        ? await db.villageComponentCatalogField.findMany({
            where: { catalogComponentId: catalogComponent.id, status: "ACTIVE" },
            orderBy: { displayOrder: "asc" },
          })
        : componentDef.fields.map((field) => ({
            id: null,
            fieldKey: field.fieldKey,
            label: field.label,
            valueType: field.valueType,
            sourcePolicyJson: null,
            validationRules: null,
            isRequired: false,
            isPublicVisible: true,
            isPublishableNow: field.isPublishableNow,
            displayOrder: field.displayOrder,
          }));

    const nextFieldKeys = new Set(catalogFields.map((field) => field.fieldKey));
    const existingPlacement = existingByKey.get(componentDef.componentKey);
    const staleFieldRows = (existingPlacement?.fieldStandards ?? []).filter(
      (field) => !nextFieldKeys.has(field.fieldKey),
    );

    if (staleFieldRows.length > 0) {
      await db.detailFieldStandard.updateMany({
        where: { id: { in: staleFieldRows.map((field) => field.id) } },
        data: { status: "ARCHIVED" },
      });
    }

    for (const field of catalogFields) {
      const fieldStandard = await db.detailFieldStandard.upsert({
        where: {
          templateId_componentId_fieldKey: {
            templateId,
            componentId: placement.id,
            fieldKey: field.fieldKey,
          },
        },
        create: {
          templateId,
          componentId: placement.id,
          ...(field.id ? { catalogFieldId: field.id } : {}),
          fieldKey: field.fieldKey,
          label: field.label,
          valueType: field.valueType,
          sourcePolicyJson: field.sourcePolicyJson,
          validationRules: field.validationRules,
          isRequired: field.isRequired,
          isPublicVisible: field.isPublicVisible,
          isPublishableNow: field.isPublishableNow,
          displayOrder: field.displayOrder,
          status: "ACTIVE",
        },
        update: {
          ...(field.id ? { catalogFieldId: field.id } : {}),
          label: field.label,
          valueType: field.valueType,
          sourcePolicyJson: field.sourcePolicyJson,
          validationRules: field.validationRules,
          isRequired: field.isRequired,
          isPublicVisible: field.isPublicVisible,
          isPublishableNow: field.isPublishableNow,
          displayOrder: field.displayOrder,
          status: "ACTIVE",
        },
        select: {
          id: true,
        },
      });

      const fieldMap = fieldStandardIdByComponentKey.get(componentDef.componentKey) ?? new Map();
      fieldMap.set(field.fieldKey, fieldStandard.id);
      fieldStandardIdByComponentKey.set(componentDef.componentKey, fieldMap);
    }
  }

  await migratePerangkatFieldsToDedicatedComponent({
    templateId,
    sourceComponentIds: [existingByKey.get("profil_desa")?.id ?? ""],
    perangkatComponentId: placementIdByKey.get("perangkat") ?? null,
    perangkatFieldIdMap: fieldStandardIdByComponentKey.get("perangkat") ?? new Map(),
  });

  for (const placement of existingPlacements) {
    if (nextKeys.has(placement.componentKey)) continue;
    if (placement._count.dataDesa > 0 || placement._count.desaVisibility > 0) {
      await db.villageDetailComponent.updateMany({
        where: { id: placement.id },
        data: { status: "ARCHIVED" },
      });
      await db.detailFieldStandard.updateMany({
        where: { componentId: placement.id },
        data: { status: "ARCHIVED" },
      });
      continue;
    }

    await db.detailFieldStandard.deleteMany({ where: { componentId: placement.id } });
    await db.villageDetailComponent.deleteMany({ where: { id: placement.id } });
  }
}

async function seedTemplates(catalogByKey) {
  const defaultTemplate = await db.villageDetailTemplate.upsert({
    where: { key: DEFAULT_TEMPLATE_MANIFEST.key },
    create: {
      key: DEFAULT_TEMPLATE_MANIFEST.key,
      name: DEFAULT_TEMPLATE_MANIFEST.name,
      description: DEFAULT_TEMPLATE_MANIFEST.description,
      isDefault: true,
      status: "ACTIVE",
    },
    update: {
      name: DEFAULT_TEMPLATE_MANIFEST.name,
      description: DEFAULT_TEMPLATE_MANIFEST.description,
      isDefault: true,
      status: "ACTIVE",
    },
  });

  await syncTemplatePlacements(
    defaultTemplate.id,
    COMPONENT_CATALOG.filter((component) =>
      DEFAULT_TEMPLATE_MANIFEST.componentKeys.includes(component.componentKey),
    ),
    catalogByKey,
  );

  for (const legacy of LEGACY_TEMPLATE_MANIFESTS) {
    await db.villageDetailTemplate.upsert({
      where: { key: legacy.key },
      create: {
        key: legacy.key,
        name: legacy.name,
        description: legacy.description,
        isDefault: false,
        status: legacy.status,
      },
      update: {
        name: legacy.name,
        description: legacy.description,
        isDefault: false,
        status: legacy.status,
      },
    });
  }

  return defaultTemplate;
}

async function seedAssignments(templateId) {
  const desaRows = await db.desa.findMany({
    select: { id: true, nama: true },
    orderBy: { nama: "asc" },
  });

  for (const desa of desaRows) {
    await db.desaDetailTemplateAssignment.upsert({
      where: { desaId: desa.id },
      create: {
        desaId: desa.id,
        templateId,
        isActive: true,
        reason: "Unified active template",
      },
      update: {
        templateId,
        isActive: true,
        reason: "Unified active template",
      },
    });
  }

  await db.desaDetailComponentVisibility.deleteMany({});
}

function isMeaningfulFieldValue(row) {
  if (typeof row?.valueText === "string" && row.valueText.trim().length > 0) return true;
  if (Array.isArray(row?.valueJson)) return row.valueJson.length > 0;
  return row?.valueJson !== null && row?.valueJson !== undefined;
}

function normalizePerangkatPayload(perangkat, kepalaDesa) {
  if (!Array.isArray(perangkat)) return [];

  const normalized = perangkat
    .filter((item) => item && typeof item === "object")
    .map((item) => ({
      ...item,
      jabatan: typeof item.jabatan === "string" ? item.jabatan.trim() : "",
      nama: typeof item.nama === "string" ? item.nama.trim() : "",
    }))
    .filter((item) => item.jabatan && item.nama);

  if (!kepalaDesa || typeof kepalaDesa !== "string" || kepalaDesa.trim().length === 0) {
    return normalized;
  }

  const kepalaDesaName = kepalaDesa.trim();
  const kepalaDesaIndex = normalized.findIndex((item) => /kepala desa/i.test(item.jabatan));

  if (kepalaDesaIndex >= 0) {
    const next = [...normalized];
    next[kepalaDesaIndex] = {
      ...next[kepalaDesaIndex],
      nama: kepalaDesaName,
    };
    return next;
  }

  return [{ jabatan: "Kepala Desa", nama: kepalaDesaName }, ...normalized];
}

async function upsertPublishedTemplateField({
  desaId,
  templateId,
  componentId,
  fieldStandardId,
  fieldKey,
  valueText = null,
  valueJson = null,
  sourceLabel = "Legacy perangkat_desa backfill",
  reviewNote,
  overwriteMeaningful = false,
}) {
  const existingRow = await db.dataDesa.findFirst({
    where: {
      desaId,
      templateId,
      componentId,
      fieldKey,
      isActive: true,
    },
    orderBy: [{ publishedAt: "desc" }, { updatedAt: "desc" }],
    select: {
      id: true,
      valueText: true,
      valueJson: true,
    },
  });

  if (existingRow && isMeaningfulFieldValue(existingRow) && !overwriteMeaningful) {
    return false;
  }

  const payload = {
    templateId,
    componentId,
    fieldStandardId,
    fieldKey,
    valueText,
    valueJson,
    sourceLabel,
    reviewNote,
    status: "PUBLISHED",
    isActive: true,
    publishedAt: new Date(),
  };

  if (existingRow) {
    await db.dataDesa.updateMany({
      where: { id: existingRow.id },
      data: payload,
    });
    return true;
  }

  await db.dataDesa.create({
    data: {
      desaId,
      ...payload,
    },
  });
  return true;
}

async function backfillLegacyPerangkatFields(templateId) {
  const perangkatComponent = await db.villageDetailComponent.findFirst({
    where: {
      templateId,
      componentKey: "perangkat",
      status: "ACTIVE",
    },
    select: {
      id: true,
      fieldStandards: {
        where: {
          status: "ACTIVE",
          fieldKey: { in: ["kepalaDesa", "perangkatDesa"] },
        },
        select: {
          id: true,
          fieldKey: true,
        },
      },
    },
  });

  if (!perangkatComponent) return;

  const fieldIdMap = new Map(
    perangkatComponent.fieldStandards.map((field) => [field.fieldKey, field.id]),
  );
  const perangkatFieldId = fieldIdMap.get("perangkatDesa") ?? null;
  const kepalaDesaFieldId = fieldIdMap.get("kepalaDesa") ?? null;
  if (!perangkatFieldId && !kepalaDesaFieldId) return;

  const legacyRows = await db.perangkatDesa.findMany({
    where: {
      desa: {
        detailTemplateAssignment: {
          templateId,
          isActive: true,
        },
      },
    },
    orderBy: [{ jabatan: "asc" }, { nama: "asc" }],
    select: {
      desaId: true,
      jabatan: true,
      nama: true,
      periode: true,
      kontakLabel: true,
    },
  });

  const existingKepalaDesaRows = await db.dataDesa.findMany({
    where: {
      templateId,
      fieldKey: "kepalaDesa",
      status: "PUBLISHED",
      isActive: true,
    },
    select: {
      desaId: true,
      valueText: true,
    },
    orderBy: [{ publishedAt: "desc" }, { updatedAt: "desc" }],
  });
  const kepalaDesaByDesaId = new Map();
  for (const row of existingKepalaDesaRows) {
    if (kepalaDesaByDesaId.has(row.desaId)) continue;
    if (typeof row.valueText !== "string" || row.valueText.trim().length === 0) continue;
    kepalaDesaByDesaId.set(row.desaId, row.valueText.trim());
  }

  const perangkatByDesaId = new Map();
  for (const row of legacyRows) {
    const list = perangkatByDesaId.get(row.desaId) ?? [];
    list.push({
      jabatan: row.jabatan,
      nama: row.nama,
      ...(row.periode ? { periode: row.periode } : {}),
      ...(row.kontakLabel ? { kontak: row.kontakLabel } : {}),
    });
    perangkatByDesaId.set(row.desaId, list);
  }

  for (const [desaId, perangkat] of perangkatByDesaId.entries()) {
    const legacyKepalaDesa =
      perangkat.find((item) => /kepala desa/i.test(item.jabatan))?.nama ?? null;
    const preferredKepalaDesa = kepalaDesaByDesaId.get(desaId) ?? legacyKepalaDesa;
    const normalizedPerangkat = normalizePerangkatPayload(perangkat, preferredKepalaDesa);

    if (perangkatFieldId) {
      await upsertPublishedTemplateField({
        desaId,
        templateId,
        componentId: perangkatComponent.id,
        fieldStandardId: perangkatFieldId,
        fieldKey: "perangkatDesa",
        valueJson: normalizedPerangkat,
        reviewNote:
          "Backfilled from legacy perangkat_desa rows after perangkat ownership moved into the dedicated perangkat component.",
        overwriteMeaningful: true,
      });
    }

    if (kepalaDesaFieldId) {
      const kepalaDesa = preferredKepalaDesa;
      if (!kepalaDesa) continue;

      await upsertPublishedTemplateField({
        desaId,
        templateId,
        componentId: perangkatComponent.id,
        fieldStandardId: kepalaDesaFieldId,
        fieldKey: "kepalaDesa",
        valueText: kepalaDesa,
        reviewNote:
          "Backfilled kepalaDesa from legacy perangkat_desa rows after perangkat ownership moved into the dedicated perangkat component.",
      });
    }
  }
}

const batukarutProfilBackfill = {
  teleponDesa: "022-87991234",
  emailDesa: "halo@batukarut.desa.id",
  potensiUnggulan: "Wisata sungai, kopi rakyat, dan hortikultura dataran tinggi.",
  luasWilayah: 12.4,
  mataPencaharian: "Pertanian hortikultura, UMKM desa, dan jasa lokal",
  luasSawah: 186,
  luasHutan: 94,
  fasilitasUmum: [
    {
      jenis: "pendidikan",
      nama: "PAUD Melati Batukarut",
      jumlah: 1,
      kondisi: "baik",
      ket: "Aktif melayani pendidikan anak usia dini.",
    },
    {
      jenis: "kesehatan",
      nama: "Posyandu Mawar",
      jumlah: 2,
      kondisi: "baik",
      ket: "Kegiatan bulanan kader kesehatan desa.",
    },
    {
      jenis: "olahraga",
      nama: "Lapangan serbaguna",
      jumlah: 1,
      kondisi: "sedang",
      ket: "Dipakai untuk olahraga dan kegiatan warga.",
    },
  ],
  asetDesa: [
    {
      jenis: "tanah",
      nama: "Tanah kas desa Blok Cimeong",
      lokasi: "Dusun Cimeong",
      nilai: 950_000_000,
      tahunBeli: 2012,
      kondisi: "baik",
    },
    {
      jenis: "bangunan",
      nama: "Gedung serbaguna desa",
      lokasi: "Dusun Tengah",
      nilai: 780_000_000,
      tahunBeli: 2018,
      kondisi: "baik",
    },
    {
      jenis: "kendaraan",
      nama: "Mobil siaga desa",
      lokasi: "Kantor Desa",
      nilai: 285_000_000,
      tahunBeli: 2021,
      kondisi: "sedang",
    },
  ],
  lembagaDesa: [
    {
      jenis: "pemerintahan",
      nama: "BPD Batukarut",
      ketua: "Dadan Hidayat",
      anggota: 7,
      tahunBerdiri: 1999,
      aktif: true,
      deskripsi: "Mitra pemerintahan desa untuk musyawarah dan pengawasan kebijakan.",
      program: "Musyawarah desa dan aspirasi warga",
    },
    {
      jenis: "pemberdayaan",
      nama: "PKK Desa Batukarut",
      ketua: "Nani Rohaeni",
      anggota: 18,
      tahunBerdiri: 2004,
      aktif: true,
      deskripsi: "Gerakan pemberdayaan keluarga, kader posyandu, dan ekonomi rumah tangga.",
      program: "Kader kesehatan dan kebun gizi",
    },
    {
      jenis: "ekonomi",
      nama: "Karang Taruna Mandiri",
      ketua: "Yudi Hermawan",
      anggota: 24,
      tahunBerdiri: 2016,
      aktif: true,
      deskripsi: "Organisasi pemuda untuk kegiatan sosial, olahraga, dan ekonomi kreatif.",
      program: "Festival sungai dan pelatihan UMKM muda",
    },
  ],
  bumdes: {
    nama: "BUMDes Batu Maju",
    bidangUsaha: "Unit wisata sungai, perdagangan hasil tani, dan sewa alat desa",
    tahunBerdiri: 2018,
    modal: 175_000_000,
    omsetPerTahun: 245_000_000,
    status: "aktif",
    deskripsi:
      "BUMDes mengelola potensi wisata sungai, pemasaran hasil tani, dan layanan sewa alat untuk warga.",
  },
};

const batukarutCompleteTemplateBackfill = {
  identitas: {
    websiteUrl: "https://batukarut.desa.id",
    kategori: "Maju",
    tahunData: 2026,
    kecamatan: "Arjasari",
    kabupaten: "Kabupaten Bandung",
    provinsi: "Jawa Barat",
  },
  demografi: {
    jumlahPenduduk: 3786,
    jumlahKK: 987,
    jumlahDusun: 4,
    jumlahRt: 11,
    jumlahRw: 5,
  },
  transparansi: {
    skorTransparansiTotal: 82,
    skorKetepatan: 78,
    skorKelengkapan: 85,
  },
  anggaran: {
    totalAnggaran: 2_800_000_000,
    terealisasi: 2_015_000_000,
    persentaseSerapan: 72,
  },
  pendapatan: {
    danaDesa: 1_200_000_000,
    add: 950_000_000,
    pades: 225_000_000,
    bantuanKeuangan: 425_000_000,
  },
  kinerja: {
    outputFisik: [
      {
        label: "Jalan lingkungan diperbaiki",
        satuan: "meter",
        target: 850,
        realisasi: 650,
        persentase: 76,
      },
      {
        label: "Drainase permukiman dibangun",
        satuan: "meter",
        target: 420,
        realisasi: 310,
        persentase: 74,
      },
      {
        label: "Posyandu aktif didukung",
        satuan: "unit",
        target: 3,
        realisasi: 3,
        persentase: 100,
      },
    ],
    riwayatAPBDes: [
      { tahun: 2022, totalAnggaran: 2_200_000_000, terealisasi: 1_520_000_000, persentaseSerapan: 69 },
      { tahun: 2023, totalAnggaran: 2_450_000_000, terealisasi: 1_830_000_000, persentaseSerapan: 75 },
      { tahun: 2024, totalAnggaran: 2_620_000_000, terealisasi: 1_930_000_000, persentaseSerapan: 74 },
      { tahun: 2025, totalAnggaran: 2_750_000_000, terealisasi: 2_030_000_000, persentaseSerapan: 74 },
      { tahun: 2026, totalAnggaran: 2_800_000_000, terealisasi: 2_015_000_000, persentaseSerapan: 72 },
    ],
    apbdesItems: [
      {
        kode: "1",
        bidang: "Penyelenggaraan Pemerintahan Desa",
        anggaran: 720_000_000,
        realisasi: 560_000_000,
        persentase: 78,
      },
      {
        kode: "2",
        bidang: "Pelaksanaan Pembangunan Desa",
        anggaran: 1_120_000_000,
        realisasi: 790_000_000,
        persentase: 71,
      },
      {
        kode: "3",
        bidang: "Pembinaan Kemasyarakatan",
        anggaran: 360_000_000,
        realisasi: 270_000_000,
        persentase: 75,
      },
      {
        kode: "4",
        bidang: "Pemberdayaan Masyarakat",
        anggaran: 430_000_000,
        realisasi: 305_000_000,
        persentase: 71,
      },
      {
        kode: "5",
        bidang: "Penanggulangan Bencana dan Darurat",
        anggaran: 170_000_000,
        realisasi: 90_000_000,
        persentase: 53,
      },
    ],
  },
  profil_desa: batukarutProfilBackfill,
};

const batukarutPublicDocumentBackfill = [
  {
    id: "doc-batukarut-apbdes-2026",
    tahun: 2026,
    namaDokumen: "APBDes Batukarut 2026",
    jenisDokumen: "apbdes",
    status: "tersedia",
    url: "https://batukarut.desa.id/dokumen/apbdes-2026",
  },
  {
    id: "doc-batukarut-rkpdes-2026",
    tahun: 2026,
    namaDokumen: "RKP Desa Batukarut 2026",
    jenisDokumen: "rkpdes",
    status: "tersedia",
    url: "https://batukarut.desa.id/dokumen/rkpdes-2026",
  },
  {
    id: "doc-batukarut-realisasi-semester-1-2026",
    tahun: 2026,
    namaDokumen: "Laporan Realisasi Semester I 2026",
    jenisDokumen: "realisasi",
    status: "tersedia",
    url: "https://batukarut.desa.id/dokumen/realisasi-semester-1-2026",
  },
  {
    id: "doc-batukarut-rpjmdes-2021-2027",
    tahun: 2021,
    namaDokumen: "RPJMDes Batukarut 2021-2027",
    jenisDokumen: "rpjmdes",
    status: "needs_review",
    url: "https://batukarut.desa.id/dokumen/rpjmdes-2021-2027",
  },
  {
    id: "doc-batukarut-lppd-2025",
    tahun: 2025,
    namaDokumen: "LPPD Batukarut 2025",
    jenisDokumen: "lppd",
    status: "needs_review",
    url: "https://batukarut.desa.id/dokumen/lppd-2025",
  },
];

async function backfillDemoBatukarutCompleteTemplateFields(templateId) {
  const components = await db.villageDetailComponent.findMany({
    where: {
      templateId,
      componentKey: { in: Object.keys(batukarutCompleteTemplateBackfill) },
      status: "ACTIVE",
    },
    select: {
      id: true,
      componentKey: true,
      fieldStandards: {
        where: { status: "ACTIVE" },
        select: {
          id: true,
          fieldKey: true,
          valueType: true,
        },
      },
    },
  });

  const batukarut = await db.desa.findUnique({
    where: { id: "demo-desa-batukarut" },
    select: { id: true },
  });
  if (!batukarut) return;

  for (const component of components) {
    const values = batukarutCompleteTemplateBackfill[component.componentKey] ?? {};
    const fieldMap = new Map(
      component.fieldStandards.map((field) => [field.fieldKey, field]),
    );

    for (const [fieldKey, value] of Object.entries(values)) {
      const field = fieldMap.get(fieldKey);
      if (!field) continue;

      const isTextValue = ["string", "text", "url"].includes(field.valueType);
      await upsertPublishedTemplateField({
        desaId: batukarut.id,
        templateId,
        componentId: component.id,
        fieldStandardId: field.id,
        fieldKey,
        valueText: isTextValue ? String(value) : null,
        valueJson: isTextValue ? null : value,
        sourceLabel: "Seed dummy contoh Batukarut",
        reviewNote:
          "Backfilled complete demo values so Batukarut can show a full public detail preview from DataDesa/template fields.",
        overwriteMeaningful: true,
      });
    }
  }
}

async function backfillDemoBatukarutPublicDocuments() {
  const batukarut = await db.desa.findUnique({
    where: { id: "demo-desa-batukarut" },
    select: { id: true },
  });
  if (!batukarut) return;

  const source = await db.dataSource.findFirst({
    where: {
      desaId: batukarut.id,
      sourceType: "official_website",
    },
    select: { id: true },
  });

  for (const document of batukarutPublicDocumentBackfill) {
    await db.dokumenPublik.upsert({
      where: { id: document.id },
      update: {
        desaId: batukarut.id,
        tahun: document.tahun,
        namaDokumen: document.namaDokumen,
        jenisDokumen: document.jenisDokumen,
        status: document.status,
        url: document.url,
        sourceId: source?.id ?? null,
        dataStatus: "demo",
        lastCheckedAt: new Date(),
      },
      create: {
        ...document,
        desaId: batukarut.id,
        sourceId: source?.id ?? null,
        dataStatus: "demo",
        lastCheckedAt: new Date(),
      },
    });
  }
}

async function main() {
  console.log(`[template:sync] target ${safeDatabaseTarget()}`);
  if (dryRun) {
    console.log("[template:sync] dry-run enabled; no database writes will be made.");
  }

  await runStage("preflight Prisma SELECT 1", async () => {
    await db.$queryRaw`SELECT 1`;
  }, { timeoutMs: 30_000 });

  const withCatalogTables = await runStage(
    "detect catalog relation support",
    supportsCatalogRelations,
    { timeoutMs: 30_000 },
  );

  if (dryRun) {
    console.log(
      `[template:sync] dry-run summary: catalogComponents=${COMPONENT_CATALOG.length}, defaultTemplate=${DEFAULT_TEMPLATE_MANIFEST.key}, catalogTables=${withCatalogTables}`,
    );
    return;
  }

  const catalogByKey = await runStage("seed component catalog", async () =>
    seedComponentCatalog(withCatalogTables),
  );

  const defaultTemplate = await runStage("seed templates and placements", async () =>
    seedTemplates(catalogByKey),
  );

  await runStage("seed desa assignments", async () =>
    seedAssignments(defaultTemplate.id),
  );

  await runStage("backfill perangkat template fields", async () =>
    backfillLegacyPerangkatFields(defaultTemplate.id),
  );

  await runStage("backfill Batukarut complete template fields", async () =>
    backfillDemoBatukarutCompleteTemplateFields(defaultTemplate.id),
  );

  await runStage("backfill Batukarut public documents", async () =>
    backfillDemoBatukarutPublicDocuments(),
  );

  console.log("[template:sync] complete");
}

main()
  .catch((error) => {
    console.error("Seed templates failed:", error);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
