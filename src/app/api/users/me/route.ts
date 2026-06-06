import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { handleApiError } from "@/lib/api-error";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where:  { id: session.user.id },
      select: { id: true, email: true, username: true, nama: true, bio: true, avatarUrl: true, role: true, createdAt: true },
    });

    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
    return NextResponse.json(user);
  } catch (error) {
    return handleApiError(error, "GET /api/users/me");
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { nama, bio } = body;

    const data: { nama?: string; bio?: string } = {};

    if (nama !== undefined) {
      if (typeof nama !== "string" || nama.trim().length === 0 || nama.trim().length > 100) {
        return NextResponse.json({ error: "Nama tidak valid (maks 100 karakter)." }, { status: 400 });
      }
      data.nama = nama.trim();
    }

    if (bio !== undefined) {
      if (typeof bio !== "string" || bio.length > 500) {
        return NextResponse.json({ error: "Bio maksimal 500 karakter." }, { status: 400 });
      }
      data.bio = bio;
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "Tidak ada data profil yang valid untuk disimpan." }, { status: 400 });
    }

    const user = await db.user.update({
      where: { id: session.user.id },
      data,
      select: { id: true, email: true, username: true, nama: true, bio: true, avatarUrl: true, role: true },
    });

    return NextResponse.json(user);
  } catch (error) {
    return handleApiError(error, "PATCH /api/users/me");
  }
}
