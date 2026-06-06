import Anthropic from "@anthropic-ai/sdk";
import {
  sanitizeMappingFields,
  type AiMappingFields,
} from "@/lib/admin-claim/ai-mapping";
import { buildDetailFieldRegistryPrompt } from "@/lib/intake/detail-field-coverage";
import type {
  DetectedDetailField,
  IntakeConfidence,
  IntakeDocumentType,
  OpenAIProof,
  OpenAIResult,
  OpenAIStatus,
  UnknownUsefulField,
} from "@/lib/intake/types";

const MAX_TEXT_INPUT = 20_000;
const TEXT_IMAGE_MODEL = "gpt-4o-mini";
const FILE_INPUT_MODEL = "gpt-4o-mini";
const OPENAI_USAGE_URL = "https://platform.openai.com/usage";
const OPENAI_LIMITS_URL = "https://platform.openai.com/settings/organization/limits";
const OPENAI_ERROR_DOCS_URL = "https://platform.openai.com/docs/guides/error-codes";

const JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    documentType: {
      type: "string",
      enum: [
        "profil_desa",
        "anggaran",
        "perangkat_desa",
        "fasilitas",
        "potensi",
        "kontak",
        "dokumen_publik",
        "unknown",
      ],
    },
    confidence: {
      type: "string",
      enum: ["low", "medium", "high"],
    },
    knownPublishableFields: {
      type: "object",
      additionalProperties: false,
      properties: {
        websiteUrl: { type: ["string", "null"] },
        kategori: { type: ["string", "null"] },
        tahunData: { type: ["number", "null"] },
        jumlahPenduduk: { type: ["number", "null"] },
        kecamatan: { type: ["string", "null"] },
        kabupaten: { type: ["string", "null"] },
        provinsi: { type: ["string", "null"] },
      },
      required: [],
    },
    knownFieldEvidence: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          field: {
            type: "string",
            enum: [
              "websiteUrl",
              "kategori",
              "tahunData",
              "jumlahPenduduk",
              "kecamatan",
              "kabupaten",
              "provinsi",
            ],
          },
          evidenceSnippet: { type: "string" },
          sourceReference: { type: "string" },
        },
        required: ["field"],
      },
    },
    detectedButNotPublishable: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          sectionKey: { type: "string" },
          sectionLabel: { type: "string" },
          fieldKey: { type: "string" },
          fieldLabel: { type: "string" },
          value: { type: "string" },
          reason: { type: "string" },
          sourceRequirement: { type: "string" },
          validationRequirement: { type: "string" },
          evidenceSnippet: { type: "string" },
          sourceReference: { type: "string" },
        },
        required: [
          "sectionKey",
          "sectionLabel",
          "fieldKey",
          "fieldLabel",
          "value",
          "reason",
          "sourceRequirement",
          "validationRequirement",
        ],
      },
    },
    unknownUsefulFields: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          label: { type: "string" },
          value: { type: "string" },
          possibleCategory: { type: "string" },
          evidenceSnippet: { type: "string" },
        },
        required: ["label", "value", "possibleCategory"],
      },
    },
    warnings: {
      type: "array",
      items: { type: "string" },
    },
  },
  required: [
    "documentType",
    "confidence",
    "knownPublishableFields",
    "knownFieldEvidence",
    "detectedButNotPublishable",
    "unknownUsefulFields",
    "warnings",
  ],
} as const;

function emptyResult(input: {
  attempted: boolean;
  status: OpenAIStatus;
  usedInputMode: "text" | "image" | "file";
  reason: string;
  message: string;
  model?: string | null;
  confidence?: IntakeConfidence;
  proof?: OpenAIProof;
}): OpenAIResult {
  return {
    attempted: input.attempted,
    status: input.status,
    usedInputMode: input.usedInputMode,
    reason: input.reason,
    message: input.message,
    model: input.model ?? null,
    documentType: "unknown",
    confidence: input.confidence ?? "low",
    knownPublishableFields: {},
    knownFieldEvidence: [],
    detectedButNotPublishable: [],
    unknownUsefulFields: [],
    warnings: [],
    ...(input.proof ? { proof: input.proof } : {}),
  };
}

