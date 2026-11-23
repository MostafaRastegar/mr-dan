import type { NextRequest } from "next/server";
import { getContainer } from "@/server/container";
import { requireApiSession } from "@/server/advising-guards";
import { jsonOk, toHttpError, requestIdHeader } from "@/modules/rag/presentation/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = async (_req: NextRequest): Promise<Response> => {
  const requestId = requestIdHeader(_req.headers);
  try {
    await requireApiSession();
    const { documents } = await getContainer().listDocuments.execute();
    return jsonOk(documents);
  } catch (error) {
    return toHttpError(error, requestId);
  }
};

export const POST = async (req: NextRequest): Promise<Response> => {
  const requestId = requestIdHeader(req.headers);
  try {
    await requireApiSession();
    const body = await req.json();
    const result = await getContainer().ingestDocument.execute(body);
    return jsonOk(result, 201);
  } catch (error) {
    return toHttpError(error, requestId);
  }
};
