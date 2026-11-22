import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { openApiSpec } from "@/lib/openapi";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = async (_req: NextRequest): Promise<Response> => {
  return NextResponse.json(openApiSpec, { status: 200 });
};
