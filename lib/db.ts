import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "./types";

/**
 * ไคลเอนต์ตัวเดียวของแอพที่คุยกับ Supabase และมันอยู่ฝั่ง server เท่านั้น
 *
 * `import "server-only"` ด้านบนทำให้ build พังทันทีถ้ามีใครเผลอ import ไฟล์นี้
 * จาก client component ซึ่งเป็นวิธีเดียวที่ service_role key จะหลุดออกไปได้
 *
 * key นี้ข้าม RLS ทั้งหมด ทุกตารางจึงเปิด RLS ไว้แบบไม่มี policy เลย
 * แปลว่าถ้ามีคนได้ anon key ของโปรเจกต์ไป ก็ยังยิงเข้าฐานข้อมูลตรงๆ ไม่ได้อยู่ดี
 */
let cached: SupabaseClient<Database> | null = null;

export function db(): SupabaseClient<Database> {
  if (cached) return cached;

  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "ยังไม่ได้ตั้งค่า SUPABASE_URL หรือ SUPABASE_SERVICE_ROLE_KEY ดูตัวอย่างที่ .env.example",
    );
  }

  cached = createClient<Database>(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { "x-application-name": "pungplin" } },
  });

  return cached;
}

export function isDbConfigured(): boolean {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}
