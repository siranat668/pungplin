import type { Metadata, Viewport } from "next";
import { Mali, Noto_Sans_Thai } from "next/font/google";

import "./globals.css";

/* ฟอนต์ระบบภาษาไทยบน Windows, iOS และ Android คนละตัวกันหมด
   ฝังเองทั้งคู่เพื่อให้หน้าตาเหมือนกันทุกเครื่อง */
const notoSansThai = Noto_Sans_Thai({
  variable: "--font-thai",
  subsets: ["thai", "latin"],
  display: "swap",
});

const mali = Mali({
  variable: "--font-display",
  subsets: ["thai", "latin"],
  weight: ["500", "600", "700"],
  display: "swap",
});

const siteUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "พุงปลิ้น",
    template: "%s · พุงปลิ้น",
  },
  description: "สมุดบันทึกร้านอาหารของมุกกับเบย์",
  applicationName: "พุงปลิ้น",
  // แอพนี้เปิดให้เข้าได้โดยไม่ต้องล็อกอิน จึงต้องกันไม่ให้ search engine พามาเจอ
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: { index: false, follow: false },
  },
};

export const viewport: Viewport = {
  themeColor: "#0b0b10",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="th"
      className={`${notoSansThai.variable} ${mali.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
