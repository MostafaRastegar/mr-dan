import type { Metadata } from "next";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import Providers from "@/components/providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "mr-dan",
  description: "پلتفرم مشاورهٔ تحصیلی هوشمند",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    // Browser extensions may add classes (e.g. rtl-enabled) before hydration;
    // suppress only this element's attribute warning.
    <html lang="fa" dir="rtl" suppressHydrationWarning>
      <body>
        <AntdRegistry>
          <Providers>{children}</Providers>
        </AntdRegistry>
      </body>
    </html>
  );
}
