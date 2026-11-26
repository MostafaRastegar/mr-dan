"use client";

import { ConfigProvider } from "antd";
import faIR from "antd/locale/fa_IR";

const theme = {
  token: {
    fontFamily:
      "var(--font-vazirmatn), Vazirmatn, Tahoma, ui-sans-serif, system-ui, sans-serif",
    colorPrimary: "#1f7a4d",
    colorInfo: "#2e7cd6",
    colorWarning: "#b7791f",
    colorError: "#d6455d",
    colorTextBase: "#232b45",
    colorBgLayout: "#faf8f3",
    borderRadius: 12,
  },
};

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ConfigProvider direction="rtl" locale={faIR} theme={theme}>
      {children}
    </ConfigProvider>
  );
}