function trimSnippet(value: unknown, max = 120): string | undefined {
  if (typeof value !== "string") return undefined;
  const clean = value.replace(/\s+/g, " ").trim();
  if (!clean) return undefined;
  return clean.length <= max ? clean : `${clean.slice(0, max - 1)}...`;
}

function normalizeDocumentType(value: unknown): IntakeDocumentType {
  switch (value) {
    case "profil_desa":
    case "anggaran":
    case "perangkat_desa":
    case "fasilitas":
    case "potensi":
    case "kontak":
    case "dokumen_publik":
      return value;
    default:
      return "unknown";
  }
}

function normalizeConfidence(value: unknown): IntakeConfidence {
  if (value === "medium" || value === "high") return value;
  return "low";
}

function normalizeDetectedField(value: unknown): DetectedDetailField | null {
  if (typeof value !== "object" || value === null) return null;
  const item = value as Record<string, unknown>;
  const requiredStrings = [
    "sectionKey",
    "sectionLabel",
    "fieldKey",
    "fieldLabel",
    "value",
    "reason",
    "sourceRequirement",
    "validationRequirement",
  ] as const;

  for (const key of requiredStrings) {
    if (typeof item[key] !== "string" || !item[key]) {
      return null;
    }
  }

  return {
    sectionKey: String(item.sectionKey).slice(0, 80),
    sectionLabel: String(item.sectionLabel).slice(0, 80),
    fieldKey: String(item.fieldKey).slice(0, 80),
    fieldLabel: String(item.fieldLabel).slice(0, 120),
    value: String(item.value).slice(0, 300),
    reason: String(item.reason).slice(0, 240),
    sourceRequirement: String(item.sourceRequirement).slice(0, 180),
    validationRequirement: String(item.validationRequirement).slice(0, 180),
    ...(trimSnippet(item.evidenceSnippet) ? { evidenceSnippet: trimSnippet(item.evidenceSnippet) } : {}),
    ...(trimSnippet(item.sourceReference, 80) ? { sourceReference: trimSnippet(item.sourceReference, 80) } : {}),
  };
}

function normalizeUnknownField(value: unknown): UnknownUsefulField | null {
  if (typeof value !== "object" || value === null) return null;
  const item = value as Record<string, unknown>;

  if (
    typeof item.label !== "string" ||
    typeof item.value !== "string" ||
    typeof item.possibleCategory !== "string"
  ) {
    return null;
  }

  return {
    label: item.label.slice(0, 120),
    value: item.value.slice(0, 300),
    possibleCategory: item.possibleCategory.slice(0, 80),
    ...(trimSnippet(item.evidenceSnippet) ? { evidenceSnippet: trimSnippet(item.evidenceSnippet) } : {}),
  };
}

function extractStructuredText(payload: unknown): string | null {
  if (typeof payload !== "object" || payload === null) return null;
  const root = payload as Record<string, unknown>;

  if (typeof root.output_text === "string" && root.output_text.trim()) {
    return root.output_text.trim();
  }

  if (!Array.isArray(root.output)) return null;

  for (const item of root.output) {
    if (typeof item !== "object" || item === null) continue;
    const content = (item as { content?: unknown }).content;
    if (!Array.isArray(content)) continue;

    for (const part of content) {
      if (typeof part !== "object" || part === null) continue;
      const text = (part as { text?: unknown }).text;
      if (typeof text === "string" && text.trim()) {
        return text.trim();
      }
    }
  }

  return null;
}

function getResponseErrorMessage(payload: unknown): string | null {
  if (typeof payload !== "object" || payload === null) return null;
  const error = (payload as { error?: unknown }).error;
  if (typeof error !== "object" || error === null) return null;
  const message = (error as { message?: unknown }).message;
  return typeof message === "string" ? message : null;
}

