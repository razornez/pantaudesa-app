import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getDesaByIdOrSlugWithFallback } from "@/lib/data/desa-read";
import {
  buildPublishedProfilSection,
  readPublishedNumber,
  readPublishedString,
  toPublishedApbdesItems,
  toPublishedOutputFisikArray,
  toPublishedPerangkatDesaArray,
  toPublishedRiwayatArray,
} from "@/lib/data/desa-template-public-view";
import { getPublishedTemplateData } from "@/lib/data/village-template-read";
import PublicContributeForm from "@/components/desa/PublicContributeForm";
import {
  getAcceptedFileInputValue,
  getAllowedFormatLabels,
  getMaxFileSizeBytes,
} from "@/lib/storage/upload-validation";
import { getVoicePreviewForDesaFromDb } from "@/lib/data/voice-read";
import { perfStart, publicPerfLog } from "@/lib/perf";
import {
  buildPublicDetailRenderPlan,
  getOrderedVisibleSlots,
  type PublicDetailSlotKey,
} from "@/lib/village-data/public-detail-composition";
import { buildRuntimeTemplateManifest } from "@/lib/village-data/runtime-template-manifest";
import type { ComponentRendererType } from "@/lib/village-data/component-catalog-manifest";
import { PUBLIC_TEMPLATE_RENDERER_REGISTRY } from "@/components/desa/public-template-registry";
import DetailV2Shell, { type ChapterRailItem } from "@/components/desa/v2/DetailV2Shell";
import ChIdentity from "@/components/desa/v2/ChIdentity";
import ChSumber from "@/components/desa/v2/ChSumber";
import ChAnggaran from "@/components/desa/v2/ChAnggaran";
import ChKinerja from "@/components/desa/v2/ChKinerja";
import ChIsiDesa from "@/components/desa/v2/ChIsiDesa";
import ChTransparansi from "@/components/desa/v2/ChTransparansi";
import ChPanduan from "@/components/desa/v2/ChPanduan";
import ChSuara, { type VoicePreviewItem } from "@/components/desa/v2/ChSuara";
import ChPeta from "@/components/desa/v2/showcase/ChPeta";

import type { Metadata } from "next";

// "force-dynamic" would bypass unstable_cache in App Router — then every
// request hits the DB cold. Use revalidate instead so Next.js ISR cache
// works and detail pages are served from cache for up to 5 minutes.
export const revalidate = 300;

interface Props {
  params: Promise<{ id: string }>;
}

const SLOT_RAIL_LABEL: Record<PublicDetailSlotKey, string> = {
  first_view: "Kenalan",
  sumber_dokumen: "Sumber & Dokumen",
  transparansi: "Transparansi",
  ringkasan_anggaran: "Anggaran",
  kinerja_anggaran: "Kinerja",
  kelengkapan_desa: "Isi Desa",
  panduan_warga: "Panduan",
  suara_warga: "Suara Warga",
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const desa = await getDesaByIdOrSlugWithFallback(id);
  if (!desa) return { title: "Desa Tidak Ditemukan" };

  const title = `${desa.nama} - Halaman Detail Desa`;
  const description = `${desa.nama}, ${desa.kecamatan}, ${desa.kabupaten}. Halaman detail desa berbasis template aktif dan data publik yang sudah diterbitkan.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `https://pantaudesa.id/desa/${desa.id}`,
      type: "article",
    },
    twitter: { title, description },
  };
}

