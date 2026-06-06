"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { Menu, X, LogOut, Bell, ShieldCheck } from "lucide-react";
import { ASSETS } from "@/lib/assets";
import { useAuth, type UserRole } from "@/lib/auth-context";
import { getAvatarBg, getInitial } from "@/lib/citizen-voice";
import { NAVBAR_COPY } from "@/lib/copy";

const navLinks = [
  { href: "/",           label: "Beranda"     },
  { href: "/desa",       label: "Cari Desa"   },
  { href: "/suara-warga", label: "Suara Warga" },
  { href: "/bandingkan", label: "Bandingkan"  },
  { href: "/panduan",    label: "Panduan"     },
];

// ─── Avatar mini ──────────────────────────────────────────────────────────────

function NavAvatar({ nama, avatarUrl }: { nama: string; avatarUrl?: string }) {
  if (avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={avatarUrl} alt={nama} className="w-7 h-7 rounded-full object-cover" />
    );
  }
  return (
    <div className={`w-7 h-7 rounded-full ${getAvatarBg(nama)} flex items-center justify-center text-white text-xs font-black`}>
      {getInitial(nama)}
    </div>
  );
}

// Notification target depends on the user's role.
// Admin Desa users (LIMITED/VERIFIED) see the new tab in /profil/admin-desa.
// We can't tell membership from JWT alone, so /profil is a safe redirect for non-WARGA roles —
// /profil resolves the right destination server-side.
function notifTargetFor(role: UserRole | undefined): string {
  if (role === "WARGA") return "/profil/saya?tab=notifikasi";
  if (role === "INTERNAL_ADMIN") return "/internal-admin";
  // DESA / ADMIN / unknown: route via /profil so server-side resolves the right tab.
  return "/profil";
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const pathname        = usePathname();
  const router          = useRouter();
  const { user, logout, loading } = useAuth();

  // Hide on login screen only — the /desa-admin/* routes are now legacy redirects so we no longer hide for them.
  // We keep /admin and /internal-admin hidden because they have their own internal layout/header.
  const isHidden =
    pathname === "/login" ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/internal-admin");
  if (isHidden) return null;

  const handleLogout = () => { logout(); router.push("/"); };

  // No persistent notification table yet — the bell links to the activity feed
  // on /profil/saya (derived from the user's real voices); no unread badge.
  const unread = 0;
  const displayName = user?.nama?.split(" ")[0] ?? user?.username ?? "Akun";

  // Right-side content per role
  const renderRight = () => {
    if (!user) {
      return (
        <>
          {!loading && (
            <span className="hidden sm:inline text-xs text-slate-400 mr-1">
              {NAVBAR_COPY.publicDataNote} &middot;
            </span>
          )}
          <Link
            href="/login"
            prefetch={false}
            className="t-spring inline-flex items-center gap-1.5 text-xs font-semibold text-white px-5 py-2.5 rounded-2xl shadow-lux-2 hover:shadow-lux-hover hover:-translate-y-0.5 min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
            style={{ background: "#1E1B4B" }}
          >
            Masuk
          </Link>
        </>
      );
    }

    return (
      <div className="flex items-center gap-1.5">
        {/* Internal admin shortcut — visible only when role flagged in DB */}
        {user.role === "INTERNAL_ADMIN" && (
          <Link
            href="/internal-admin"
            prefetch={false}
            aria-label="Buka panel internal admin"
            className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 px-3 py-2 rounded-xl transition-colors min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2"
          >
            <ShieldCheck size={13} aria-hidden /> Internal
          </Link>
        )}
        {/* Notif bell */}
        <Link
          href={notifTargetFor(user.role)}
          prefetch={false}
          aria-label={unread > 0 ? `Notifikasi, ${unread} belum dibaca` : "Notifikasi"}
          className="relative p-2 rounded-xl hover:bg-slate-100 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
        >
          <Bell size={16} className="text-slate-500" aria-hidden />
          {unread > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-indigo-600 rounded-full text-white text-[8px] font-black flex items-center justify-center">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </Link>
        {/* Account — name + avatar, always points to /profil */}
        <Link data-testid="navbar-account-link" href="/profil" prefetch={false} className="flex items-center gap-2 hover:bg-slate-50 px-2 py-1.5 rounded-xl transition-colors min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2">
          <NavAvatar nama={user.nama} avatarUrl={user.avatarUrl} />
          <span className="text-xs font-semibold text-slate-700 max-w-[80px] truncate hidden sm:block">
            {displayName}
          </span>
        </Link>
        <button
          onClick={handleLogout}
          aria-label="Keluar dari akun"
          className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-rose-600 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2"
        >
          <LogOut size={14} aria-hidden />
        </button>
      </div>
    );
  };

  return (
    <nav className="sticky top-0 z-50 glass" style={{ borderRadius: 0 }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4 h-16">

          {/* Brand */}
          <Link href="/" prefetch={false} className="flex items-center gap-2.5 flex-shrink-0">
            <div className="w-8 h-8 rounded-xl overflow-hidden shadow-[0_10px_22px_-14px_rgba(30,27,75,0.55)]">
              <Image src={ASSETS.logo} alt="PantauDesa" width={28} height={28} className="w-full h-full object-cover" priority />
            </div>
            <span className="font-bold text-lg text-slate-800 tracking-tight">Pantau<span className="text-indigo-600">Desa</span></span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                prefetch={false}
                className={`px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 ${
                  pathname === link.href
                    ? "bg-white text-[#1E1B4B] shadow-[inset_0_0_0_1px_rgba(79,70,229,0.12),0_14px_24px_-22px_rgba(30,27,75,0.55)]"
                    : "text-slate-600 hover:text-indigo-600 hover:bg-white/80"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right */}
          <div className="hidden md:flex items-center">{renderRight()}</div>

          {/* Mobile toggle */}
          <button
            onClick={() => setOpen(!open)}
            aria-label={open ? "Tutup menu navigasi" : "Buka menu navigasi"}
            aria-expanded={open}
            className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
          >
            {open ? <X size={20} aria-hidden /> : <Menu size={20} aria-hidden />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-slate-100/80 bg-white/90 backdrop-blur-sm px-4 pb-4 pt-3">
          {navLinks.map(link => (
            <Link
              key={link.href}
              href={link.href}
              prefetch={false}
              onClick={() => setOpen(false)}
              className={`block px-3.5 py-3 rounded-xl text-sm font-semibold transition-colors ${
                pathname === link.href ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              {link.label}
            </Link>
          ))}
          <div className="mt-2 pt-2 border-t border-slate-100">
            {!user && (
              <Link href="/login" prefetch={false} onClick={() => setOpen(false)} className="block px-3 py-2.5 text-sm font-semibold text-indigo-600">
                Masuk
              </Link>
            )}
            {user && (
              <>
                <Link href="/profil" prefetch={false} onClick={() => setOpen(false)} className="flex items-center gap-2 px-3 py-2.5 text-sm font-semibold text-slate-700">
                  <NavAvatar nama={user.nama} avatarUrl={user.avatarUrl} />
                  {displayName}
                  {unread > 0 && <span className="ml-auto bg-indigo-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">{unread}</span>}
                </Link>
                <Link href={notifTargetFor(user.role)} prefetch={false} onClick={() => setOpen(false)} className="flex items-center gap-2 px-3 py-2.5 text-sm text-slate-700">
                  <Bell size={14} /> Notifikasi
                </Link>
                {user.role === "INTERNAL_ADMIN" && (
                  <Link href="/internal-admin" prefetch={false} onClick={() => setOpen(false)} className="flex items-center gap-2 px-3 py-2.5 text-sm font-semibold text-amber-700">
                    <ShieldCheck size={14} /> Panel Internal Admin
                  </Link>
                )}
                <button onClick={handleLogout} className="flex items-center gap-2 px-3 py-2.5 text-sm text-rose-600 w-full">
                  <LogOut size={14} /> Keluar
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
