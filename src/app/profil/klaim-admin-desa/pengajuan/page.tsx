import Link from "next/link";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import ClaimSupportForm from "@/components/admin-claim/ClaimSupportForm";

export const dynamic = "force-dynamic";

export default async function PengajuanAdminDesaPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login?next=/profil/klaim-admin-desa/pengajuan");
  }

  let activeClaim = null;
  if (db) {
    activeClaim = await db.desaAdminClaim.findFirst({
      where: {
        userId: session.user.id,
        status: { in: ["PENDING", "IN_REVIEW", "REJECTED"] },
      },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        status: true,
        method: true,
        supportSubmittedAt: true,
        desa: { select: { id: true, nama: true, kecamatan: true, kabupaten: true } },
      },
    });
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-xl mx-auto px-4 py-10 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Pengajuan Admin Desa
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Formulir khusus untuk pengajuan Admin Desa jika kamu tidak bisa menyelesaikan
            verifikasi melalui website token atau kode OTP email.
          </p>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800">
          <p className="font-medium">Penting: Formulir ini tidak langsung memberikan akses admin.</p>
          <p className="mt-1 text-amber-700">
            Setelah pengajuan, klaim kamu akan masuk ke tahap review internal. Admin PantauDesa
            akan memeriksa bukti dan memberikan keputusan. Estimasi review 2–5 hari kerja karena
            bukti perlu diperiksa manual.
          </p>
        </div>

        {!activeClaim ? (
          <div className="bg-white border border-slate-200 rounded-xl px-5 py-6 text-center text-sm text-slate-500">
            <p>Kamu belum memiliki klaim Admin Desa aktif.</p>
            <Link
              href="/profil/klaim-admin-desa"
              className="mt-3 inline-block text-indigo-600 font-medium hover:underline"
            >
              Mulai pengajuan klaim Admin Desa →
            </Link>
          </div>
        ) : (
          <ClaimSupportForm
            claimId={activeClaim.id}
            desaId={activeClaim.desa.id}
            desaName={activeClaim.desa.nama}
            desaLocation={`${activeClaim.desa.kecamatan}, ${activeClaim.desa.kabupaten}`}
            claimStatus={activeClaim.status}
            alreadySubmitted={Boolean(activeClaim.supportSubmittedAt)}
            alreadySubmittedAt={activeClaim.supportSubmittedAt?.toISOString() ?? null}
          />
        )}

        <p className="text-xs text-slate-400 text-center">
          Formulir ini berbeda dari{" "}
          <Link href="/hubungi-admin" className="underline">
            Hubungi Admin umum
          </Link>
          . Dikhususkan untuk pengajuan klaim Admin Desa dengan konteks desa dan klaim
          yang sudah tercatat.
        </p>
      </div>
    </div>
  );
}
