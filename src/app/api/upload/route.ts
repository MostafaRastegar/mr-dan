import fs from "node:fs";
import crypto from "node:crypto";
import type { NextRequest } from "next/server";
import { getContainer } from "@/server/container";
import { requireApiSession } from "@/server/advising-guards";
import { jsonOk, toHttpError, requestIdHeader } from "@/modules/rag/presentation/http";
import { UnsupportedFileError } from "@/modules/rag/domain/errors";

export const runtime = "nodejs"; export const dynamic = "force-dynamic"; export const maxDuration = 300;
const MAX_MB = 20;
const TMP_DIR = "/tmp/mr-dan-uploads";
const TYPE_BY_EXT: Record<string, "json" | "md" | "txt" | "pdf"> = { json: "json", md: "md", markdown: "md", txt: "txt", pdf: "pdf" };
function err(s: number, c: string, m: string, rid: string): Response {
  return new Response(JSON.stringify({ error: { code: c, message: m, requestId: rid } }), { status: s, headers: { "Content-Type": "application/json" } });
}
export async function POST(req: NextRequest): Promise<Response> {
  const rid = requestIdHeader(req.headers);
  try { await requireApiSession();
    const form = await req.formData();
    const file = form.get("file") as File | null;
    if (!file) return err(400, "missing_file", "No file provided", rid);
    if (file.size > MAX_MB * 1024 * 1024) return err(413, "file_too_large", `Max ${MAX_MB}MB`, rid);
    const ext = file.name.toLowerCase().match(/\.([^.]+)$/)?.[1] ?? "";
    const type = TYPE_BY_EXT[ext];
    if (!type) return err(415, "unsupported_file", `Unsupported: ${file.name}`, rid);
    await fs.promises.mkdir(TMP_DIR, { recursive: true });
    const path = `${TMP_DIR}/${crypto.randomUUID()}-${file.name}`;
    await fs.promises.writeFile(path, Buffer.from(await file.arrayBuffer()));
    try {
      const result = await getContainer().ingestDocument.execute({ filePath: path, originalFilename: file.name, fileType: type });
      return jsonOk(result, 201);
    } finally {
      await fs.promises.unlink(path).catch(() => {});
    }
  } catch (error) {
    if (error instanceof UnsupportedFileError) return err(415, "unsupported_file", String(error), rid);
    return toHttpError(error, rid);
  }
}
