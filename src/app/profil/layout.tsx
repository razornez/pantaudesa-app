import { AdminClaimProfileProvider } from "@/components/profil/admin-claim/AdminClaimProfileProvider";

export default function ProfilLayout({ children }: { children: React.ReactNode }) {
  return <AdminClaimProfileProvider>{children}</AdminClaimProfileProvider>;
}
