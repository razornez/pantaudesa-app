import type { Metadata, Viewport } from "next";
import { SessionProvider } from "next-auth/react";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { AuthProvider } from "@/lib/auth-context";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "https://pantaudesa.vercel.app";

export const metadata: Metadata = {
  title: {
    default: "PantauDesa — Transparansi Anggaran Dana Desa",
    template: "%s — PantauDesa",
  },
  description:
    "Platform publik untuk memantau penyerapan anggaran dan realisasi dana desa di seluruh Indonesia. Pantau, bandingkan, dan bersuara untuk desamu.",
  keywords: [
    "dana desa", "APBDes", "transparansi desa", "anggaran desa",
    "pantau desa", "realisasi dana desa", "SIPD", "suara warga",
  ],
  authors:  [{ name: "PantauDesa" }],
  creator:  "PantauDesa",
  metadataBase: new URL(BASE_URL),
  openGraph: {
    type:        "website",
    locale:      "id_ID",
    url:         BASE_URL,
    siteName:    "PantauDesa",
    title:       "PantauDesa — Transparansi Anggaran Dana Desa",
    description: "Pantau penggunaan dana desa, bandingkan kinerja antar desa, dan bersuara langsung sebagai warga.",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "PantauDesa" }],
  },
  twitter: {
    card:        "summary_large_image",
    title:       "PantauDesa — Transparansi Anggaran Dana Desa",
    description: "Pantau penggunaan dana desa, bandingkan kinerja antar desa, dan bersuara langsung sebagai warga.",
    images:      ["/opengraph-image"],
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body className="bg-slate-50 text-slate-900 antialiased">
        <SessionProvider>
          <AuthProvider>
            <Navbar />
            <main className="min-h-screen">{children}</main>
            <Footer />
          </AuthProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