export default async function DesaDetailPage({ params }: Props) {
  const routeTimer = perfStart();
  const { id } = await params;
  const desaTimer = perfStart();
  const desa = await getDesaByIdOrSlugWithFallback(id);
  publicPerfLog("public.desa-detail", "getDesaByIdOrSlugWithFallback()", desaTimer);
  if (!desa) return notFound();

  const templateData = await getPublishedTemplateData(desa.prismaId ?? desa.id);
  const runtimeManifest = buildRuntimeTemplateManifest(templateData.resolvedTemplate);
  publicPerfLog("public.desa-detail", "routeDataReady", routeTimer);

  const publishedValues = templateData.publishedValues;
  const publishedPenduduk = readPublishedNumber(publishedValues, "jumlahPenduduk");
  const publishedTahun = readPublishedNumber(publishedValues, "tahunData");
  const publishedTotalAnggaran = readPublishedNumber(publishedValues, "totalAnggaran");
  const publishedTerealisasi = readPublishedNumber(publishedValues, "terealisasi");
  const publishedPersentaseSerapan = readPublishedNumber(publishedValues, "persentaseSerapan");
  // Dana Desa pagu from DJPK (always present after ingestion; not the same as
  // APBDes totalAnggaran but the closest real budget figure we have).
  const publishedDanaDesa = readPublishedNumber(publishedValues, "danaDesa");

  // Real sources from DataDesa provenance (every published field carries a cited
  // source: DJPK, OSM, OpenSID, etc.). The legacy DataSource table is empty, which
  // made the detail page show "0 sumber" while displaying sourced data. Surface the
  // real provenance so the Sumber section reflects what's actually cited.
  const realSumber = (() => {
    const seen = new Set<string>();
    const out: { nama: string; status: "imported"; perluReview: boolean }[] = [];
    for (const s of templateData.sourceSummaries) {
      const label = s.sourceLabel?.trim();
      if (!label || seen.has(label)) continue;
      seen.add(label);
      out.push({ nama: label, status: "imported", perluReview: false });
    }
    return out;
  })();

  const desaView = {
    ...desa,
    sumber: realSumber.length > 0 ? realSumber : desa.sumber,
    jumlahSumber: realSumber.length > 0 ? realSumber.length : desa.jumlahSumber,
    kecamatan: readPublishedString(publishedValues, "kecamatan") ?? desa.kecamatan,
    kabupaten: readPublishedString(publishedValues, "kabupaten") ?? desa.kabupaten,
    provinsi: readPublishedString(publishedValues, "provinsi") ?? desa.provinsi,
    kategori: readPublishedString(publishedValues, "kategori") ?? desa.kategori,
    perangkat: toPublishedPerangkatDesaArray(
      publishedValues.perangkatDesa,
      readPublishedString(publishedValues, "kepalaDesa"),
    ),
    profil: buildPublishedProfilSection(publishedValues, desa.profil) ?? undefined,
    apbdes: toPublishedApbdesItems(publishedValues.apbdesItems),
    outputFisik: toPublishedOutputFisikArray(publishedValues.outputFisik),
    riwayat: toPublishedRiwayatArray(publishedValues.riwayatAPBDes),
    penduduk: publishedPenduduk ?? desa.penduduk,
    tahun: publishedTahun ?? desa.tahun,
    // Use APBDes totalAnggaran if published; fall back to danaDesa pagu from
    // DJPK when APBDes data isn't available. The pagu is real but only the
    // central-government share — ADD/PADes/bantuan will show as 0 (unknown).
    totalAnggaran: publishedTotalAnggaran ?? (desa.totalAnggaran > 0 ? desa.totalAnggaran : (publishedDanaDesa ?? 0)),
    terealisasi: publishedTerealisasi ?? desa.terealisasi,
    pendapatan: publishedTotalAnggaran ?? desa.totalAnggaran
      ? undefined  // keep existing pendapatan from APBDes if available
      : publishedDanaDesa
        ? { danaDesa: publishedDanaDesa, add: 0, pades: 0, bantuanKeuangan: 0 }
        : undefined,
  };

  desaView.persentaseSerapan =
    publishedPersentaseSerapan !== null
      ? publishedPersentaseSerapan
      : desaView.totalAnggaran > 0
        ? Math.round((desaView.terealisasi / desaView.totalAnggaran) * 100)
        : desa.persentaseSerapan;

  // Derived transparency score — computed from available published data when no
  // official score exists. Differentiates desa with public websites / contact info
  // from those with only regulatory data (DJPK, IDM, Dukcapil).
  // skorTransparansi is intentionally omitted from the DB read (see desa-read.ts:799)
  // so desa.skorTransparansi is always undefined — we always compute here.
  desaView.skorTransparansi = (() => {
    // ketepatan: recency of official data sources
    const tahun = readPublishedNumber(publishedValues, "tahunData");
    const hasIdm = readPublishedNumber(publishedValues, "idmScore") !== null;
    const ketepatan = hasIdm
      ? (tahun !== null && tahun >= 2024 ? 82 : 65)
      : (publishedDanaDesa !== null ? 60 : 45);

    // kelengkapan: public access to village information
    const hasDanaDesa = publishedDanaDesa !== null;
    const hasWebsite = !!desa.websiteUrl;
    const hasKepalaDesa = readPublishedString(publishedValues, "kepalaDesa") !== null;
    const hasDokumen = (desa.dokumen?.length ?? 0) > 0;
    const kelengkapan = Math.min(100,
      (hasDanaDesa ? 25 : 0) +
      (hasWebsite ? 35 : 0) +
      (hasKepalaDesa ? 25 : 0) +
      (hasDokumen ? 15 : 0),
    );

    // konsistensi: budget and governance data coherence across sources
    const hasSerapan = desaView.totalAnggaran > 0;
    const konsistensi = hasDanaDesa && hasIdm
      ? (hasSerapan ? 78 : 68)
      : (hasDanaDesa ? 58 : 42);

    // responsif: citizen communication channels available
    const responsif = hasWebsite ? 62 : (hasKepalaDesa ? 52 : 44);

    const total = Math.round((ketepatan + kelengkapan + konsistensi + responsif) / 4);
    return { total, ketepatan, kelengkapan, konsistensi, responsif, isDerived: true };
  })();

  const visibleComponents = runtimeManifest.visibleComponents;

  // Real coordinates from DataDesa (for map chapter + source attribution)
  const realLat = readPublishedNumber(publishedValues, "geoLat");
  const realLng = readPublishedNumber(publishedValues, "geoLng");
  const geoIsReal = realLat !== null && realLng !== null;

  // Source note derived from what real fields were ingested for this desa
  const derivedSourceNote = (() => {
    const hasDemografi = publishedPenduduk !== null || readPublishedString(publishedValues, "kepalaDesa") !== null;
    const parts: string[] = [];
    if (hasDemografi) parts.push("Website Resmi Desa (OpenSID)");
    if (geoIsReal) parts.push("OpenStreetMap");
    parts.push("DJPK Kemenkeu (Dana Desa)");
    return { label: parts.join(" · "), mock: false };
  })();

  const visibleSlots = getOrderedVisibleSlots(visibleComponents);
  const renderPlan = buildPublicDetailRenderPlan(visibleComponents);
  const hasRenderer = (rendererType: string) =>
    visibleComponents.some((component) => component.rendererType === rendererType);

  const showBudgetSummary = hasRenderer("budget_summary") || hasRenderer("pendapatan_breakdown");
  const showSourceSection = hasRenderer("source_snapshot");
  const showPerangkatSection = hasRenderer("perangkat_contacts");
  const showTransparansiSection = hasRenderer("transparency_metrics");
  const showKinerjaSection = hasRenderer("kinerja_breakdown");
  const showProfilSection = hasRenderer("kelengkapan_tabs");
  const showPanduanSection = hasRenderer("citizen_guide");
  const showSuaraSection = hasRenderer("voice_preview");
  const showFirstView = visibleSlots.includes("first_view");

  const voiceSummary = showSuaraSection
    ? await getVoicePreviewForDesaFromDb(desaView.prismaId ?? desaView.id)
    : { total: 0, preview: [] as VoicePreviewItem[] };

  // Registry-only components (non-legacy renderers, e.g. agenda_desa)
  const registryOnlySectionEntries = await Promise.all(
    renderPlan
      .filter((item) => item.kind === "registry_component")
      .map(async (item) => {
        const section = await PUBLIC_TEMPLATE_RENDERER_REGISTRY[
          item.rendererType as ComponentRendererType
        ]?.render({
          desa: desaView,
          publishedValues,
          sourceSummaries: templateData.sourceSummaries,
        });
        return [item.componentKey, section] as const;
      }),
  );
  const registryNodesByKey = new Map(
    registryOnlySectionEntries.filter(
      (entry) => entry[1] !== null && entry[1] !== undefined && entry[1] !== false,
    ) as Array<readonly [string, ReactNode]>,
  );

  // Per-slot chapter visibility + renderer (template-driven)
  const slotEnabled: Partial<Record<PublicDetailSlotKey, boolean>> = {
    first_view: showFirstView,
    sumber_dokumen: showSourceSection,
    transparansi: showTransparansiSection || showPerangkatSection,
    ringkasan_anggaran: showBudgetSummary,
    kinerja_anggaran: showKinerjaSection,
    kelengkapan_desa: showProfilSection,
    panduan_warga: showPanduanSection,
    suara_warga: showSuaraSection,
  };

  const enabledChapterCount = renderPlan.reduce((n, item) => {
    if (item.kind === "legacy_slot") return n + (slotEnabled[item.slot] ? 1 : 0);
    return n + (registryNodesByKey.has(item.componentKey) ? 1 : 0);
  }, 0) + (geoIsReal ? 1 : 0);

  const renderSlotChapter = (slot: PublicDetailSlotKey, no: string): ReactNode => {
    switch (slot) {
      case "first_view":
        return (
          <ChIdentity
            desa={desaView}
            chapterNo={no}
            totalChapters={enabledChapterCount}
            sourceNote={derivedSourceNote}
          />
        );
      case "sumber_dokumen":
        return <ChSumber desa={desaView} chapterNo={no} sourceNote={derivedSourceNote} />;
      case "transparansi":
        return <ChTransparansi desa={desaView} chapterNo={no} sourceNote={derivedSourceNote} />;
      case "ringkasan_anggaran":
        return <ChAnggaran desa={desaView} chapterNo={no} sourceNote={derivedSourceNote} />;
      case "kinerja_anggaran":
        return <ChKinerja desa={desaView} chapterNo={no} sourceNote={derivedSourceNote} />;
      case "kelengkapan_desa":
        return <ChIsiDesa desa={desaView} chapterNo={no} sourceNote={derivedSourceNote} />;
      case "panduan_warga":
        return <ChPanduan desa={desaView} chapterNo={no} sourceNote={derivedSourceNote} />;
      case "suara_warga":
        return <ChSuara desa={desaView} chapterNo={no} voice={voiceSummary} sourceNote={derivedSourceNote} />;
      default:
        return null;
    }
  };

  // Build ordered chapters from the render plan, numbering sequentially.
  const chapters: ChapterRailItem[] = [];
  const chapterNodes: ReactNode[] = [];
  let chapterIndex = 0;

  for (const item of renderPlan) {
    if (item.kind === "legacy_slot") {
      if (!slotEnabled[item.slot]) continue;

      const no = String(chapterIndex).padStart(2, "0");
      const node = renderSlotChapter(item.slot, no);
      if (!node) continue;
      chapters.push({ id: `ch-${no}`, label: `${no} · ${SLOT_RAIL_LABEL[item.slot]}` });
      chapterNodes.push(<div key={`ch-${item.slot}`}>{node}</div>);
      chapterIndex += 1;

      // Insert map chapter right AFTER first_view (Kenalan) → chapter 01.
      if (item.slot === "first_view" && geoIsReal) {
        const petaNo = String(chapterIndex).padStart(2, "0");
        chapters.push({ id: `ch-${petaNo}`, label: `${petaNo} · Peta` });
        chapterNodes.push(
          <div key="ch-peta">
            <ChPeta
              chapterNo={petaNo}
              geo={{
                lat: realLat!,
                lng: realLng!,
                topografi: `${desaView.kecamatan}, Kab. Bandung`,
                poi: [{ label: `${desaView.nama} (pusat desa)`, jenis: "kantor" as const, lat: realLat!, lng: realLng! }],
              }}
              namaDesa={desaView.nama}
              coordSourceLabel="OpenStreetMap"
            />
          </div>,
        );
        chapterIndex += 1;
      }
    } else {
      const section = registryNodesByKey.get(item.componentKey);
      if (!section) continue;
      const no = String(chapterIndex).padStart(2, "0");
      chapters.push({ id: `ch-${no}`, label: `${no} · ${item.componentKey}` });
      chapterNodes.push(
        <section key={`reg-${item.componentKey}`} id={`ch-${no}`} className="chapter">
          <div className="mx-auto max-w-[1080px] px-4 sm:px-6">{section}</div>
        </section>,
      );
      chapterIndex += 1;
    }
  }

  // Public "help complete the data" contribution form — appended as the final
  // chapter. Lists which dimensions are still missing so visitors know what helps.
  const missingDimensions: string[] = [];
  if (!geoIsReal) missingDimensions.push("Koordinat/peta");
  if (publishedPenduduk === null && !(desaView.penduduk > 0)) missingDimensions.push("Jumlah penduduk");
  if (readPublishedNumber(publishedValues, "luasWilayah") === null) missingDimensions.push("Luas wilayah");
  if (readPublishedString(publishedValues, "kepalaDesa") === null) missingDimensions.push("Kepala desa");
  if ((desaView.dokumen?.length ?? 0) === 0) missingDimensions.push("Dokumen publik");
  if ((desaView.apbdes?.length ?? 0) === 0) missingDimensions.push("Rincian APBDes");

  chapters.push({ id: "ch-contribute", label: "★ Bantu Lengkapi" });
  chapterNodes.push(
    <section key="ch-contribute" id="ch-contribute" className="chapter">
      <div className="mx-auto max-w-[1080px] px-4 sm:px-6">
        <PublicContributeForm
          desaId={desaView.prismaId ?? desaView.id}
          desaNama={desaView.nama}
          missing={missingDimensions}
          accept={getAcceptedFileInputValue()}
          formatLabels={getAllowedFormatLabels()}
          maxFileMb={Math.round(getMaxFileSizeBytes() / (1024 * 1024))}
        />
      </div>
    </section>,
  );

  return (
    <>
      {/* Breadcrumb — positioned above the chapter rail so users always know their context */}
      <nav aria-label="Breadcrumb" className="mx-auto max-w-[1080px] px-4 sm:px-6 pt-4 pb-1">
        <ol className="flex flex-wrap items-center gap-1 text-xs text-slate-400">
          <li>
            <Link href="/" className="hover:text-indigo-600 transition-colors">Beranda</Link>
          </li>
          <li aria-hidden className="select-none">›</li>
          <li>
            <Link href="/desa" className="hover:text-indigo-600 transition-colors">Desa</Link>
          </li>
          <li aria-hidden className="hidden sm:list-item select-none">›</li>
          <li className="hidden sm:list-item">
            <Link href={`/desa?kabupaten=${encodeURIComponent(desaView.kabupaten)}`} className="hover:text-indigo-600 transition-colors">
              {desaView.kabupaten}
            </Link>
          </li>
          <li aria-hidden className="select-none">›</li>
          <li className="font-medium text-slate-700 truncate max-w-[180px]" aria-current="page">
            {desaView.nama}
          </li>
        </ol>
      </nav>
      <DetailV2Shell chapters={chapters}>
        {chapterNodes}
      </DetailV2Shell>
    </>
  );
}
