# พุงปลิ้น

สมุดบันทึกร้านอาหารของมุกกับเบย์ ปักหมุดบนแผนที่หรือแนบลิงก์ Google Maps
ให้คะแนน 5 หัวข้อเป็นหัวใจ 1-5 ดวง แยกชุดคนละคนต่อการไปกินหนึ่งครั้ง

Next.js 16 (App Router) + Supabase Postgres + MapLibre กับ OpenStreetMap deploy บน Vercel

## สถาปัตยกรรมสำคัญ

เบราว์เซอร์ไม่เคยคุยกับ Supabase โดยตรง ทุกอย่างวิ่งผ่าน Server Actions และ Route Handlers
ที่รันบน server ของ Vercel แล้วใช้ `service_role` key ซึ่งเก็บใน environment variable ฝั่ง server
เท่านั้น ส่วนตารางทั้งหมดเปิด Row Level Security ไว้แบบไม่มี policy เลย

ผลคือถ้ามีใครได้ anon key ของโปรเจกต์ไป ก็ยิงเข้าฐานข้อมูลตรงๆ ไม่ได้อยู่ดี เพราะ RLS ปฏิเสธหมด
และ `service_role` key ก็ไม่เคยถูกส่งไปฝั่งเบราว์เซอร์ ไฟล์ `lib/db.ts` มี `import "server-only"`
กำกับไว้ ถ้ามีใครเผลอ import จาก client component build จะพังทันที

## ตั้งค่าครั้งแรก

### 1. Supabase

1. สร้างโปรเจกต์ใหม่ที่ [supabase.com](https://supabase.com) เลือก region Singapore จะเร็วที่สุดจากไทย
2. เปิด SQL Editor แล้วรันไฟล์ [supabase/migrations/0001_init.sql](supabase/migrations/0001_init.sql) ทั้งไฟล์
3. ไปที่ Project Settings เก็บสองค่านี้ไว้
   - Data API -> Project URL
   - API Keys -> `service_role` (กดเปิดดูค่า)

### 2. รันบนเครื่องตัวเอง

```bash
npm install
cp .env.example .env.local   # แล้วใส่ค่าจริงลงไป
npm run dev
```

เปิด http://localhost:3000

### 3. Deploy บน Vercel

1. Import repo นี้ที่ [vercel.com/new](https://vercel.com/new)
2. ใส่ Environment Variables ก่อนกด Deploy
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
3. กด Deploy

ห้ามเติม `NEXT_PUBLIC_` นำหน้าตัวแปรพวกนี้เด็ดขาด เพราะ Next.js จะฝังค่าลงใน JavaScript
ที่ส่งไปให้เบราว์เซอร์ แล้ว key ที่ข้าม RLS ได้ก็จะหลุดสู่สาธารณะ

### 4. ตัวเลือกเสริม

| ตัวแปร | ทำอะไร | ไม่ใส่แล้วเป็นอย่างไร |
| --- | --- | --- |
| `UPSTASH_REDIS_REST_URL` กับ `UPSTASH_REDIS_REST_TOKEN` | จำกัดจำนวนครั้งที่เขียนและค้นหาต่อนาที | ระบบข้าม rate limit ไปเฉยๆ แอพยังใช้ได้ปกติ |
| `CRON_SECRET` | ให้ Vercel Cron พิสูจน์ตัวตนตอนเรียก `/api/cron/keepalive` | endpoint เปิดให้เรียกได้ ซึ่งไม่อันตรายเพราะมันแค่นับแถว |

### 5. สำรองข้อมูล

Supabase free tier ไม่มี backup อัตโนมัติ ถ้าข้อมูลหายคือหายถาวร
ในโปรเจกต์มี GitHub Action ที่ดัมป์ฐานข้อมูลทุกคืนอยู่แล้วที่
[.github/workflows/backup.yml](.github/workflows/backup.yml)
เปิดใช้โดยตั้ง secret ชื่อ `SUPABASE_DB_URL` ที่ Settings -> Secrets and variables -> Actions
ค่าเอามาจาก Supabase -> Project Settings -> Database -> Connection string

## เรื่องที่ควรรู้

**ไม่มีระบบล็อกอิน** ตอนเข้าแอพแค่คลิกเลือกว่าเป็นมุกหรือเบย์ ค่านั้นเก็บในคุกกี้เพื่อติดป้าย
เจ้าของบันทึกเท่านั้น ใครมี URL ก็เข้ามาอ่านและแก้ได้ทั้งหมด สิ่งที่ทำไว้กันคือใส่ `noindex`
ไม่ให้ Google เก็บ index และลบทุกอย่างเป็น soft delete แถวยังอยู่ในฐานข้อมูล กู้คืนได้ด้วย

```sql
update visits set deleted_at = null where id = '...';
```

**ถ้าอยากกันคนนอกทีหลัง** แก้ไฟล์เดียวคือ [proxy.ts](proxy.ts) เพิ่มการตรวจคุกกี้ passcode
แล้ว redirect ไปหน้าใส่รหัส เพราะเบราว์เซอร์ไม่ได้ถือ key อะไรอยู่แล้ว การกันที่ขอบแอพจึงกันได้จริง

**Supabase free tier หยุดโปรเจกต์** ถ้าไม่มี request เข้าฐานข้อมูลเลย 7 วัน
[vercel.json](vercel.json) ตั้ง cron ให้เรียก `/api/cron/keepalive` วันละครั้งเพื่อกันเรื่องนี้

## คำสั่ง

```bash
npm run dev     # โหมดพัฒนา
npm run build   # build พร้อม typecheck
npm run start   # รัน build ที่ได้
npx eslint .    # ตรวจ lint
```
