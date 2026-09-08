import type { ReactNode } from "react";

/**
 * ป้ายคำอธิบายที่โผล่ตอนเอาเมาส์ไปชี้ ใช้แทน attribute title
 *
 * title ของเบราว์เซอร์มีปัญหาสามอย่าง: ต้องจ่อเมาส์ค้างไว้ราวสองวินาทีก่อนจะขึ้น
 * ซึ่งช้ากว่าที่คนจะรอ, หน้าตาเป็นของระบบปฏิบัติการจึงแต่งไม่ได้และไม่เหมือนกัน
 * ทุกเครื่อง, และบนมือถือไม่มีทางเห็นเลยเพราะไม่มีการเอาเมาส์ไปชี้
 *
 * ตัวนี้ทำด้วย CSS ล้วน ไม่มี state จึงยังเป็น server component ได้
 * ขึ้นทั้งตอนชี้ด้วยเมาส์และตอนโฟกัสด้วยคีย์บอร์ด
 */
export function Tooltip({ label, children }: { label: string; children: ReactNode }) {
  return (
    <span className="group relative inline-flex">
      {children}
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 z-40 mb-2 -translate-x-1/2 translate-y-1 scale-95 rounded-lg bg-ink px-2 py-1 text-xs font-normal whitespace-nowrap text-page opacity-0 shadow-lg transition-all duration-200 ease-out group-hover:translate-y-0 group-hover:scale-100 group-hover:opacity-100 group-focus-within:translate-y-0 group-focus-within:scale-100 group-focus-within:opacity-100"
      >
        {label}
      </span>
    </span>
  );
}
