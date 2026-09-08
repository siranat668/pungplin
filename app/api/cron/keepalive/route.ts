import { db, isDbConfigured } from "@/lib/db";

/**
 * Supabase free tier จะหยุดโปรเจกต์ให้อัตโนมัติถ้าไม่มี request เข้าฐานข้อมูลเลย 7 วัน
 * พอหยุดแล้วแอพจะพังเงียบๆ โดยไม่มีสัญญาณเตือน
 * Vercel Cron เรียก endpoint นี้วันละครั้งเพื่อแตะฐานข้อมูลเบาๆ ให้มันตื่นอยู่
 *
 * ตั้ง CRON_SECRET ใน env แล้ว Vercel จะแนบ Authorization header มาให้เอง
 * ถ้าไม่ตั้ง endpoint นี้ก็เปิดให้เรียกได้ ซึ่งไม่อันตรายเพราะมันแค่นับแถว
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get("authorization") !== `Bearer ${secret}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  if (!isDbConfigured()) {
    return Response.json({ ok: false, reason: "ยังไม่ได้ตั้งค่า Supabase" }, { status: 503 });
  }

  const { count, error } = await db()
    .from("restaurants")
    .select("id", { count: "exact", head: true });

  if (error) {
    return Response.json({ ok: false, reason: error.message }, { status: 502 });
  }

  return Response.json({ ok: true, restaurants: count ?? 0, at: new Date().toISOString() });
}