function getResponseErrorCode(payload: unknown): string | null {
  if (typeof payload !== "object" || payload === null) return null;
  const error = (payload as { error?: unknown }).error;
  if (typeof error !== "object" || error === null) return null;
  const code = (error as { code?: unknown }).code;
  if (typeof code === "string" && code.trim()) return code.trim();
  const type = (error as { type?: unknown }).type;
  return typeof type === "string" && type.trim() ? type.trim() : null;
}

function getResponseErrorType(payload: unknown): string | null {
  if (typeof payload !== "object" || payload === null) return null;
  const error = (payload as { error?: unknown }).error;
  if (typeof error !== "object" || error === null) return null;
  const type = (error as { type?: unknown }).type;
  return typeof type === "string" && type.trim() ? type.trim() : null;
}

function buildProof(input: {
  httpStatus?: number;
  errorCode?: string | null;
  errorType?: string | null;
  requestId?: string | null;
}): OpenAIProof {
  return {
    ...(input.httpStatus ? { httpStatus: input.httpStatus } : {}),
    ...(input.errorCode ? { errorCode: input.errorCode } : {}),
    ...(input.errorType ? { errorType: input.errorType } : {}),
    ...(input.requestId ? { requestId: input.requestId } : {}),
    usageUrl: OPENAI_USAGE_URL,
    limitsUrl: OPENAI_LIMITS_URL,
    docsUrl: OPENAI_ERROR_DOCS_URL,
  };
}

function normalizeStructuredResult(
  parsed: unknown,
  model: string,
  usedInputMode: "text" | "image" | "file",
): OpenAIResult {
  const raw = typeof parsed === "object" && parsed !== null ? (parsed as Record<string, unknown>) : {};
  const knownPublishableFields = sanitizeMappingFields(raw.knownPublishableFields);
  const knownFieldEvidence = Array.isArray(raw.knownFieldEvidence)
    ? raw.knownFieldEvidence
        .map((item) => {
          if (typeof item !== "object" || item === null) return null;
          const record = item as Record<string, unknown>;
          const field = record.field;
          if (
            field !== "websiteUrl" &&
            field !== "kategori" &&
            field !== "tahunData" &&
            field !== "jumlahPenduduk" &&
            field !== "kecamatan" &&
            field !== "kabupaten" &&
            field !== "provinsi"
          ) {
            return null;
          }

          return {
            field: field as
              | "websiteUrl"
              | "kategori"
              | "tahunData"
              | "jumlahPenduduk"
              | "kecamatan"
              | "kabupaten"
              | "provinsi",
            ...(trimSnippet(record.evidenceSnippet) ? { evidenceSnippet: trimSnippet(record.evidenceSnippet) } : {}),
            ...(trimSnippet(record.sourceReference, 80) ? { sourceReference: trimSnippet(record.sourceReference, 80) } : {}),
          };
        })
        .filter((item): item is NonNullable<typeof item> => Boolean(item))
    : [];

  const detectedButNotPublishable = Array.isArray(raw.detectedButNotPublishable)
    ? raw.detectedButNotPublishable
        .map(normalizeDetectedField)
        .filter((item): item is DetectedDetailField => Boolean(item))
    : [];

  const unknownUsefulFields = Array.isArray(raw.unknownUsefulFields)
    ? raw.unknownUsefulFields
        .map(normalizeUnknownField)
        .filter((item): item is UnknownUsefulField => Boolean(item))
    : [];

  const warnings = Array.isArray(raw.warnings)
    ? raw.warnings
        .filter((item): item is string => typeof item === "string" && item.trim().length > 0)
        .map((item) => item.trim().slice(0, 240))
    : [];

  return {
    attempted: true,
    status: "success",
    usedInputMode,
    reason: "OpenAI membantu membaca isi dokumen.",
    message: "AI mapping berhasil dijalankan sebagai draft review.",
    model,
    documentType: normalizeDocumentType(raw.documentType),
    confidence: normalizeConfidence(raw.confidence),
    knownPublishableFields,
    knownFieldEvidence,
    detectedButNotPublishable,
    unknownUsefulFields,
    warnings,
  };
}

