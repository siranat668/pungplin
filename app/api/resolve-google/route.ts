import { allowRequest } from "@/lib/ratelimit";
import { resolveGoogleMapsUrl } from "@/lib/google-maps";
import { resolveGoogleSchema } from "@/lib/schemas";

/**
 * แกะพิกัดจากลิงก์ Google Maps ที่ผู้ใช้วางเข้ามา
 *
 * การยิง HTTP ไปยัง URL ที่ผู้ใช้กำหนดเองคือช่องโหว่ SSRF โดยธรรมชาติ
 * ด่านทั้งหมดอยู่ใน lib/google-maps.ts: บังคับ https, allowlist โดเมนของ Google
 * ทุกชั้นของ redirect, ตามไม่เกิน 3 ชั้น, timeout 5 วินาที
 *
 * ที่สำคัญคือ route นี้ไม่เคยส่ง response body จากปลายทางกลับไปให้ client เลย
 * คืนแค่ตัวเลขพิกัดกับชื่อร้าน ต่อให้มีใครหาทางยิงไปที่อื่นได้ ก็ไม่ได้ข้อมูลกลับไป
 */
export async function POST(request: Request) {
  if (!(await allowRequest("lookup"))) {
    return Response.json({ error: "ลองถี่เกินไป พักสักครู่แล้วลองใหม่" }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "ข้อมูลที่ส่งมาไม่ถูกต้อง" }, { status: 400 });
  }

  const parsed = resolveGoogleSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  try {
    const place = await resolveGoogleMapsUrl(parsed.data.url);
    return Response.json({ place });
  } catch (error) {
    const message =
      error instanceof Error && error.message
        ? error.message
        : "แกะลิงก์นี้ไม่สำเร็จ ลองปักหมุดเองบนแผนที่แทน";
    return Response.json({ error: message }, { status: 400 });
  }
}
