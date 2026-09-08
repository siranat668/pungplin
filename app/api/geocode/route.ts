import type { NextRequest } from "next/server";

import { allowRequest } from "@/lib/ratelimit";
import { geocodeQuerySchema } from "@/lib/schemas";

/**
 * Proxy ไปยัง Nominatim ของ OpenStreetMap
 *
 * ยิงผ่าน server แทนที่จะให้เบราว์เซอร์ยิงตรง เพราะนโยบายของ OSM บังคับให้ส่ง
 * User-Agent ที่ระบุตัวตนได้ และจำกัดไม่เกิน 1 request ต่อวินาที
 * ผลลัพธ์ถูก cache ไว้หนึ่งวัน คำค้นซ้ำจึงไม่ไปกวน OSM อีก
 */
const NOMINATIM = "https://nominatim.openstreetmap.org/search";
const USER_AGENT = "pungplin/1.0 (https://github.com/siranat668/pungplin)";

type NominatimResult = {
  display_name?: string;
  name?: string;
  lat?: string;
  lon?: string;
};

export async function GET(request: NextRequest) {
  if (!(await allowRequest("lookup"))) {
    return Response.json({ error: "ค้นหาถี่เกินไป พักสักครู่แล้วลองใหม่" }, { status: 429 });
  }

  const parsed = geocodeQuerySchema.safeParse(request.nextUrl.searchParams.get("q") ?? "");
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const target = new URL(NOMINATIM);
  target.searchParams.set("format", "jsonv2");
  target.searchParams.set("q", parsed.data);
  target.searchParams.set("limit", "6");

  try {
    const response = await fetch(target, {
      headers: { "user-agent": USER_AGENT, "accept-language": "th,en" },
      signal: AbortSignal.timeout(6000),
      next: { revalidate: 86_400 },
    });

    if (!response.ok) {
      return Response.json({ error: "บริการค้นหาที่อยู่ไม่ตอบสนอง" }, { status: 502 });
    }

    const raw: unknown = await response.json();
    const results = Array.isArray(raw) ? (raw as NominatimResult[]) : [];

    const places = results
      .map((item) => {
        const lat = Number(item.lat);
        const lng = Number(item.lon);
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
        const full = item.display_name ?? item.name ?? "";
        return {
          name: item.name?.trim() || full.split(",")[0]?.trim() || "ไม่ทราบชื่อ",
          address: full,
          lat,
          lng,
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);

    return Response.json({ places });
  } catch {
    return Response.json({ error: "ค้นหาที่อยู่ไม่สำเร็จ ลองใหม่อีกครั้ง" }, { status: 502 });
  }
}
