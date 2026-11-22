import type { NextRequest } from "next/server";
import { z } from "zod";
import { getContainer } from "@/server/container";
import { jsonOk, toHttpError } from "@/modules/rag/presentation/http";

const debugSchema = z.object({
  question: z.string().min(1),
  topK: z.coerce.number().int().positive().max(100).optional(),
});

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest): Promise<Response> {
  try {
    const body = debugSchema.parse(await req.json());
    const { answer } = await getContainer().searchKnowledge.execute({
      question: body.question,
      topK: body.topK,
    });
    return jsonOk({
      question: body.question,
      candidateCount: answer.sources.length,
      sources: answer.sources.map((s) => ({
        id: s.chunk.id,
        score: s.score,
        source: String(
          s.chunk.metadata["original_filename"] ??
            s.chunk.metadata["source"] ??
            "",
        ),
        preview: s.chunk.text.slice(0, 200),
      })),
    });
  } catch (error) {
    return toHttpError(error, "admin-retrieval-debug");
  }
}
