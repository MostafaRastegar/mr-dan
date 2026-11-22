"use client";

import { Button, Empty } from "antd";

interface Props {
  title?: string;
  description?: string;
  action?: { label: string; onClick: () => void };
}

export function EmptyState({ title, description, action }: Props): React.ReactNode {
  return (
    <Empty
      image={Empty.PRESENTED_IMAGE_SIMPLE}
      description={
        <div className="flex flex-col gap-2">
          <div className="text-slate-600 font-medium">{title || "داده‌ای یافت نشد"}</div>
          {description && <div className="text-slate-400 text-sm">{description}</div>}
          {action && (
            <Button type="primary" onClick={action.onClick} className="mt-3">
              {action.label}
            </Button>
          )}
        </div>
      }
    />
  );
}
