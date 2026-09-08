import { z } from "zod";

import { PEOPLE, RATING_CATEGORIES } from "./constants";
import { isGoogleMapsUrl } from "./google-maps";

/** ช่องข้อความที่ปล่อยว่างได้ ค่าว่างเก็บลงฐานเป็น null ไม่ใช่สตริงว่าง */
function optionalText(max: number, tooLong: string) {
  return z.preprocess(
    (raw) => {
      if (typeof raw !== "string") return null;
      const trimmed = raw.trim();
      return trimmed === "" ? null : trimmed;
    },
    z.string().max(max, tooLong).nullable(),
  );
}

function optionalNumber(min: number, max: number, message: string) {
  return z.preprocess(
    (raw) => {
      if (raw === null || raw === undefined) return null;
      const trimmed = String(raw).trim();
      if (trimmed === "") return null;
      return Number(trimmed);
    },
    z.number(message).min(min, message).max(max, message).nullable(),
  );
}

/**
 * ยังไม่ได้กดหัวใจเลย = ไม่มีคีย์นั้นใน FormData ต้องแปลงเป็น undefined
 * เพื่อให้ zod ขึ้น error ว่า "ให้คะแนนหัวข้อนี้ด้วย" แทนข้อความ NaN ภาษาอังกฤษ
 */
const heart = z.preprocess(
  (raw) => {
    if (raw === null || raw === undefined || raw === "") return undefined;
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : undefined;
  },
  z
    .number("ให้คะแนนหัวข้อนี้ด้วย")
    .int("คะแนนต้องเป็นจำนวนเต็ม")
    .min(1, "ให้อย่างน้อย 1 ดวง")
    .max(5, "เต็ม 5 ดวง"),
);

export const personSchema = z.enum(PEOPLE, "ต้องเลือกว่าเป็นมุกหรือเบย์");

const googleUrl = z.preprocess(
  (raw) => {
    if (typeof raw !== "string") return null;
    const trimmed = raw.trim();
    return trimmed === "" ? null : trimmed;
  },
  z
    .string()
    .max(2000, "ลิงก์ยาวเกินไป")
    .refine(isGoogleMapsUrl, "ต้องเป็นลิงก์ Google Maps แบบ https เท่านั้น")
    .nullable(),
);

export const ratingSchema = z.object({
  taste: heart,
  value: heart,
  ambience: heart,
  service: heart,
  cleanliness: heart,
  comment: optionalText(4000, "ความเห็นยาวเกิน 4000 ตัวอักษร"),
});

export type RatingInput = z.infer<typeof ratingSchema>;

export const restaurantSchema = z.object({
  name: z
    .string("ใส่ชื่อร้านด้วย")
    .trim()
    .min(1, "ใส่ชื่อร้านด้วย")
    .max(200, "ชื่อร้านยาวเกิน 200 ตัวอักษร"),
  address: optionalText(500, "ที่อยู่ยาวเกิน 500 ตัวอักษร"),
  category: optionalText(60, "ประเภทอาหารยาวเกิน 60 ตัวอักษร"),
  lat: optionalNumber(-90, 90, "พิกัดละติจูดไม่ถูกต้อง"),
  lng: optionalNumber(-180, 180, "พิกัดลองจิจูดไม่ถูกต้อง"),
  google_url: googleUrl,
  price_level: optionalNumber(1, 4, "ระดับราคาไม่ถูกต้อง"),
});

export type RestaurantInput = z.infer<typeof restaurantSchema>;

const visitCore = z.object({
  visited_on: z
    .string("เลือกวันที่ไปกินด้วย")
    .regex(/^\d{4}-\d{2}-\d{2}$/, "รูปแบบวันที่ไม่ถูกต้อง")
    .refine((value) => !Number.isNaN(Date.parse(value)), "ไม่มีวันที่นี้อยู่จริง")
    .refine(
      (value) => new Date(`${value}T00:00:00Z`).getTime() <= Date.now() + 86_400_000,
      "ยังไปกินในอนาคตไม่ได้นะ",
    ),
  note: optionalText(4000, "บันทึกยาวเกิน 4000 ตัวอักษร"),
});

/** ฟอร์มเพิ่มบันทึกใหม่ เลือกได้ว่าผูกกับร้านเดิมหรือสร้างร้านใหม่ไปพร้อมกัน */
export const createVisitSchema = z.discriminatedUnion("mode", [
  z.object({
    mode: z.literal("existing"),
    restaurant_id: z.uuid("เลือกร้านจากรายการด้วย"),
    ...visitCore.shape,
    ...ratingSchema.shape,
  }),
  z.object({
    mode: z.literal("new"),
    ...restaurantSchema.shape,
    ...visitCore.shape,
    ...ratingSchema.shape,
  }),
]);

export type CreateVisitInput = z.infer<typeof createVisitSchema>;

export const updateVisitSchema = z.object({
  visit_id: z.uuid(),
  ...visitCore.shape,
});

export const upsertRatingSchema = z.object({
  visit_id: z.uuid(),
  ...ratingSchema.shape,
});

export const updateRestaurantSchema = z.object({
  restaurant_id: z.uuid(),
  ...restaurantSchema.shape,
});

export const idSchema = z.object({ id: z.uuid() });

export const geocodeQuerySchema = z
  .string()
  .trim()
  .min(3, "พิมพ์อย่างน้อย 3 ตัวอักษร")
  .max(160, "คำค้นยาวเกินไป");

export const resolveGoogleSchema = z.object({
  url: z.string().trim().min(1, "วางลิงก์ก่อน").max(2000, "ลิงก์ยาวเกินไป"),
});

/** แปลง FormData เป็นออบเจกต์ธรรมดาให้ zod ตรวจต่อ */
export function formDataToObject(formData: FormData): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    if (typeof value === "string") result[key] = value;
  }
  return result;
}

/** ยุบ error ของ zod ให้เหลือข้อความเดียวต่อหนึ่งช่อง เพื่อโชว์ใต้ input */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const result: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "form";
    if (!result[key]) result[key] = issue.message;
  }
  return result;
}

export const RATING_KEYS = RATING_CATEGORIES.map((category) => category.key);
