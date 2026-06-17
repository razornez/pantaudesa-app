import type { MetadataRoute } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "https://pantaudesa.vercel.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/desa-admin/",
        "/profil/saya",
        "/login",
        "/daftar",
        "/lupa-pin",
        "/api/",
        "/internal-admin/",
      ],
    },
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
