"use client";

import { ConfigProvider } from "antd";
import faIR from "antd/locale/fa_IR";

const theme = {
  token: {
    fontFamily: "Vazirmatn, Tahoma, ui-sans-serif, system-ui, sans-serif",
    colorPrimary: "#0f766e",
    borderRadius: 8,
  },
};

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ConfigProvider direction="rtl" locale={faIR} theme={theme}>
      {children}
    </ConfigProvider>
  );
}
