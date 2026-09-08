import { NextResponse, type NextRequest } from "next/server";

/**
 * Content Security Policy แบบใช้ nonce
 *
 * ทุกครั้งที่มีคนเปิดหน้าเว็บ เราสุ่มค่า nonce ใหม่แล้วยัดใส่ทั้ง CSP header
 * และ script ที่ Next.js ปล่อยออกมา สคริปต์ที่ไม่มี nonce ตรงกันจะรันไม่ได้เลย
 * แปลว่าต่อให้มีใครหาทางแทรกสคริปต์เข้ามาในหน้าได้ เบราว์เซอร์ก็จะไม่ยอมรัน
 *
 * ไฟล์นี้ (เดิมชื่อ middleware.ts ก่อน Next.js 16) คือจุดเดียวที่ต้องแก้
 * ถ้าวันไหนอยากเพิ่ม passcode กันคนนอก แค่เช็คคุกกี้ตรงนี้แล้ว redirect ไปหน้าใส่รหัส
 */
export function proxy(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const isDev = process.env.NODE_ENV === "development";

  const csp = [
    "default-src 'self'",
    // React ใช้ eval ตอน dev เพื่อประกอบ stack trace ฝั่ง server ให้ดูในเบราว์เซอร์
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ""}`,
    `style-src 'self' 'nonce-${nonce}'${isDev ? " 'unsafe-inline'" : ""}`,
    // React เรนเดอร์ style={{...}} ออกมาเป็น attribute style="" ตอน SSR
    // nonce ใช้กับ attribute ไม่ได้ ต้องอนุญาตแยกที่ style-src-attr
    "style-src-attr 'unsafe-inline'",
    "img-src 'self' blob: data: https://tile.openstreetmap.org",
    "connect-src 'self' https://tile.openstreetmap.org",
    // MapLibre สร้าง web worker จาก blob URL
    "worker-src 'self' blob:",
    "child-src 'self' blob:",
    "font-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
  ].join("; ");

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", csp);

  return response;
}

export const config = {
  matcher: [
    {
      source: "/((?!api|_next/static|_next/image).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
