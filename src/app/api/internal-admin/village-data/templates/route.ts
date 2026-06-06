import { NextRequest, NextResponse } from "next/server";
import { requireInternalAdminSession } from "@/lib/auth/internal-admin";
import { handleApiError } from "@/lib/api-error";
import {
  createTemplate,
  getTemplateWorkspace,
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

export async function GET(req: NextRequest) {
  try {
    const session = await requireInternalAdminSession();
    if (session instanceof NextResponse) return session;

    const templateId = req.nextUrl.searchParams.get("templateId");
    const payload = await getTemplateWorkspace(templateId);
    return NextResponse.json(payload);
  } catch (error) {
    return toErrorResponse(
      error,
      "GET /api/internal-admin/village-data/templates",
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireInternalAdminSession();
    if (session instanceof NextResponse) return session;

    const body = (await req.json()) as {
      name?: string;
      description?: string | null;
    };

    const result = await createTemplate({
      name: body.name ?? "",
      description: body.description ?? null,
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return toErrorResponse(
      error,
      "POST /api/internal-admin/village-data/templates",
    );
  }
}
