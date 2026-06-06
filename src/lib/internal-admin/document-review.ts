import type { NextRequest } from "next/server";
import type { PrismaClient } from "@prisma/client";
import type { DesaVersionSnapshot } from "@/lib/versioning/desa-versioning";

export async function findDocumentForReview(
  db: PrismaClient,
  documentId: string
) {
  return db.adminDesaDocument.findUnique({
    where: { id: documentId },
    select: {
      id: true,
      desaId: true,
      status: true,
      title: true,
      aiMappingStatus: true,
      aiMappingResult: true,
      uploadedById: true,
    },
  });
}

export function getRequestActorMeta(request: NextRequest) {
  return {
    ipAddress: request.headers.get("x-forwarded-for") ?? undefined,
    userAgent: request.headers.get("user-agent") ?? undefined,
  };
}

export function toDesaVersionSnapshot(input: {
  websiteUrl: string | null;
  kategori: string | null;
  tahunData: number | null;
  jumlahPenduduk: number | null;
  kecamatan: string;
  kabupaten: string;
  provinsi: string;
}): DesaVersionSnapshot {
  return {
    websiteUrl: input.websiteUrl ?? null,
    kategori: input.kategori ?? null,
    tahunData: input.tahunData ?? null,
    jumlahPenduduk: input.jumlahPenduduk ?? null,
    kecamatan: input.kecamatan,
    kabupaten: input.kabupaten,
    provinsi: input.provinsi,
  };
}
