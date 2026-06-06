import { DataStatusBadge, type DataStatusKind } from "@/components/ui/DataStatusBadge";

const statusCards: DataStatusKind[] = ["demo", "source-found", "needs-review", "verified"];

export default function DataStatusCardsSection() {
  return (
    <section>
      <div className="mb-4 max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-wide text-amber-600">Status data</p>
        <h2 className="mt-1 text-lg font-semibold text-slate-800">
          Jangan langsung percaya angka tanpa melihat statusnya
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Setiap informasi perlu dibaca bersama sumber, status, dan tahap reviewnya.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {statusCards.map((status) => (
          <DataStatusBadge
            key={status}
            status={status}
            showMicrocopy
            className="w-full"
          />
        ))}
      </div>
    </section>
  );
}
