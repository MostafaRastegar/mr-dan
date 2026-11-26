import type { Metadata, Viewport } from "next";
import { Vazirmatn } from "next/font/google";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import Providers from "@/components/providers";
import "./globals.css";

const vazirmatn = Vazirmatn({
  subsets: ["arabic"],
  variable: "--font-vazirmatn",
  display: "swap",
});

export const metadata: Metadata = {
  title: "mr-dan",
  description: "پلتفرم مشاورهٔ تحصیلی هوشمند",
};

export const viewport: Viewport = {
  themeColor: "#faf8f3",
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    // Browser extensions may add classes (e.g. rtl-enabled) before hydration;
    // suppress only this element's attribute warning.
    <html lang="fa" dir="rtl" suppressHydrationWarning className={vazirmatn.variable}>
      <body>
        <AntdRegistry>
          <Providers>{children}</Providers>
        </AntdRegistry>
      </body>
    </html>
  );
}
