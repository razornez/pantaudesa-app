import { NextRequest, NextResponse } from "next/server";
import { requireInternalAdminSession } from "@/lib/auth/internal-admin";
import { handleApiError } from "@/lib/api-error";
import {
  switchTemplateForDesa,
  TemplateManagementError,
} from "@/lib/internal-admin/template-management-service";

function toErrorResponse(error: unknown, context: string) {
  if (error instanceof TemplateManagementError) {
    return NextResponse.json(
      { error: error.message, code: error.code },
      { status: error.status },
    );
  }

  return handleApiError(error, context);
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireInternalAdminSession();
    if (session instanceof NextResponse) return session;

    const body = (await req.json()) as {
      desaId?: string;
      templateId?: string;
    };

    const result = await switchTemplateForDesa({
      desaId: body.desaId ?? "",
      templateId: body.templateId ?? "",
    });

    return NextResponse.json(result);
  } catch (error) {
    return toErrorResponse(
      error,
      "POST /api/internal-admin/village-data/template-assignment",
    );
  }
}
