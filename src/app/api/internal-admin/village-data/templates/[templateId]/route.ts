import { NextRequest, NextResponse } from "next/server";
import { requireInternalAdminSession } from "@/lib/auth/internal-admin";
import { handleApiError } from "@/lib/api-error";
import {
  deleteTemplate,
  TemplateManagementError,
  updateTemplateMeta,
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

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ templateId: string }> },
) {
  try {
    const session = await requireInternalAdminSession();
    if (session instanceof NextResponse) return session;

    const { templateId } = await params;
    const body = (await req.json()) as {
      name?: string;
      description?: string | null;
    };

    const result = await updateTemplateMeta({
      templateId,
      name: body.name ?? "",
      description: body.description ?? null,
    });

    return NextResponse.json(result);
  } catch (error) {
    return toErrorResponse(
      error,
      "PATCH /api/internal-admin/village-data/templates/[templateId]",
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ templateId: string }> },
) {
  try {
    const session = await requireInternalAdminSession();
    if (session instanceof NextResponse) return session;

    const { templateId } = await params;
    const result = await deleteTemplate(templateId);
    return NextResponse.json(result);
  } catch (error) {
    return toErrorResponse(
      error,
      "DELETE /api/internal-admin/village-data/templates/[templateId]",
    );
  }
}
