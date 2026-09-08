"use client";

import { useId, useState, type ReactNode } from "react";

/**
 * หัวข้อพับเก็บได้ ใช้แทน details กับ summary
 *
 * details ของเบราว์เซอร์วาดสามเหลี่ยมนำหน้าหัวข้อมาให้เอง ซึ่งรูปร่างและขนาด
 * ไม่เหมือนกันแต่ละเบราว์เซอร์ ซ่อนก็ยาก และเปิดปิดแบบกระตุกทันทีไม่มีจังหวะ
 *
 * ตัวนี้ยืดหุบด้วย grid-template-rows จาก 0fr ไป 1fr ซึ่งเป็นวิธีที่ทำให้ CSS
 * ค่อยๆ ไล่ความสูงจริงของเนื้อหาให้เองได้ ไม่ต้องวัดความสูงด้วย JavaScript
 * แล้วมาคอยตั้ง max-height ซึ่งจะเพี้ยนทุกครั้งที่เนื้อหาข้างในเปลี่ยนขนาด
 */
export function Disclosure({
  title,
  children,
  className = "",
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  /**
   * ตัดขอบเนื้อหาไว้หรือไม่
   *
   * ตอนยืดหุบต้องตัด ไม่งั้นเนื้อหาจะโพล่ทะลุกล่องออกมาให้เห็นทั้งก้อน
   * แต่พอยืดสุดแล้วต้องเลิกตัด เพราะข้างในมีปฏิทินกับเมนูที่กางเลยขอบกล่องลงไป
   * ถ้ายังตัดอยู่ แถวล่างสุดของปฏิทินจะถูกเฉือนหายไปแบบที่กดไม่ได้เลย
   */
  const [clip, setClip] = useState(true);
  const panelId = useId();

  return (
    <div className={className}>
      <button
        type="button"
        onClick={() => {
          setClip(true);
          setOpen((current) => !current);
        }}
        aria-expanded={open}
        aria-controls={panelId}
        className="flex w-full items-center justify-between gap-3 text-left font-bold"
      >
        {title}
        <svg
          viewBox="0 0 24 24"
          width="18"
          height="18"
          aria-hidden
          className="shrink-0 text-muted transition-transform duration-300 ease-out"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
        >
          <path
            d="m6 9 6 6 6-6"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      <div
        className="grid transition-[grid-template-rows] duration-300 ease-out"
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
        onTransitionEnd={(event) => {
          if (event.propertyName === "grid-template-rows" && open) setClip(false);
        }}
      >
        {/* เนื้อหายังอยู่ใน DOM ตอนหุบเพื่อให้ยืดหุบได้ลื่น แต่ต้องกั้นด้วย inert
            ไม่งั้นกด Tab จะหลุดไปโฟกัสช่องกรอกที่มองไม่เห็นซึ่งชวนสับสนมาก */}
        <div id={panelId} inert={!open} className={clip ? "overflow-hidden" : ""}>
          <div className="pt-4">{children}</div>
        </div>
      </div>
    </div>
  );
}
