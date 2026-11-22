"use client";

import { useEffect, useRef, useState } from "react";
import { Card } from "antd";

const SWAGGER_UI_VERSION = "5.11.0";
const CDN = `https://unpkg.com/swagger-ui-dist@${SWAGGER_UI_VERSION}`;

export default function ApiDocsPage(): React.ReactNode {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    let initialized = false;

    const initSwagger = () => {
      if (initialized) return;
      const win = window as unknown as { SwaggerUIBundle?: unknown };
      const bundle = win.SwaggerUIBundle;
      if (typeof bundle !== "function") return;
      if (!containerRef.current) return;
      initialized = true;
      try {
        (bundle as (config: unknown) => void)({
          domNode: containerRef.current,
          url: "/api/openapi",
        });
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "خطای نامشخص در بارگذاری Swagger UI",
        );
      }
    };

    if (!document.getElementById("swagger-ui-css")) {
      const link = document.createElement("link");
      link.id = "swagger-ui-css";
      link.rel = "stylesheet";
      link.href = `${CDN}/swagger-ui.css`;
      document.head.appendChild(link);
    }

    // swagger-ui-bundle.js includes BaseLayout (default) — StandaloneLayout
    // lives in a separate preset we do not load, so we keep the default layout.
    const bundleId = "swagger-ui-bundle";
    if (document.getElementById(bundleId)) {
      initSwagger();
    } else {
      const bundleScript = document.createElement("script");
      bundleScript.id = bundleId;
      bundleScript.src = `${CDN}/swagger-ui-bundle.js`;
      bundleScript.onload = initSwagger;
      bundleScript.onerror = () => setError("بارگذاری swagger-ui-bundle.js شکست کرد");
      document.head.appendChild(bundleScript);
    }
  }, []);

  if (error) {
    return (
      <div dir="ltr" className="swagger-docs min-h-dvh bg-slate-50 p-6 text-left">
        <Card className="border-red-200 bg-red-50 p-6">
          <h3 className="text-red-900 font-medium mb-2">Failed to load API docs</h3>
          <p className="text-red-700 text-sm">{error}</p>
          <p className="text-red-600 text-sm mt-2">
            Raw spec: <a href="/api/openapi" className="underline">/api/openapi</a>
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div dir="ltr" className="swagger-docs min-h-dvh bg-slate-50 text-left">
      <Card className="m-6 border-none shadow-sm">
        <div ref={containerRef} className="h-[calc(100vh-140px)]" />
      </Card>
    </div>
  );
}
