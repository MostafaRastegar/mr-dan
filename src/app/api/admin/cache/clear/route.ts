import type { NextRequest } from "next/server";
import { getContainer } from "@/server/container";
import { requireApiCapability } from "@/server/advising-guards";
import { jsonOk, toHttpError } from "@/modules/rag/presentation/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(_req: NextRequest): Promise<Response> {
  try {
    await requireApiCapability("rag:manage");
    await getContainer().askQuestion.clearCache();
    return jsonOk({ cleared: true });
  } catch (error) {
    return toHttpError(error, "admin-cache-clear");
  }
}
