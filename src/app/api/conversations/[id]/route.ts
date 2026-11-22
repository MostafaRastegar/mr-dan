import type { NextRequest } from "next/server";
import { getContainer } from "@/server/container";
import { updateConversationSchema } from "@/modules/rag/presentation/schemas";
import { jsonOk, toHttpError, requestIdHeader } from "@/modules/rag/presentation/http";
import { NotFoundError } from "@/modules/rag/domain/errors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = async (_req: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<Response> => {
  const requestId = requestIdHeader(_req.headers);
  try {
    const id = (await params).id;
    const conversation = await getContainer().conversation.get(id);
    if (!conversation) throw new NotFoundError("Conversation");
    return jsonOk({ data: conversation });
  } catch (error) { return toHttpError(error, requestId); }
};

export const PUT = async (req: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<Response> => {
  const requestId = requestIdHeader(req.headers);
  try {
    const id = (await params).id;
    const body = updateConversationSchema.parse(await req.json());
    await getContainer().conversation.updateTitle(id, body);
    return jsonOk({ ok: true });
  } catch (error) { return toHttpError(error, requestId); }
};

export const DELETE = async (_req: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<Response> => {
  const requestId = requestIdHeader(_req.headers);
  try {
    const id = (await params).id;
    await getContainer().conversation.delete(id);
    return jsonOk({ ok: true });
  } catch (error) { return toHttpError(error, requestId); }
};
