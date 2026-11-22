"use client";

import { Skeleton, Space, Typography } from "antd";

const { Title, Paragraph } = Typography;

export function LoadingSkeleton(): React.ReactNode {
  return (
    <div className="flex flex-col gap-4 p-6 text-center">
      <div className="flex items-center justify-center">
        <span className="text-4xl text-slate-400">⏳</span>
      </div>
      <Title level={3} className="text-slate-500" style={{ marginTop: 16 }}>
        در حال بارگذاری…
      </Title>
      <Paragraph className="text-slate-400">لطفاً کمی صبر کنید.</Paragraph>
    </div>
  );
}

export function MessageSkeleton(): React.ReactNode {
  return (
    <Space orientation="vertical" className="w-full gap-3 p-4">
      <Skeleton paragraph={{ rows: 4 }} />
      <Skeleton paragraph={{ rows: 2 }} />
    </Space>
  );
}
