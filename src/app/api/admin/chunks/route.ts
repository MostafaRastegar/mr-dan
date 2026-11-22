import type { NextRequest } from "next/server";
import { getContainer } from "@/server/container";
import { jsonOk, toHttpError, requestIdHeader } from "@/modules/rag/presentation/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest): Promise<Response> {
  const requestId = requestIdHeader(_req.headers);
  try {
    const { chunks } = await getContainer().adminChunks.list();
    return jsonOk(chunks);
  } catch (error) {
    return toHttpError(error, requestId);
  }
}
