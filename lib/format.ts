/**
 * วันที่ทั้งหมดในแอพเก็บเป็น date ล้วน (YYYY-MM-DD) ไม่มีเวลา
 * จึงต้องฟอร์แมตด้วย timeZone UTC ตายตัว ไม่งั้นเครื่องที่อยู่คนละโซนเวลา
 * จะเรนเดอร์ได้วันไม่ตรงกันระหว่าง server กับ browser แล้ว hydration พัง
 */
const longThaiDate = new Intl.DateTimeFormat("th-TH", {
  dateStyle: "long",
  timeZone: "UTC",
});

const shortThaiDate = new Intl.DateTimeFormat("th-TH", {
  day: "numeric",
  month: "short",
  year: "2-digit",
  timeZone: "UTC",
});

function toDate(isoDate: string): Date {
  return new Date(`${isoDate}T00:00:00Z`);
}

export function formatDateLong(isoDate: string): string {
  return longThaiDate.format(toDate(isoDate));
}

export function formatDateShort(isoDate: string): string {
  return shortThaiDate.format(toDate(isoDate));
}

/** วันนี้ในรูปแบบ YYYY-MM-DD ตามเวลาไทย ใช้เป็นค่าเริ่มต้นของช่องวันที่ */
export function todayInBangkok(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}
