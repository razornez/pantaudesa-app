import { notFound } from "next/navigation";
import { IntakeReviewPage } from "@/components/internal-admin/intake/IntakeReviewPage";
import { loadIntakeReviewPageData } from "@/lib/internal-admin/intake-review-page";

export const dynamic = "force-dynamic";

export default async function IntakeDocumentReviewPage({
  params,
}: {
  params: Promise<{ documentId: string }>;
}) {
  const { documentId } = await params;
  const result = await loadIntakeReviewPageData(documentId);

  if (result.kind === "not_found") {
    notFound();
  }

  if (result.kind === "unavailable") {
    return <div className="notice-card notice-danger text-sm">{result.message}</div>;
  }

  return <IntakeReviewPage data={result.data} />;
}
