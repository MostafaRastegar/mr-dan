import type { NextRequest } from "next/server";
import { getContainer } from "@/server/container";
import { requireApiCapability } from "@/server/advising-guards";
import { jsonOk, toHttpError, requestIdHeader } from "@/modules/rag/presentation/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest): Promise<Response> {
  const requestId = requestIdHeader(_req.headers);
  try {
    await requireApiCapability("rag:manage");
    const stats = await getContainer().adminStats.execute();
    return jsonOk(stats);
  } catch (error) {
    return toHttpError(error, requestId);
  }
}
