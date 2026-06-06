import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { handleApiError } from "@/lib/api-error";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { username, nama, bio } = body;

    if (!username || !nama) {
      return NextResponse.json({ error: "username dan nama wajib diisi" }, { status: 400 });
    }

    if (!/^[a-z0-9_]{3,20}$/.test(username)) {
      return NextResponse.json(
        { error: "Username hanya boleh huruf kecil, angka, dan underscore (3-20 karakter)" },
        { status: 400 }
      );
    }

    const existing = await db.user.findUnique({ where: { username } });
    if (existing && existing.id !== session.user.id) {
      return NextResponse.json({ error: "Username sudah dipakai" }, { status: 409 });
    }

    const user = await db.user.update({
      where:  { id: session.user.id },
      data:   { username, nama, bio: bio ?? null },
      select: { id: true, email: true, username: true, nama: true, bio: true, role: true },
    });

    return NextResponse.json(user);
  } catch (error) {
    return handleApiError(error, "POST /api/users/register");
  }
}
