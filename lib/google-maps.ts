/**
 * แกะพิกัดออกจากลิงก์ Google Maps
 *
 * ลิงก์ย่อแบบ maps.app.goo.gl ไม่มีพิกัดอยู่ในตัว ต้องยิง request จาก server
 * เพื่อตาม redirect ไปหาลิงก์เต็ม ซึ่งแปลว่าเรากำลังยิง HTTP ไปยัง URL
 * ที่ผู้ใช้พิมพ์เข้ามา นั่นคือช่องโหว่ SSRF เต็มรูปแบบถ้าไม่กัน
 *
 * ด่านที่วางไว้: บังคับ https, host ต้องอยู่ใน allowlist ทุกชั้นของ redirect,
 * ตามได้ไม่เกิน 3 ชั้น, timeout 5 วินาที และไม่อ่าน response body เลย
 * เราสนใจแค่ URL ปลายทางเท่านั้น
 */

const ALLOWED_HOSTS = new Set([
  "google.com",
  "www.google.com",
  "maps.google.com",
  "maps.app.goo.gl",
  "goo.gl",
  "g.co",
  "consent.google.com",
]);

const MAX_REDIRECTS = 3;
const TIMEOUT_MS = 5000;

export type GoogleMapsPlace = {
  lat: number;
  lng: number;
  name: string | null;
  url: string;
};

/** คืน URL ที่ผ่านด่านแล้ว หรือ null ถ้าไม่ใช่ลิงก์ Google Maps ที่เรายอมรับ */
export function parseGoogleMapsUrl(raw: string): URL | null {
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    return null;
  }

  if (url.protocol !== "https:") return null;
  if (!ALLOWED_HOSTS.has(url.hostname.toLowerCase())) return null;
  // hostname ที่เป็นเลข IP ล้วนจะไม่มีทางตรงกับ allowlist อยู่แล้ว
  // แต่เช็คซ้ำไว้กัน allowlist ถูกแก้ให้หลวมขึ้นในอนาคต
  if (/^[\d.]+$/.test(url.hostname) || url.hostname.includes(":")) return null;

  return url;
}

export function isGoogleMapsUrl(raw: string): boolean {
  return parseGoogleMapsUrl(raw) !== null;
}

function isShortLink(url: URL): boolean {
  const host = url.hostname.toLowerCase();
  return host === "maps.app.goo.gl" || host === "goo.gl" || host === "g.co";
}

function validLatLng(lat: number, lng: number): boolean {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    Math.abs(lat) <= 90 &&
    Math.abs(lng) <= 180 &&
    !(lat === 0 && lng === 0)
  );
}

/** ดึงพิกัดจาก URL เต็มของ Google Maps โดยไม่ต้องยิง network */
export function extractCoords(url: URL): { lat: number; lng: number } | null {
  const href = url.href;

  // !3d<lat>!4d<lng> คือพิกัดของสถานที่จริง แม่นกว่า @ ซึ่งเป็นจุดกึ่งกลางจอ
  const place = href.match(/!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/);
  if (place) {
    const lat = Number(place[1]);
    const lng = Number(place[2]);
    if (validLatLng(lat, lng)) return { lat, lng };
  }

  const viewport = href.match(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
  if (viewport) {
    const lat = Number(viewport[1]);
    const lng = Number(viewport[2]);
    if (validLatLng(lat, lng)) return { lat, lng };
  }

  for (const key of ["q", "query", "ll", "center", "daddr"]) {
    const raw = url.searchParams.get(key);
    if (!raw) continue;
    const pair = raw.match(/^\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$/);
    if (!pair) continue;
    const lat = Number(pair[1]);
    const lng = Number(pair[2]);
    if (validLatLng(lat, lng)) return { lat, lng };
  }

  return null;
}

/** ดึงชื่อร้านจากส่วน /maps/place/<ชื่อ>/ ของ URL */
export function extractPlaceName(url: URL): string | null {
  const match = url.pathname.match(/\/maps\/place\/([^/]+)/);
  const raw = match?.[1] ?? url.searchParams.get("q");
  if (!raw) return null;

  let name: string;
  try {
    name = decodeURIComponent(raw.replace(/\+/g, " "));
  } catch {
    return null;
  }

  name = name.trim();
  // ถ้า q เป็นพิกัดล้วน มันไม่ใช่ชื่อร้าน
  if (!name || /^-?\d+(\.\d+)?\s*,\s*-?\d+(\.\d+)?$/.test(name)) return null;

  return name.slice(0, 200);
}

/**
 * ตาม redirect ของลิงก์ย่อจนได้ URL เต็ม
 * ไม่อ่าน body เลย และปฏิเสธทันทีถ้า redirect พาออกนอก allowlist
 */
async function followShortLink(start: URL): Promise<URL> {
  let current = start;

  for (let hop = 0; hop < MAX_REDIRECTS; hop++) {
    // consent.google.com พก URL จริงไว้ในพารามิเตอร์ continue
    if (current.hostname.toLowerCase() === "consent.google.com") {
      const next = current.searchParams.get("continue");
      const parsed = next ? parseGoogleMapsUrl(next) : null;
      if (!parsed) break;
      current = parsed;
      continue;
    }

    if (!isShortLink(current)) break;

    const response = await fetch(current.href, {
      method: "HEAD",
      redirect: "manual",
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: { "user-agent": "pungplin/1.0 (restaurant diary)" },
      cache: "no-store",
    });

    const location = response.headers.get("location");
    if (!location) break;

    let candidate: string;
    try {
      candidate = new URL(location, current).href;
    } catch {
      break;
    }

    const parsed = parseGoogleMapsUrl(candidate);
    if (!parsed) {
      throw new Error("ลิงก์นี้พาออกไปนอกโดเมนของ Google เลยไม่ตามต่อ");
    }
    current = parsed;
  }

  return current;
}

/**
 * รับลิงก์ Google Maps ดิบ คืนพิกัดกับชื่อร้าน
 * โยน Error พร้อมข้อความภาษาไทยถ้าลิงก์ใช้ไม่ได้
 */
export async function resolveGoogleMapsUrl(raw: string): Promise<GoogleMapsPlace> {
  const start = parseGoogleMapsUrl(raw);
  if (!start) {
    throw new Error("ต้องเป็นลิงก์ Google Maps แบบ https เท่านั้น");
  }

  const direct = extractCoords(start);
  if (direct) {
    return { ...direct, name: extractPlaceName(start), url: start.href };
  }

  const resolved = await followShortLink(start);
  const coords = extractCoords(resolved);
  if (!coords) {
    throw new Error(
      "แกะพิกัดจากลิงก์นี้ไม่ได้ ลองเปิดใน Google Maps บนคอมแล้วคัดลอกลิงก์จากแถบที่อยู่ หรือปักหมุดเองบนแผนที่",
    );
  }

  return {
    ...coords,
    name: extractPlaceName(resolved) ?? extractPlaceName(start),
    url: resolved.href,
  };
}
