import { NextResponse } from "next/server";
import { getContainer } from "@/server/container";
import { env } from "@/shared/env";
import { logger } from "@/shared/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = async (): Promise<Response> => {
  const { healthProbes, adminStats } = getContainer();
  const dependencies: Record<string, string> = {};
  let ok = true;
  for (const probe of Object.values(healthProbes)) {
    try { await probe.check(); dependencies[probe.name] = "ok"; }
    catch { logger.warn({ probe: probe.name }, "health failed"); dependencies[probe.name] = "unavailable"; ok = false; }
  }
  let documents = 0;
  let chunks = 0;
  try { const s = await adminStats.execute(); documents = s.documents; chunks = s.chunks; } catch { /* best-effort stats */ }
  return NextResponse.json(
    { status: ok ? "ok" : "degraded", version: "0.1.0", dependencies, counts: { documents, chunks }, models: { embedding: env.EMBEDDING_MODEL, llm: env.LLM_MODEL } },
    { status: ok ? 200 : 503 },
  );
};