function shouldUseImageInput(mimeType?: string, fileName?: string): boolean {
  const lowerMime = (mimeType ?? "").toLowerCase();
  const lowerName = (fileName ?? "").toLowerCase();
  return lowerMime.startsWith("image/") || /\.(png|jpg|jpeg|webp|gif|bmp|tiff)$/.test(lowerName);
}

function shouldUseFileInput(mimeType?: string, fileName?: string): boolean {
  const lowerMime = (mimeType ?? "").toLowerCase();
  const lowerName = (fileName ?? "").toLowerCase();

  return (
    lowerMime === "application/pdf" ||
    lowerMime.includes("officedocument.wordprocessingml") ||
    lowerMime.includes("officedocument.spreadsheetml") ||
    lowerMime === "application/vnd.ms-excel" ||
    lowerMime === "text/plain" ||
    lowerMime === "text/csv" ||
    /\.(pdf|docx|xlsx|csv|txt)$/i.test(lowerName)
  );
}

function dataUriForFile(input: { buffer: Buffer; mimeType: string }): string {
  return `data:${input.mimeType};base64,${input.buffer.toString("base64")}`;
}


export function mergeKnownFields(
  localFields: AiMappingFields,
  openaiFields: AiMappingFields,
): AiMappingFields {
  return {
    ...localFields,
    ...openaiFields,
  };
}

const CLAUDE_FALLBACK_MODEL = "claude-haiku-4-5-20251001";

async function maybeFallbackToClaude(input: {
  extractedText: string;
  mimeType?: string;
  fileBuffer?: Buffer;
  usedInputMode: "text" | "image" | "file";
  attemptedBecause: string[];
}): Promise<OpenAIResult | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
  if (!apiKey) return null;

  try {
    const anthropic = new Anthropic({ apiKey });

    const promptText = [
      "Anda membantu internal admin PantauDesa membuat draft mapping desa.",
      "Jangan mengarang. Kembalikan HANYA JSON yang valid sesuai skema berikut, tanpa prose atau markdown.",
      "Skema wajib: { documentType, confidence, knownPublishableFields, knownFieldEvidence, detectedButNotPublishable, unknownUsefulFields, warnings }",
      "knownPublishableFields boleh berisi: websiteUrl, kategori, tahunData, jumlahPenduduk, kecamatan, kabupaten, provinsi.",
      buildDetailFieldRegistryPrompt(),
      "",
      "Teks dokumen:",
      input.extractedText.slice(0, MAX_TEXT_INPUT),
    ].join("\n");

    type AnthropicImageMime = "image/jpeg" | "image/png" | "image/gif" | "image/webp";
    const VALID_IMAGE_MIMES: AnthropicImageMime[] = ["image/jpeg", "image/png", "image/gif", "image/webp"];

    const contentBlocks: Array<
      | { type: "text"; text: string }
      | { type: "image"; source: { type: "base64"; media_type: AnthropicImageMime; data: string } }
    > = [{ type: "text", text: promptText }];

    if (input.usedInputMode === "image" && input.fileBuffer && input.mimeType) {
      const mime = VALID_IMAGE_MIMES.find(m => m === input.mimeType);
      if (mime) {
        contentBlocks.push({
          type: "image",
          source: { type: "base64", media_type: mime, data: input.fileBuffer.toString("base64") },
        });
      }
    }

    const message = await anthropic.messages.create({
      model: CLAUDE_FALLBACK_MODEL,
      max_tokens: 4096,
      messages: [{ role: "user", content: contentBlocks }],
    });

    const rawText = message.content.find(c => c.type === "text")?.text ?? "";
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    const parsed = JSON.parse(jsonMatch[0]) as unknown;
    return normalizeStructuredResult(parsed, `${CLAUDE_FALLBACK_MODEL} (fallback)`, input.usedInputMode);
  } catch (err) {
    console.error("[claude-fallback] failed:", err);
    return null;
  }
}

