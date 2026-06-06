"use client";

import { useEffect, useRef, useState } from "react";
import { redirect, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ToastContainer, useToast } from "@/components/ui/Toast";
import { useAuth } from "@/lib/auth-context";
import {
  type BadgeTier,
  type TrustStats,
  type UserNotification,
} from "@/lib/user-profile";
import type { CitizenVoice } from "@/lib/citizen-voice";
import { SayaProfileHeaderCard } from "@/components/profil/saya/SayaProfileHeaderCard";
import { SayaProfileNotificationsTab } from "@/components/profil/saya/SayaProfileNotificationsTab";
import { SayaProfileProfileTab } from "@/components/profil/saya/SayaProfileProfileTab";
import { SayaProfileVoicesTab } from "@/components/profil/saya/SayaProfileVoicesTab";
import { updateUserProfile } from "@/components/profil/saya/api";
import type { AdminClaimProfileSummaryData } from "@/lib/data/admin-claim-read";

type Tab = "profil" | "suara" | "notifikasi";

export default function SayaProfilePage({
  initialProfile,
  initialAdminClaimProfile,
  voices,
  trustStats,
  notifications: initialNotifications,
}: {
  initialProfile: {
    nama: string;
    bio: string;
    avatarUrl?: string;
  };
  initialAdminClaimProfile: AdminClaimProfileSummaryData;
  voices: CitizenVoice[];
  trustStats: TrustStats;
  notifications: UserNotification[];
}) {
  const desaMap = Object.fromEntries(voices.map((voice) => [voice.desaId, voice.desaNama ?? "Desa"]));
  const { user, loading } = useAuth();
  const router = useRouter();
  const { toasts, toast, removeToast } = useToast();

  const [tab, setTab] = useState<Tab>("profil");
  const [nama, setNama] = useState(initialProfile.nama);
  const [bio, setBio] = useState(initialProfile.bio);
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(initialProfile.avatarUrl);
  const [saving, setSaving] = useState(false);
  const [notifications, setNotifications] = useState<UserNotification[]>(initialNotifications);
  const dataFetched = useRef(false);

  useEffect(() => {
    if (!user || dataFetched.current) return;

    dataFetched.current = true;
    setNama(initialProfile.nama || user.nama);
    setBio(initialProfile.bio);
    setAvatarUrl(initialProfile.avatarUrl ?? user.avatarUrl);
  }, [initialProfile.avatarUrl, initialProfile.bio, initialProfile.nama, user]);

  if (!loading && !user) {
    redirect("/login");
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-xl px-4 py-10 sm:px-6">
        <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
          <div className="h-4 w-28 animate-pulse rounded-full bg-slate-100" />
          <div className="mt-4 h-24 animate-pulse rounded-3xl bg-slate-100" />
          <div className="mt-5 space-y-3">
            <div className="h-12 animate-pulse rounded-2xl bg-slate-100" />
            <div className="h-12 animate-pulse rounded-2xl bg-slate-100" />
            <div className="h-12 animate-pulse rounded-2xl bg-slate-100" />
          </div>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const unreadCount = notifications.filter((item) => !item.isRead).length;
  const tabs: Array<{ id: Tab; label: string; badge?: number }> = [
    { id: "profil", label: "Profil" },
    { id: "suara", label: "Suara", badge: voices.length > 0 ? voices.length : undefined },
    { id: "notifikasi", label: "Notifikasi", badge: unreadCount > 0 ? unreadCount : undefined },
  ];

  async function handleSaveProfile(event: React.SyntheticEvent) {
    event.preventDefault();
    if (!nama.trim()) {
      toast("Nama tidak boleh kosong.", "error");
      return;
    }

    setSaving(true);
    try {
      await updateUserProfile({ nama: nama.trim(), bio: bio.trim() });
      toast("Profil berhasil disimpan ✓", "success");
      router.refresh();
    } catch {
      toast("Gagal menyimpan. Coba lagi.", "error");
    } finally {
      setSaving(false);
    }
  }

  function markRead(id: string) {
    setNotifications((current) => current.map((item) => (item.id === id ? { ...item, isRead: true } : item)));
  }

  function markAllRead() {
    setNotifications((current) => current.map((item) => ({ ...item, isRead: true })));
  }

  return (
    <div className="mx-auto max-w-xl space-y-5 px-4 py-8 sm:px-6">
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      <div className="flex items-center justify-between">
        <Link href={`/profil/${user.username}`} className="inline-flex items-center gap-2 text-sm text-slate-500 transition-colors hover:text-slate-700">
          <ArrowLeft size={15} /> Lihat profil publik
        </Link>
      </div>

      <SayaProfileHeaderCard
        nama={user.nama}
        username={user.username}
        avatarUrl={avatarUrl}
        badge={trustStats.badge}
        tab={tab}
        tabs={tabs}
        onTabChange={setTab}
      />

      {tab === "profil" && (
        <SayaProfileProfileTab
          user={user}
          initialAdminClaimProfile={initialAdminClaimProfile}
          nama={nama}
          bio={bio}
          avatarUrl={avatarUrl}
          saving={saving}
          trustScore={trustStats.trustScore}
          badgeTier={trustStats.badge.tier as BadgeTier}
          onNamaChange={setNama}
          onBioChange={setBio}
          onAvatarUploaded={setAvatarUrl}
          onAvatarError={(message) => toast(message, "error")}
          onSave={handleSaveProfile}
          onPinSuccess={() => toast("PIN berhasil diperbarui ✓", "success")}
          onPinError={(message) => toast(message, "error")}
        />
      )}

      {tab === "suara" && (
        <SayaProfileVoicesTab voices={voices} desaMap={desaMap} />
      )}

      {tab === "notifikasi" && (
        <SayaProfileNotificationsTab
          notifications={notifications}
          unreadCount={unreadCount}
          onMarkRead={markRead}
          onMarkAllRead={markAllRead}
        />
      )}
    </div>
  );
}
