import type { NextConfig } from "next";

/**
 * Content-Security-Policy ไม่ได้อยู่ที่นี่ เพราะมันต้องใช้ nonce ที่สุ่มใหม่ทุก request
 * ดูที่ proxy.ts แทน
 */
const securityHeaders = [
  // แอพเปิดให้เข้าได้โดยไม่ต้องล็อกอิน จึงต้องกันไม่ให้ search engine พามาเจอ
  { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    // ปิดทุกอย่างยกเว้น geolocation ที่ปุ่ม "ใช้ตำแหน่งปัจจุบัน" ต้องใช้
    value: "camera=(), microphone=(), payment=(), usb=(), geolocation=(self)",
  },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
