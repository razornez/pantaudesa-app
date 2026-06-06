import InternalDocumentReviewQueue from "@/components/internal-admin/InternalDocumentReviewQueue";
import {
  loadInternalDocumentQueue,
} from "@/lib/internal-admin/documents-page";
import {
  parseDocumentStatusFilter,
  parseFocusDocumentId,
} from "@/lib/internal-admin/page-params";
import { perfLog, perfStart } from "@/lib/perf";

export const dynamic = "force-dynamic";

export default async function InternalDocumentsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; focus?: string }>;
}) {
  const params = await searchParams;
  const filter = parseDocumentStatusFilter(params.status);
  const focusDocumentId = parseFocusDocumentId(params.focus);
  const tQuery = perfStart();
  const result = await loadInternalDocumentQueue(filter);
  perfLog("internal-admin.documents", "loadInternalDocumentQueue", tQuery);

  if (result.kind === "unavailable") {
    return (
      <div className="notice-card notice-danger text-sm leading-relaxed">
        {result.message}
      </div>
    );
  }

  return (
    <InternalDocumentReviewQueue
      documents={result.documents}
      statusFilter={filter ?? ""}
      focusDocumentId={focusDocumentId}
    />
  );
}
