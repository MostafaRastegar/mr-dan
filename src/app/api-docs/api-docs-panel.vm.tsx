"use client";

import { useEffect, useRef, useState } from "react";

import { ApiDocsPanelView } from "./api-docs-panel.view";

const SWAGGER_UI_VERSION = "5.11.0";
const CDN = `https://unpkg.com/swagger-ui-dist@${SWAGGER_UI_VERSION}`;

export function ApiDocsPanelWrapper(): React.ReactNode {
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

  return <ApiDocsPanelView containerRef={containerRef} error={error} />;
}
