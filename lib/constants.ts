export const PEOPLE = ["mook", "bay"] as const;
export type Person = (typeof PEOPLE)[number];

export const PERSON_LABEL: Record<Person, string> = {
  mook: "มุก",
  bay: "เบย์",
};

/** สีประจำตัวใช้แยกฝั่งคะแนนในหน้ารายละเอียด ดึงมาจากพาเลตต์โลโก้ */
export const PERSON_ACCENT: Record<Person, string> = {
  mook: "var(--color-bubble)",
  bay: "var(--color-yolk)",
};

export function otherPerson(person: Person): Person {
  return person === "mook" ? "bay" : "mook";
}

export function isPerson(value: unknown): value is Person {
  return typeof value === "string" && (PEOPLE as readonly string[]).includes(value);
}

export const RATING_CATEGORIES = [
  { key: "taste", label: "รสชาติ" },
  { key: "value", label: "ความคุ้มราคา" },
  { key: "ambience", label: "บรรยากาศ" },
  { key: "service", label: "บริการ" },
  { key: "cleanliness", label: "ความสะอาด" },
] as const;

export type RatingKey = (typeof RATING_CATEGORIES)[number]["key"];

export const PRICE_LEVELS = [
  { value: 1, label: "฿", hint: "ไม่เกิน 150 ต่อคน" },
  { value: 2, label: "฿฿", hint: "150 - 400 ต่อคน" },
  { value: 3, label: "฿฿฿", hint: "400 - 1000 ต่อคน" },
  { value: 4, label: "฿฿฿฿", hint: "เกิน 1000 ต่อคน" },
] as const;

/** ตัวเลือกสำเร็จรูปในช่องประเภทอาหาร ยังพิมพ์เองได้อิสระ */
export const CUISINE_SUGGESTIONS = [
  "ตามสั่ง",
  "อีสาน",
  "ก๋วยเตี๋ยว",
  "หมูกระทะ",
  "ชาบู",
  "ปิ้งย่าง",
  "ซีฟู้ด",
  "ญี่ปุ่น",
  "เกาหลี",
  "จีน",
  "อิตาเลียน",
  "สเต๊ก",
  "คาเฟ่",
  "ของหวาน",
  "บุฟเฟต์",
  "สตรีทฟู้ด",
];

/** กรุงเทพเป็นจุดเริ่มต้นของแผนที่เมื่อยังไม่มีหมุด */
export const DEFAULT_MAP_CENTER = { lat: 13.7563, lng: 100.5018 };

/**
 * tile ของ OpenStreetMap ใช้ฟรี ไม่ต้องมี API key ไม่ต้องผูกบัตร
 * จึงไม่มีทางเจอบิลบานปลายแบบ Google Maps
 *
 * โดเมนนี้ต้องตรงกับที่อนุญาตไว้ใน img-src ของ CSP ในไฟล์ proxy.ts
 * ถ้าย้ายไปใช้ tile เจ้าอื่น ต้องไปแก้ที่นั่นด้วยไม่งั้นแผนที่จะขึ้นเป็นสีเทาเปล่าๆ
 */
export const OSM_TILE_URL = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
