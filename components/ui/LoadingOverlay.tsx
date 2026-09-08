"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";

import { BrandLoader, LoadingDots } from "@/components/ui/BrandLoader";

/**
 * กล่องรอโหลดที่ขึ้นทับทั้งหน้า ใช้ตอนกำลังบันทึกหรือลบ
 *
 * นอกจากบอกว่าระบบยังทำงานอยู่ มันยังกันการกดซ้ำด้วย เพราะมันคลุมทั้งจอ
 * คนจะกดปุ่มบันทึกรอบสองระหว่างที่รอบแรกยังไม่เสร็จไม่ได้
 *
 * ยิงไปไว้ที่ body ด้วย portal เพื่อให้ position: fixed อ้างจากขอบจอจริงเสมอ
 * ถ้าเรนเดอร์ไว้ในที่เดิม แล้ววันไหนมี element แม่ตัวใดตัวหนึ่งมี transform
 * หรือ backdrop-filter ตัวนั้นจะกลายเป็นกรอบอ้างอิงใหม่ แล้วกล่องนี้จะคลุมไม่เต็มจอ
 *
 * ไม่ต้องมี state คอยเช็คว่า mount แล้วหรือยัง เพราะทุกที่ที่เรียกใช้ส่ง show
 * เป็น false ตอนเรนเดอร์ครั้งแรกอยู่แล้ว ค่ามันจะเป็น true ก็ตอนผู้ใช้กดปุ่ม
 * ซึ่งเกิดหลัง hydrate เสร็จแน่นอน ฝั่ง server กับ client จึงตรงกันตั้งแต่แรก
 */
export function LoadingOverlay({
  show,
  message = "กำลังบันทึก",
}: {
  show: boolean;
  message?: string;
}) {
  // ล็อกการเลื่อนหน้าไว้ตอนกล่องขึ้นทับ ไม่ให้เลื่อนไปเจอส่วนที่กดไม่ได้
  useEffect(() => {
    if (!show) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [show]);

  if (!show || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fade glass fixed inset-0 z-[100] grid place-items-center px-6"
      role="status"
      aria-live="assertive"
      aria-busy="true"
    >
      <div className="pop card flex flex-col items-center gap-3 px-9 py-8">
        <BrandLoader />
        <p className="flex items-center gap-2 font-display font-bold">
          {message}
          <LoadingDots />
        </p>
      </div>
    </div>,
    document.body,
  );
}
