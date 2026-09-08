import "server-only";

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { headers } from "next/headers";

/**
 * Vercel รัน serverless ทุก request อาจอยู่คนละเครื่อง ตัวนับใน memory จึงใช้ไม่ได้
 * ต้องนับที่ Redis กลาง
 *
 * ถ้ายังไม่ได้ตั้งค่า Upstash ระบบจะข้าม rate limit ไปเงียบๆ แอพยังใช้ได้ปกติ
 * ตั้งใจให้ deploy ครั้งแรกผ่านได้โดยไม่ต้องสมัครบริการเพิ่ม
 */
type Bucket = "write" | "lookup";

const LIMITS: Record<Bucket, { tokens: number; window: `${number} ${"s" | "m"}` }> = {
  write: { tokens: 20, window: "1 m" },
  lookup: { tokens: 30, window: "1 m" },
};

const limiters = new Map<Bucket, Ratelimit | null>();

function getLimiter(bucket: Bucket): Ratelimit | null {
  const existing = limiters.get(bucket);
  if (existing !== undefined) return existing;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    limiters.set(bucket, null);
    return null;
  }

  const limiter = new Ratelimit({
    redis: new Redis({ url, token }),
    limiter: Ratelimit.slidingWindow(LIMITS[bucket].tokens, LIMITS[bucket].window),
    prefix: `pungplin:${bucket}`,
    analytics: false,
  });

  limiters.set(bucket, limiter);
  return limiter;
}

async function clientKey(): Promise<string> {
  const headerList = await headers();
  const forwarded = headerList.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || headerList.get("x-real-ip") || "unknown";
  return ip;
}

/** คืน true ถ้ายิงต่อได้ คืน false ถ้าเกินโควตาแล้ว */
export async function allowRequest(bucket: Bucket): Promise<boolean> {
  const limiter = getLimiter(bucket);
  if (!limiter) return true;

  try {
    const { success } = await limiter.limit(await clientKey());
    return success;
  } catch {
    // Redis ล่มไม่ควรทำให้แอพใช้ไม่ได้ ปล่อยผ่านดีกว่าปิดตาย
    return true;
  }
}
