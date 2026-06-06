import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { handleApiError } from "@/lib/api-error";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const username = searchParams.get("username") ?? "";

    if (!/^[a-z0-9_]{3,20}$/.test(username)) {
      return NextResponse.json({ available: false });
    }

    const existing = await db.user.findUnique({
      where:  { username },
      select: { id: true },
    });

    return NextResponse.json({ available: !existing });
  } catch (error) {
    return handleApiError(error, "GET /api/users/username-check");
  }
}
