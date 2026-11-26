import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { SESSION_COOKIE_NAME } from "@/modules/advising/presentation/cookie";
import { logger } from "@/shared/logger";

const IGNORE_PATHS = new Set(["/api/health", "/favicon.ico"]);

/** Routes anonymous users may open. Everything else (non-API, non-static)
 *  gets a cheap cookie-presence redirect before any render happens. */
const PUBLIC_PATHS = new Set(["/", "/login", "/register"]);

const isProtectedPage = (pathname: string): boolean =>
  !pathname.startsWith("/api") && !PUBLIC_PATHS.has(pathname);

export function proxy(request: NextRequest) {
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

  // Presence check only: the cookie value is opaque and its role is resolved
  // from the DB, which the proxy must not touch. A live-but-stale cookie still
  // falls through to the layout/page guards; role checks never live here.
  if (isProtectedPage(pathname) && !request.cookies.get(SESSION_COOKIE_NAME)) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const response = NextResponse.next();

  // pino streams to stdout synchronously enough for dev terminal visibility.
  response.headers.set("x-request-start", String(start));

  // Log response after headers are set. Next.js does not expose a reliable
  // "onFinish" in proxy, so we log best-effort right after NextResponse.next().
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
