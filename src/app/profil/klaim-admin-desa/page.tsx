import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { redirect } from "next/navigation";
import AdminClaimWizard from "@/components/profil/admin-claim/AdminClaimWizard";
import { auth } from "@/lib/auth";
import { getAdminClaimPageNotice } from "@/lib/admin-claim/eligibility";
import type { UserRole } from "@/lib/auth-context";
import { BACK_OFFICE_COPY } from "@/lib/back-office-copy";
import { getAdminClaimProfileData } from "@/lib/data/admin-claim-read";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

const COPY = BACK_OFFICE_COPY.user.common;

export default async function KlaimAdminDesaPage({ searchParams }: PageProps) {
  const session = await auth();
  if (!session?.user?.id || !session.user.email) {
    redirect("/login");
  }

  const [params, initialAdminClaimProfile] = await Promise.all([
    searchParams,
    getAdminClaimProfileData(session.user.id),
  ]);
  const notice = getAdminClaimPageNotice(params);
  const user = {
    id: session.user.id,
    nama: session.user.name ?? session.user.username ?? session.user.email,
    username: session.user.username ?? "",
    email: session.user.email,
    role: session.user.role as UserRole,
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <Link
        href="/profil/saya"
        className="mb-4 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-slate-500 transition-colors hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 focus-visible:ring-offset-2"
      >
        <ArrowLeft size={15} />
        {COPY.backToProfile}
      </Link>

      <AdminClaimWizard user={user} initialNotice={notice} initialProfileData={initialAdminClaimProfile} />
    </div>
  );
}
