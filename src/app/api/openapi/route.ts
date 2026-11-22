import type { NextRequest } from "next/server";
import { openApiSpec } from "@/lib/openapi";
import { jsonOk } from "@/modules/rag/presentation/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = async (_req: NextRequest): Promise<Response> => {
  return jsonOk({ data: openApiSpec });
};
