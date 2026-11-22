import { NextResponse } from "next/server";
import { getContainer } from "@/server/container";
import { env } from "@/shared/env";
import { logger } from "@/shared/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const { healthProbes } = getContainer();

  const results = await Promise.all(
    Object.values(healthProbes).map(async (probe) => {
      try {
        await probe.check();
        return [probe.name, "ok"] as const;
      } catch (error) {
        logger.warn({ err: error, probe: probe.name }, "health check failed");
        return [probe.name, "unavailable"] as const;
      }
    }),
  );

  const dependencies = Object.fromEntries(results);
  const ok = results.every(([, status]) => status === "ok");

  return NextResponse.json(
    {
      status: ok ? "ok" : "degraded",
      dependencies,
      models: {
        embedding: env.EMBEDDING_MODEL,
        llm: env.LLM_MODEL,
      },
    },
    { status: ok ? 200 : 503 },
  );
}
