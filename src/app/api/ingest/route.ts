import type { NextRequest } from "next/server";
import { getContainer } from "@/server/container";
import { requireApiSession } from "@/server/advising-guards";
import { ingestRequestSchema } from "@/modules/rag/presentation/schemas";
import { jsonOk, toHttpError, requestIdHeader } from "@/modules/rag/presentation/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest): Promise<Response> {
  const requestId = requestIdHeader(req.headers);
  try {
    await requireApiSession();
    const body = ingestRequestSchema.parse(await req.json());
    const result = await getContainer().ingestDocument.execute(body);
    return jsonOk(result);
  } catch (error) {
    return toHttpError(error, requestId);
  }
}
