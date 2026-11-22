import { NextResponse } from "next/server";
import { metrics } from "@/shared/metrics";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  return new NextResponse(metrics.toPrometheusText(), {
    status: 200,
    headers: { "Content-Type": "text/plain; version=0.0.4; charset=utf-8" },
  });
}
