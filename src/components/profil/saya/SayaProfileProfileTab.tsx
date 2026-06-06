"use client";

import type { BadgeTier } from "@/lib/user-profile";
import type { AuthUser } from "@/lib/auth-context";
import ProfileAdminAccessEntryCard from "@/components/profil/admin-claim/ProfileAdminAccessEntryCard";
import InternalAdminAccessCard from "@/components/profil/InternalAdminAccessCard";
import type { AdminClaimProfileSummaryData } from "@/lib/data/admin-claim-read";
import { AvatarEditor } from "./AvatarEditor";
import { BadgeMeaningCard } from "./BadgeMeaningCard";
import { ChangePinCard } from "./ChangePinCard";
import { TrustCard } from "./TrustCard";

interface SayaProfileProfileTabProps {
  user: AuthUser;
  initialAdminClaimProfile: AdminClaimProfileSummaryData;
  nama: string;
  bio: string;
  avatarUrl?: string;
  saving: boolean;
  trustScore: number;
  badgeTier: BadgeTier;
  onNamaChange: (value: string) => void;
  onBioChange: (value: string) => void;
  onAvatarUploaded: (url: string) => void;
  onAvatarError: (message: string) => void;
  onSave: (event: React.SyntheticEvent) => void;
  onPinSuccess: () => void;
  onPinError: (message: string) => void;
}

export function SayaProfileProfileTab({
  user,
  initialAdminClaimProfile,
  nama,
  bio,
  avatarUrl,
  saving,
  trustScore,
  badgeTier,
  onNamaChange,
  onBioChange,
  onAvatarUploaded,
  onAvatarError,
  onSave,
  onPinSuccess,
  onPinError,
}: SayaProfileProfileTabProps) {
  return (
    <div className="space-y-4">
      <form onSubmit={onSave} className="space-y-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-4">
          <AvatarEditor nama={user.nama} current={avatarUrl} onUploaded={onAvatarUploaded} onError={onAvatarError} />
          <div>
            <p className="text-sm font-semibold text-slate-700">Foto Profil</p>
            <p className="text-xs text-slate-400">Klik ikon kamera untuk ganti</p>
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold text-slate-600">Nama Tampil</label>
          <input
            type="text"
            value={nama}
            onChange={(event) => onNamaChange(event.target.value)}
            maxLength={60}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm transition focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-300"
          />
        </div>

        <div>
          <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-400">
            Username{" "}
            <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-normal text-slate-500">Tidak bisa diubah</span>
          </label>
          <div className="w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-100 px-4 py-2.5 text-sm text-slate-400">
            @{user.username}
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold text-slate-600">Bio</label>
          <textarea
            value={bio}
            onChange={(event) => onBioChange(event.target.value)}
            maxLength={160}
            rows={3}
            placeholder="Ceritakan sedikit tentang dirimu..."
            className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm transition focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-300"
          />
          <p className="mt-1 text-right text-[10px] text-slate-400">{bio.length}/160</p>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-sm font-bold text-white shadow-md shadow-indigo-200 transition-all hover:bg-indigo-700 disabled:opacity-50"
        >
          {saving ? "Menyimpan..." : "Simpan Perubahan"}
        </button>
      </form>

      <ChangePinCard onSuccess={onPinSuccess} onError={onPinError} />
      <InternalAdminAccessCard />
      <ProfileAdminAccessEntryCard user={user} initialProfileData={initialAdminClaimProfile} />

      {user.role === "WARGA" && (
        <>
          <TrustCard score={trustScore} tier={badgeTier} />
          <BadgeMeaningCard score={trustScore} tier={badgeTier} />
        </>
      )}
    </div>
  );
}
