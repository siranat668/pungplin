/**
 * ตัวกลางคุยกับ Nominatim ของ OpenStreetMap
 *
 * นโยบายของ OSM บังคับว่าต้องส่ง User-Agent ที่ระบุตัวตนได้ และห้ามยิงเกิน
 * 1 request ต่อวินาที เลยรวมการเรียกไว้ที่ไฟล์นี้ที่เดียว ทั้ง header ทั้ง cache
 * จะได้ไม่หลุดกติกาเวลาเพิ่มที่เรียกใหม่
 *
 * เรียกจากฝั่ง server เท่านั้น ถ้าให้เบราว์เซอร์ยิงตรง User-Agent จะเป็นของเบราว์เซอร์
 * ซึ่งผิดกติกา และ IP ของผู้ใช้ก็จะโดนนับ rate limit เอง
 */
const BASE = "https://nominatim.openstreetmap.org";
const USER_AGENT = "pungplin/1.0 (https://github.com/siranat668/pungplin)";
const TIMEOUT_MS = 6000;
const CACHE_SECONDS = 86_400;

export type NominatimPlace = {
  name: string;
  address: string;
  lat: number;
  lng: number;
};

type NominatimResult = {
  display_name?: string;
  name?: string;
  lat?: string;
  lon?: string;
};

async function request(path: string, params: Record<string, string>): Promise<unknown> {
  const target = new URL(path, BASE);
  target.searchParams.set("format", "jsonv2");
  for (const [key, value] of Object.entries(params)) {
    target.searchParams.set(key, value);
  }

  const response = await fetch(target, {
    headers: { "user-agent": USER_AGENT, "accept-language": "th,en" },
    signal: AbortSignal.timeout(TIMEOUT_MS),
    next: { revalidate: CACHE_SECONDS },
  });

  if (!response.ok) throw new Error(`nominatim ${response.status}`);
  return response.json();
}

/** ค้นหาสถานที่จากชื่อหรือที่อยู่ */
export async function searchPlaces(query: string): Promise<NominatimPlace[]> {
  const raw = await request("/search", { q: query, limit: "6" });
  const results = Array.isArray(raw) ? (raw as NominatimResult[]) : [];

  return results
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
    .filter((item): item is NominatimPlace => item !== null);
}

/**
 * แปลงพิกัดกลับเป็นที่อยู่
 *
 * กลืน error ทุกกรณีแล้วคืน null เพราะที่อยู่เป็นของแถมจากการแกะลิงก์ Google
 * ถ้า Nominatim ล่มหรือช้า ก็ยังต้องได้พิกัดกลับไปให้ผู้ใช้บันทึกร้านได้เหมือนเดิม
 */
export async function reverseAddress(lat: number, lng: number): Promise<string | null> {
  try {
    const raw = await request("/reverse", {
      lat: String(lat),
      lon: String(lng),
      zoom: "18",
    });

    const result = raw as NominatimResult;
    const address = result.display_name?.trim();
    return address ? address.slice(0, 300) : null;
  } catch {
    return null;
  }
}
