import type { NextRequest } from "next/server";
import { getContainer } from "@/server/container";
import { chatRequestSchema } from "@/modules/rag/presentation/schemas";
import { sse, sseResponse, toHttpError, requestIdHeader } from "@/modules/rag/presentation/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest): Promise<Response> {
  const requestId = requestIdHeader(req.headers);
  try {
    const body = chatRequestSchema.parse(await req.json());
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const send = (event: string, data: unknown) =>
          controller.enqueue(encoder.encode(sse(event, data)));
        try {
          await getContainer().askQuestion.executeStream(body, {
            onMeta: (m) => send("meta", m),
            onToken: (t) => send("token", t),
            onSources: (s) => send("sources", s),
            onDone: () => send("done", {}),
          }, { signal: req.signal });
        } catch (error) {
          send("error", { message: String(error) });
        } finally {
          controller.close();
        }
      },
    });
    return sseResponse(stream);
  } catch (error) {
    return toHttpError(error, requestId);
  }
}
