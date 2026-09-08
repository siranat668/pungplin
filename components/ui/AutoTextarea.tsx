"use client";

import { useEffect, useRef, type ComponentPropsWithoutRef } from "react";

/**
 * ช่องข้อความหลายบรรทัดที่ยืดตามเนื้อหา
 *
 * ปิดมือจับลากขยายของเบราว์เซอร์ทิ้ง เพราะมันวาดคนละแบบทุกระบบปฏิบัติการ
 * บน Windows เป็นสามเหลี่ยมทึบ บน Mac เป็นเส้นเฉียงจางๆ บนมือถือไม่มีเลย
 * แทนด้วยการยืดเองตามจำนวนบรรทัดที่พิมพ์ ซึ่งดีกว่าตรงที่ไม่ต้องลากเอง
 */
export function AutoTextarea({
  minRows = 3,
  className = "",
  ...props
}: ComponentPropsWithoutRef<"textarea"> & { minRows?: number }) {
  const ref = useRef<HTMLTextAreaElement>(null);

  function resize(element: HTMLTextAreaElement) {
    element.style.height = "auto";
    element.style.height = `${element.scrollHeight}px`;
  }

  // ตั้งความสูงให้พอดีตั้งแต่แรก เผื่อกรณีที่มี defaultValue ยาวหลายบรรทัดมาแล้ว
  useEffect(() => {
    if (ref.current) resize(ref.current);
  }, []);

  return (
    <textarea
      {...props}
      ref={ref}
      rows={minRows}
      onInput={(event) => resize(event.currentTarget)}
      className={`field-input resize-none overflow-hidden ${className}`}
    />
  );
}
