import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { logger } from "@/shared/logger";

const IGNORE_PATHS = new Set(["/api/health", "/favicon.ico"]);

export function middleware(request: NextRequest) {
  const start = Date.now();
  const { method, url } = request;
  const pathname = new URL(url).pathname;

  if (IGNORE_PATHS.has(pathname)) {
    return NextResponse.next();
  }

  logger.info(
    {
      req: {
        method,
        url: pathname,
        "user-agent": request.headers.get("user-agent") ?? undefined,
        ip: request.headers.get("x-forwarded-for") ?? undefined,
      },
    },
    "incoming request",
  );

  const response = NextResponse.next();

  // pino streams to stdout synchronously enough for dev terminal visibility.
  response.headers.set("x-request-start", String(start));

  // Log response after headers are set. Next.js does not expose a reliable
  // "onFinish" in middleware, so we log best-effort right after NextResponse.next().
  // Status is 200 unless Next.js rewrites/redirects elsewhere.
  logger.info(
    {
      req: { method, url: pathname },
      res: { status: response.status, durationMs: Date.now() - start },
    },
    "request handled",
  );

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
