import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { requireApiCapability } from "@/server/advising-guards";
import { toHttpError, requestIdHeader } from "@/modules/rag/presentation/http";
import { openApiSpec } from "@/lib/openapi";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = async (_req: NextRequest): Promise<Response> => {
  const requestId = requestIdHeader(_req.headers);
  try {
    await requireApiCapability("rag:manage");
    return NextResponse.json(openApiSpec, { status: 200 });
  } catch (error) {
    return toHttpError(error, requestId);
  }
};
