import type { NextRequest } from "next/server";
import { getContainer } from "@/server/container";
import { jsonOk, toHttpError, requestIdHeader } from "@/modules/rag/presentation/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const DELETE = async (_req: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<Response> => {
  const requestId = requestIdHeader(_req.headers);
  try {
    const id = (await params).id;
    await getContainer().adminChunks.delete(id);
    return jsonOk({ ok: true });
  } catch (error) { return toHttpError(error, requestId); }
};
