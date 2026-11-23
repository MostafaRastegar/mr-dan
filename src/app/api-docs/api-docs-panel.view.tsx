import type { RefObject } from "react";
import { Card } from "antd";

interface ApiDocsPanelViewProps {
  containerRef: RefObject<HTMLDivElement | null>;
  error: string | null;
}

export function ApiDocsPanelView({
  containerRef,
  error,
}: ApiDocsPanelViewProps): React.ReactNode {
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
