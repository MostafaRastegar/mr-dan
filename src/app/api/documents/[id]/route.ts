import type { NextRequest } from "next/server";
import { getContainer } from "@/server/container";
import { jsonOk, toHttpError, requestIdHeader } from "@/modules/rag/presentation/http";
import { NotFoundError } from "@/modules/rag/domain/errors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = async (
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> => {
  const requestId = requestIdHeader(_req.headers);
  try {
    const id = (await params).id;
    const doc = await getContainer().manageDocuments.get(id);
    if (!doc) throw new NotFoundError("Document");
    return jsonOk(doc);
  } catch (error) {
    return toHttpError(error, requestId);
  }
};

export const DELETE = async (
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> => {
  const requestId = requestIdHeader(_req.headers);
  try {
    const id = (await params).id;
    const result = await getContainer().manageDocuments.delete({ documentId: id });
    if (!result.document) throw new NotFoundError("Document");
    return jsonOk({ id, chunksDeleted: result.chunksDeleted });
  } catch (error) {
    return toHttpError(error, requestId);
  }
};
