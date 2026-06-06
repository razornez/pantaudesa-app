import {
  AI_MAPPABLE_DESA_FIELDS,
  readAiMappingDraft,
  type AiMappingDraft,
  type AiMappableDesaField,
} from "@/lib/admin-claim/ai-mapping";
import { readVillageVersionCandidate } from "@/lib/versioning/desa-versioning";
import type {
  DocRow,
  DraftSummary,
  FieldReviewContext,
  NextStepCopy,
  VersionCandidateSummary,
} from "./types";

export function formatReviewStatusLabel(status: string | null) {
  if (!status) return null;
  if (status === "DRAFT_READY_REVIEW" || status === "DRAFT_PENDING_REVIEW") {
    return "Draft review tersedia";
  }
  if (status === "DONE") return "Review selesai";
  if (status === "FAILED") return "Review gagal";
  if (status === "PENDING") return "Menunggu dicek";
  return status;
}

export function buildStatusHref(pathname: string, status: string) {
  if (!status) return pathname;
  return `${pathname}?status=${encodeURIComponent(status)}`;
}

export function formatBytes(bytes: number | null) {
  if (bytes === null || bytes < 0) return "Tanpa file";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function formatCategory(category: string) {
  if (category === "intake_workbench") return "Intake Workbench";
  return category.replace(/[_-]+/g, " ");
}

export function getUploaderName(doc: DocRow) {
  return doc.uploadedBy?.nama ?? doc.uploadedBy?.username ?? doc.uploadedBy?.email ?? "—";
}

export function getDraftButtonLabel(doc: DocRow) {
  return readAiMappingDraft(doc.aiMappingResult)
    ? "Lanjut review data"
    : "Mulai review data";
}

export function getDraftSummary(doc: DocRow): DraftSummary | null {
  const draft = readAiMappingDraft(doc.aiMappingResult);
  if (!draft) return null;

  const filledFields = AI_MAPPABLE_DESA_FIELDS.filter(
    (field) => draft.fields[field] !== undefined,
  );

  return {
    draft,
    filledCount: filledFields.length,
  };
}

export function getVersionCandidateSummary(doc: DocRow): VersionCandidateSummary | null {
  const candidate = readVillageVersionCandidate(doc.aiMappingResult);
  if (!candidate) return null;

  return {
    candidate,
    changedCount: candidate.changedFields.length,
  };
}

export function getNextStepCopy(doc: DocRow): NextStepCopy {
  const draft = getDraftSummary(doc);
  const versionCandidate = getVersionCandidateSummary(doc);

  if (doc.status === "WAITING_VERIFIED_APPROVAL") {
    return {
      title: "Verified diutamakan, internal bisa fallback",
      note: "Idealnya admin verified desa mengecek lebih dulu, tetapi review internal tetap bisa dibuka jika perlu percepatan atau jalur cadangan.",
      tone: "warn",
    };
  }

  if (doc.status === "PROCESSING" && draft) {
    return {
      title: "Lanjut cek draft review",
      note:
        draft.filledCount > 0
          ? `Draft review sudah punya ${draft.filledCount} field terisi. Buka review data untuk cek, koreksi, atau publish.`
          : "Draft review sudah dibuat, tetapi field penting masih perlu dilengkapi sebelum publish.",
      tone: "info",
    };
  }

  if (doc.status === "PROCESSING") {
    return {
      title: "Mulai review data",
      note:
        versionCandidate && versionCandidate.changedCount > 0
          ? `Ada ${versionCandidate.changedCount} perubahan yang terdeteksi. Buka review data untuk memastikan semuanya benar.`
          : "Buka review data untuk mulai cek isi dokumen dan putuskan apakah bisa dipublish.",
      tone: "info",
    };
  }

  if (doc.status === "PUBLISHED") {
    return {
      title: "Selesai dipublikasikan",
      note: "Dokumen ini sudah selesai. Buka hanya jika Anda perlu memastikan hasil publish sebelumnya.",
      tone: "ok",
    };
  }

  if (doc.status === "REJECTED") {
    return {
      title: "Ditolak di level verified",
      note: "Dokumen ini dihentikan oleh admin verified desa sebelum masuk review internal. Tunggu unggahan baru dari pengunggah.",
      tone: "danger",
    };
  }

  return {
    title: "Minta pengunggah memperbaiki",
    note: "Dokumen ini sudah ditandai gagal. Langkah berikutnya adalah menunggu unggahan ulang atau perbaikan dari pengunggah.",
    tone: "danger",
  };
}

export function getNextStepClassName(tone: NextStepCopy["tone"]) {
  switch (tone) {
    case "warn":
      return "border-amber-100 bg-amber-50/70 text-amber-900";
    case "ok":
      return "border-emerald-100 bg-emerald-50/70 text-emerald-900";
    case "danger":
      return "border-rose-100 bg-rose-50/70 text-rose-900";
    default:
      return "border-sky-100 bg-sky-50/70 text-sky-900";
  }
}

export function toInputValue(value: string | number | null | undefined) {
  return value === null || value === undefined ? "" : String(value);
}

export function formatReviewValue(value: string | number | null | undefined) {
  return value === null || value === undefined || value === ""
    ? "Belum ada nilai"
    : String(value);
}

export function getFieldReviewContext(
  key: AiMappableDesaField,
  draft: AiMappingDraft | null,
  versionCandidate: ReturnType<typeof readVillageVersionCandidate>,
): FieldReviewContext {
  const publicValue = versionCandidate?.baseSnapshot[key];
  const draftValue = draft?.fields[key];
  const hasDraftValue = draftValue !== undefined;
  const isChangedFromPublic =
    hasDraftValue && toInputValue(draftValue) !== toInputValue(publicValue);

  return {
    publicValue,
    draftValue,
    hasDraftValue,
    isChangedFromPublic,
  };
}
