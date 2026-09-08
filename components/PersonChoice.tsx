"use client";

import { useFormStatus } from "react-dom";

import { LoadingOverlay } from "@/components/ui/LoadingOverlay";
import { PERSON_LABEL, type Person } from "@/lib/constants";

const PERSON_STYLE: Record<Person, string> = {
  mook: "bg-bubble text-ink shadow-[0_6px_18px_-8px_rgba(194,24,91,0.7)]",
  bay: "bg-yolk text-ink shadow-[0_6px_18px_-8px_rgba(156,107,0,0.7)]",
};

/**
 * ปุ่มเลือกว่าวันนี้ใครเป็นคนจด
 *
 * แยกออกมาเป็น client component เพราะต้องอ่าน useFormStatus ซึ่งใช้ได้เฉพาะ
 * ใน component ที่อยู่ข้างในฟอร์ม การเลือกคนจะพาไปหน้าถัดไปเลย ระหว่างรอ
 * จึงต้องมีอะไรบอกว่ากดติดแล้ว ไม่ใช่ปล่อยให้กดซ้ำเพราะคิดว่าปุ่มไม่ทำงาน
 */
export function PersonChoice({ person }: { person: Person }) {
  const { pending } = useFormStatus();

  return (
    <>
      <button
        type="submit"
        disabled={pending}
        className={`btn w-full py-4 text-xl ${PERSON_STYLE[person]}`}
      >
        {PERSON_LABEL[person]}
      </button>

      <LoadingOverlay show={pending} message={`เข้าเป็น${PERSON_LABEL[person]}`} />
    </>
  );
}
