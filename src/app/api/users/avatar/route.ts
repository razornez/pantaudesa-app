import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { handleApiError } from "@/lib/api-error";

const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES  = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/heic", "image/heif"];

// POST /api/users/avatar — accepts multipart/form-data with field "file"
export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const form = await req.formData();
    const file = form.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "File tidak ditemukan" }, { status: 400 });
    }
    const fileType = file.type || "image/jpeg";
    if (!ALLOWED_TYPES.includes(fileType)) {
      return NextResponse.json({ error: `Format ${fileType || "file"} tidak didukung. Gunakan JPG, PNG, WebP, atau foto dari galeri.` }, { status: 400 });
    }
    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json({ error: "Ukuran foto terlalu besar. Maksimal 5 MB." }, { status: 400 });
    }

    // Convert to base64 data URL — stored directly in DB (no external storage needed for MVP)
    const buffer   = await file.arrayBuffer();
    const base64   = Buffer.from(buffer).toString("base64");
    const mimeType = fileType.startsWith("image/heic") || fileType.startsWith("image/heif") ? "image/jpeg" : fileType;
    const dataUrl  = `data:${mimeType};base64,${base64}`;

    const user = await db.user.update({
      where:  { id: session.user.id },
      data:   { avatarUrl: dataUrl, image: dataUrl },
      select: { id: true, avatarUrl: true },
    });

    return NextResponse.json({ avatarUrl: user.avatarUrl });
  } catch (error) {
    return handleApiError(error, "POST /api/users/avatar");
  }
}
