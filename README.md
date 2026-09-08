# พุงปลิ้น

สมุดบันทึกร้านอาหารของมุกกับเบย์ ปักหมุดบนแผนที่หรือแนบลิงก์ Google Maps
ให้คะแนน 5 หัวข้อเป็นหัวใจ 1-5 ดวง แยกชุดคนละคนต่อการไปกินหนึ่งครั้ง

Next.js 16 (App Router) + Supabase Postgres + OpenLayers กับ OpenStreetMap deploy บน Vercel

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
   - API Keys -> Secret keys (ค่าขึ้นต้นด้วย `sb_secret_` โปรเจกต์เก่าจะเรียกว่า `service_role`)

   Publishable key (`sb_publishable_`) ไม่ต้องใช้ แอพนี้ไม่เคยคุยกับ Supabase จากฝั่งเบราว์เซอร์

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

**ลิงก์ Google Maps ให้ได้แค่พิกัด ชื่อร้าน และที่อยู่** ไม่มีรูปหน้าร้าน
หน้าเว็บของ Google ส่ง `og:image` มาเป็นภาพแผนที่กลางๆ ที่ผูกกับ API key ของ Google เอง
และ `og:title` เป็นคำว่า "Google Maps" เฉยๆ จะได้รูปจริงต้องใช้ Places API ที่คิดเงินรายครั้ง
เลยใช้ภาพแผนที่จาก OpenStreetMap เป็นภาพประกอบร้านแทน ดู [components/MapThumb.tsx](components/MapThumb.tsx)
ส่วนที่อยู่ได้มาจากการถาม Nominatim ย้อนพิกัด ไม่ได้มาจาก Google

**หน้าใหม่ที่มี component ฝั่ง client ต้องเป็น dynamic** CSP ของแอพใช้ nonce ที่สุ่มใหม่ทุก request
หน้าที่ Next.js เอาไป prerender เป็น static ตอน build จะไม่มี nonce ติดใน HTML แล้วสคริปต์
ฝั่ง client ของหน้านั้นจะถูกบล็อกเงียบๆ ทั้งหมด ตอนนี้ทุกหน้าอ่านคุกกี้ผู้ใช้อยู่แล้วจึงเป็น dynamic หมด
ถ้าเพิ่มหน้าที่ไม่แตะข้อมูลผู้ใช้ ต้องใส่ `export const dynamic = "force-dynamic"` ให้หน้านั้นด้วย

**ห้ามใช้ `next/image`** มันเป็น client component ที่ Next.js ปล่อย `<script async>` ของตัวเอง
ออกมาโดยไม่ติด nonce แล้ว CSP ที่ตั้ง `strict-dynamic` ไว้ก็บล็อกทุกครั้งที่เปิดหน้า
โลโก้จึงย่อไว้ล่วงหน้าสองขนาดแล้วแสดงด้วย `<img>` ธรรมดา ดู `LOGO_SMALL` กับ `LOGO_LARGE`
ใน [lib/constants.ts](lib/constants.ts)

## UI ที่เขียนเองแทนของเบราว์เซอร์

control ของเบราว์เซอร์หน้าตาและพฤติกรรมต่างกันทุกเครื่อง ปฏิทินของ Chrome บน Windows
ไม่เหมือน Safari บน Mac ส่วน `select` บน iOS เด้งเป็นวงล้อขึ้นมาจากด้านล่างจอ
และแต่งด้วย CSS ไม่ได้เลยเพราะระบบปฏิบัติการเป็นคนวาด ของพวกนี้จึงเขียนเองทั้งหมด
อยู่ใน `components/ui/` แต่ละไฟล์เขียนเหตุผลกำกับไว้ว่ามาแทนอะไรและทำไม

| ของเดิม | ใช้แทนด้วย |
| --- | --- |
| `<select>` | [Select.tsx](components/ui/Select.tsx) |
| `<input type="date">` | [DatePicker.tsx](components/ui/DatePicker.tsx) ขึ้นปฏิทินไทยพร้อม พ.ศ. เหมือนกันทุกเครื่อง |
| `<datalist>` | [Combobox.tsx](components/ui/Combobox.tsx) |
| `window.confirm` | [ConfirmDialog.tsx](components/ui/ConfirmDialog.tsx) บน [Modal.tsx](components/ui/Modal.tsx) |
| `<details>` กับ `<summary>` | [Disclosure.tsx](components/ui/Disclosure.tsx) |
| attribute `title` | [Tooltip.tsx](components/ui/Tooltip.tsx) |
| มือจับลากขยาย `<textarea>` | [AutoTextarea.tsx](components/ui/AutoTextarea.tsx) ยืดตามเนื้อหาเอง |

ทุกตัวยังส่งค่าไปกับฟอร์มด้วย `<input type="hidden">` หรือ input จริงที่ซ่อนไว้
ฝั่ง server action จึงอ่านค่าได้เหมือนเดิมไม่ต้องแก้อะไร และรองรับคีย์บอร์ดครบ
ทั้งลูกศร Enter Escape Home End

**เพิ่ม dropdown ในกล่องที่ยืดหุบได้ต้องระวัง** [Disclosure.tsx](components/ui/Disclosure.tsx)
ยืดหุบด้วย `grid-template-rows` ซึ่งต้องมี `overflow: hidden` ตอนกำลังขยับ
มันจะเลิกตัดขอบให้เองเมื่อยืดสุดแล้ว ไม่งั้นแถวล่างของปฏิทินข้างในจะถูกเฉือนหาย

## ระบบการเคลื่อนไหว

keyframes กับค่า easing รวมไว้ใน [app/globals.css](app/globals.css) ที่เดียว
ทุก transition อ้าง `--ease-out`, `--ease-spring` กับ `--dur-*` จากตรงนั้น
ของจะได้ขยับด้วยจังหวะเดียวกันหมดทั้งแอพ

ทุกจุดที่ต้องรอมีตัวบอกสถานะที่ทำจากโลโก้ ([BrandLoader.tsx](components/ui/BrandLoader.tsx))
งานที่เขียนข้อมูลจะขึ้นกล่องคลุมทั้งจอ ([LoadingOverlay.tsx](components/ui/LoadingOverlay.tsx))
ซึ่งกันการกดซ้ำไปด้วย ส่วนงานที่แค่อ่านข้อมูลจะวางตัวโหลดหรือโครงร่างไว้ตรงที่ผลจะโผล่
หน้าไม่กระตุกตอนของจริงมาแทน และการเปลี่ยนหน้ามี [app/(app)/loading.tsx](app/(app)/loading.tsx) รับไว้

`@media (prefers-reduced-motion: reduce)` ตัดการเคลื่อนไหวทั้งหมดให้เหลือ 1ms
เว้นวงแหวนที่หมุนรอโหลดซึ่งเป็นข้อมูลไม่ใช่ของประดับ ที่สำคัญคือห้ามเขียน `animation: none`
เพราะของที่ใช้ `both` จะค้างที่เฟรมแรกซึ่ง `opacity` เป็น 0 แล้วหน้าจะว่างเปล่า

## คำสั่ง

```bash
npm run dev     # โหมดพัฒนา
npm run build   # build พร้อม typecheck
npm run start   # รัน build ที่ได้
npx eslint .    # ตรวจ lint
```
