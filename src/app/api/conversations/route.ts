import type { NextRequest } from "next/server";
import { getContainer } from "@/server/container";
import { createConversationSchema } from "@/modules/rag/presentation/schemas";
import { jsonOk, toHttpError, requestIdHeader } from "@/modules/rag/presentation/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest): Promise<Response> {
  const requestId = requestIdHeader(_req.headers);
  try {
    const conversations = await getContainer().conversation.list();
    return jsonOk({ data: conversations });
  } catch (error) {
    return toHttpError(error, requestId);
  }
}

export async function POST(req: NextRequest): Promise<Response> {
  const requestId = requestIdHeader(req.headers);
  try {
    const body = createConversationSchema.parse(await req.json());
    const conversation = await getContainer().conversation.create(body);
    return jsonOk({ data: conversation }, 201);
  } catch (error) {
    return toHttpError(error, requestId);
  }
}
