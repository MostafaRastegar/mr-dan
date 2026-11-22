import { NextResponse } from "next/server";
import { toHttpError } from "@/modules/rag/presentation/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  const requestId = crypto.randomUUID();
  try {
    // TODO: wire ListDocumentsUseCase into container; placeholder returns empty
    return NextResponse.json({ data: [] }, { status: 200 });
  } catch (error) {
    return toHttpError(error, requestId);
  }
}
