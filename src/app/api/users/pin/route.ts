import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { hashPin } from "@/lib/pin";
import { handleApiError } from "@/lib/api-error";
import bcrypt from "bcryptjs";

// PATCH /api/users/pin — change PIN (requires current PIN)
export async function PATCH(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { currentPin, newPin, confirmPin } = await req.json();

    if (!currentPin || !newPin || !confirmPin) {
      return NextResponse.json({ error: "Semua field wajib diisi." }, { status: 400 });
    }
    if (!/^\d{6}$/.test(newPin)) {
      return NextResponse.json({ field: "newPin", error: "PIN baru harus 6 digit angka." }, { status: 400 });
    }
    if (newPin !== confirmPin) {
      return NextResponse.json({ field: "confirmPin", error: "Konfirmasi PIN tidak cocok." }, { status: 400 });
    }

    const user = await db.user.findUnique({
      where:  { id: session.user.id },
      select: { pinHash: true },
    });

    if (!user?.pinHash) {
      return NextResponse.json({ error: "Akun belum memiliki PIN." }, { status: 400 });
    }

    const currentMatch = await bcrypt.compare(currentPin, user.pinHash);
    if (!currentMatch) {
      return NextResponse.json({ field: "currentPin", error: "PIN saat ini salah." }, { status: 401 });
    }

    if (currentPin === newPin) {
      return NextResponse.json({ field: "newPin", error: "PIN baru tidak boleh sama dengan PIN lama." }, { status: 400 });
    }

    await db.user.update({
      where: { id: session.user.id },
      data:  { pinHash: await hashPin(newPin), pinAttempts: 0, pinLockedUntil: null },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error, "PATCH /api/users/pin");
  }
}
