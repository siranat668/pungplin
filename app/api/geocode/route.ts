import type { NextRequest } from "next/server";

import { searchPlaces } from "@/lib/nominatim";
import { allowRequest } from "@/lib/ratelimit";
import { geocodeQuerySchema } from "@/lib/schemas";

/**
 * ค้นหาที่อยู่ผ่าน Nominatim ของ OpenStreetMap
 *
 * ยิงผ่าน server แทนที่จะให้เบราว์เซอร์ยิงตรง เพราะนโยบายของ OSM บังคับให้ส่ง
 * User-Agent ที่ระบุตัวตนได้ และจำกัดไม่เกิน 1 request ต่อวินาที
 * รายละเอียดการเรียกกับการ cache อยู่ใน lib/nominatim.ts
 */
export async function GET(request: NextRequest) {
  if (!(await allowRequest("lookup"))) {
    return Response.json({ error: "ค้นหาถี่เกินไป พักสักครู่แล้วลองใหม่" }, { status: 429 });
  }

  const parsed = geocodeQuerySchema.safeParse(request.nextUrl.searchParams.get("q") ?? "");
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  try {
    const places = await searchPlaces(parsed.data);
    return Response.json({ places });
  } catch {
    return Response.json({ error: "ค้นหาที่อยู่ไม่สำเร็จ ลองใหม่อีกครั้ง" }, { status: 502 });
  }
}
