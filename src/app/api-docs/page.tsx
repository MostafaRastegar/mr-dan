"use client";

import { useEffect, useRef } from "react";
import { Card } from "antd";

const SWAGGER_UI_VERSION = "5.11.0";

export default function ApiDocsPage(): React.ReactNode {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Swagger UI CSS از CDN
    if (!document.getElementById("swagger-ui-css")) {
      const link = document.createElement("link");
      link.id = "swagger-ui-css";
      link.rel = "stylesheet";
      link.href = `https://unpkg.com/swagger-ui-dist@${SWAGGER_UI_VERSION}/swagger-ui.css`;
      document.head.appendChild(link);
    }

    // Swagger UI bundle از CDN
    const scriptId = "swagger-ui-bundle";
    if (!document.getElementById(scriptId)) {
      const script = document.createElement("script");
      script.id = scriptId;
      script.src = `https://unpkg.com/swagger-ui-dist@${SWAGGER_UI_VERSION}/swagger-ui-bundle.js`;
      script.onload = () => {
        // SwaggerUIBundle و SwaggerUIStandalonePreset از اسکریپت CDN تزریق می‌شوند
        const win = window as unknown as {
          SwaggerUIBundle?: unknown;
          SwaggerUIStandalonePreset?: unknown;
        };
        const bundle = win.SwaggerUIBundle;
        const preset = win.SwaggerUIStandalonePreset;
        if (typeof bundle === "function" && containerRef.current) {
          (bundle as (config: unknown) => void)({
            domNode: containerRef.current,
            url: "/api/openapi",
            presets: preset ? [preset] : [],
            layout: "StandaloneLayout",
          });
        }
      };
      document.head.appendChild(script);
    }
  }, []);

  return (
    <div className="min-h-dvh bg-slate-50">
      <Card className="m-6 border-none shadow-sm">
        <div ref={containerRef} className="h-[calc(100vh-120px)]" />
      </Card>
    </div>
  );
}
