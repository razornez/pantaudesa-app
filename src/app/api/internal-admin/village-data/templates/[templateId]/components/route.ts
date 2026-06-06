import { NextRequest, NextResponse } from "next/server";
import { requireInternalAdminSession } from "@/lib/auth/internal-admin";
import { handleApiError } from "@/lib/api-error";
import {
  replaceTemplateComponents,
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

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ templateId: string }> },
) {
  try {
    const session = await requireInternalAdminSession();
    if (session instanceof NextResponse) return session;

    const { templateId } = await params;
    const body = (await req.json()) as {
      componentKeys?: string[];
    };

    const result = await replaceTemplateComponents({
      templateId,
      componentKeys: Array.isArray(body.componentKeys) ? body.componentKeys : [],
    });

    return NextResponse.json(result);
  } catch (error) {
    return toErrorResponse(
      error,
      "PUT /api/internal-admin/village-data/templates/[templateId]/components",
    );
  }
}