export async function maybeMapWithOpenAI(input: {
  extractedText: string;
  fileName?: string;
  mimeType?: string;
  fileBuffer?: Buffer;
  explicitRequest?: boolean;
  heuristicConfidenceLow?: boolean;
  localExtractFailed?: boolean;
}): Promise<OpenAIResult> {
  const hasImageInput = shouldUseImageInput(input.mimeType, input.fileName) && Boolean(input.fileBuffer);
  const hasFileInput = !hasImageInput && shouldUseFileInput(input.mimeType, input.fileName) && Boolean(input.fileBuffer);
  const weakText = input.extractedText.trim().length > 0 && input.extractedText.trim().length < 250;
  const attemptedBecause = [
    input.explicitRequest ? "user_explicit_request" : null,
    hasImageInput ? "image_or_photo" : null,
    input.localExtractFailed ? "local_extract_failed" : null,
    input.heuristicConfidenceLow ? "heuristic_confidence_low" : null,
    weakText ? "local_text_weak" : null,
  ].filter((item): item is string => Boolean(item));

  const shouldAttempt = attemptedBecause.length > 0 && (hasImageInput || hasFileInput || input.extractedText.trim().length > 0);
  const usedInputMode: "text" | "image" | "file" = hasImageInput ? "image" : hasFileInput ? "file" : "text";

  if (!shouldAttempt) {
    return emptyResult({
      attempted: false,
      status: "skipped",
      usedInputMode,
      reason: "Parser lokal sudah cukup untuk preview awal.",
      message: "AI mapping dilewati karena parser lokal dianggap cukup.",
    });
  }

  // Defense in depth: jangan pernah panggil OpenAI untuk input biner (image/file)
  // ketika user tidak secara eksplisit mengaktifkan toggle "Coba AI". Ini mencegah
  // pesan kuota OpenAI muncul ketika user memilih untuk tidak memakai AI sama sekali.
  if (!input.explicitRequest && (hasImageInput || hasFileInput)) {
    return emptyResult({
      attempted: false,
      status: "skipped",
      usedInputMode,
      reason: "User tidak mengaktifkan Coba AI untuk dokumen non-teks.",
      message:
        "Gambar belum bisa dibaca tanpa AI. Aktifkan Coba AI, atau gunakan dokumen teks/PDF teks/DOCX/XLSX/CSV/TXT.",
    });
  }

  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    return emptyResult({
      attempted: true,
      status: "missing_key",
      usedInputMode,
      reason: "OPENAI_API_KEY tidak tersedia di environment ini.",
      message: "AI mapping belum bisa dipakai di environment ini. Parser lokal/manual paste tetap bisa digunakan.",
    });
  }

  const model = hasFileInput ? FILE_INPUT_MODEL : TEXT_IMAGE_MODEL;
  const content: Array<Record<string, unknown>> = [
    {
      type: "input_text",
      text: [
        "Anda membantu internal admin PantauDesa membuat draft mapping desa.",
        "Jangan mengarang, jangan mengisi field jika tidak cukup yakin, dan jangan keluarkan prose di luar JSON schema.",
        "Pisahkan temuan menjadi knownPublishableFields, detectedButNotPublishable, dan unknownUsefulFields.",
        "Field registry saat ini:",
        buildDetailFieldRegistryPrompt(),
      ].join("\n\n"),
    },
  ];

  if (input.extractedText.trim()) {
    content.push({
      type: "input_text",
      text: `Teks hasil pembacaan lokal (potong, draft-only):\n${input.extractedText.slice(0, MAX_TEXT_INPUT)}`,
    });
  }

  // Images are sent as base64 data URI — OpenAI Responses API supports input_image.
  // Files (PDF/DOCX/XLSX etc.) are NOT sent as input_file — gpt-4o-mini rejects raw
  // base64 file_data with 400 invalid_value. The extracted text above is sufficient.
  if (hasImageInput && input.fileBuffer && input.mimeType) {
    content.push({
      type: "input_image",
      detail: "high",
      image_url: dataUriForFile({ buffer: input.fileBuffer, mimeType: input.mimeType }),
    });
  }

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      input: [
        {
          role: "user",
          content,
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "pantau_desa_intake_mapping",
          strict: false,
          schema: JSON_SCHEMA,
        },
      },
    }),
  });

  const payload = (await response.json().catch(() => null)) as unknown;

  if (!response.ok) {
    const message = getResponseErrorMessage(payload) ?? "OpenAI mapping gagal dijalankan.";
    const errorCode = getResponseErrorCode(payload)?.toLowerCase() ?? null;
    const errorType = getResponseErrorType(payload);
    const requestId =
      response.headers.get("x-request-id") ??
      response.headers.get("request-id") ??
      response.headers.get("openai-request-id");
    const lowerMessage = message.toLowerCase();
    const status: OpenAIStatus =
      response.status === 429 &&
      (lowerMessage.includes("quota") || errorCode === "insufficient_quota")
        ? "quota_limited"
        : response.status === 429
        ? "rate_limited"
        : "error";

    // Plan B — try Claude before giving up (different provider, works even if OpenAI quota is exhausted)
    const claudeResult = await maybeFallbackToClaude({ extractedText: input.extractedText, mimeType: input.mimeType, fileBuffer: input.fileBuffer, usedInputMode, attemptedBecause });
    if (claudeResult) return claudeResult;

    return emptyResult({
      attempted: true,
      status,
      usedInputMode,
      reason: attemptedBecause.join(", "),
      message:
        status === "quota_limited"
          ? "Kuota OpenAI sedang habis. Parser lokal/manual paste tetap bisa dipakai."
          : status === "rate_limited"
          ? "OpenAI sedang rate limited. Coba lagi beberapa saat atau lanjutkan dengan parser lokal."
          : "OpenAI belum bisa membantu membaca dokumen ini. Parser lokal/manual paste tetap tersedia.",
      model,
      proof: buildProof({
        httpStatus: response.status,
        errorCode,
        errorType,
        requestId,
      }),
    });
  }

  const structuredText = extractStructuredText(payload);
  if (!structuredText) {
    // Plan B — OpenAI responded but gave no parseable JSON
    const claudeResult = await maybeFallbackToClaude({ extractedText: input.extractedText, mimeType: input.mimeType, fileBuffer: input.fileBuffer, usedInputMode, attemptedBecause });
    if (claudeResult) return claudeResult;

    return emptyResult({
      attempted: true,
      status: "invalid_json",
      usedInputMode,
      reason: attemptedBecause.join(", "),
      message: "OpenAI merespons tanpa JSON terstruktur yang bisa dipakai. Parser lokal tetap digunakan.",
      model,
    });
  }

  try {
    const parsed = JSON.parse(structuredText) as unknown;
    const normalized = normalizeStructuredResult(parsed, model, usedInputMode);
    if (
      Object.keys(normalized.knownPublishableFields).length === 0 &&
      normalized.detectedButNotPublishable.length === 0 &&
      normalized.unknownUsefulFields.length === 0
    ) {
      return {
        ...normalized,
        message: "AI mapping berjalan, tetapi belum menemukan field yang cukup yakin untuk dipakai.",
        warnings: [...normalized.warnings, "AI belum menemukan field yang cukup yakin."],
      };
    }

    return normalized;
  } catch {
    return emptyResult({
      attempted: true,
      status: "invalid_json",
      usedInputMode,
      reason: attemptedBecause.join(", "),
      message: "OpenAI mengembalikan format yang tidak bisa dipakai. Parser lokal tetap digunakan.",
      model,
    });
  }
}
