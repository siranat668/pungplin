"use client";

import type { ReactNode } from "react";

import { Modal } from "@/components/ui/Modal";

/** ไอคอนเตือนสีแดง วงกลมข้างหลังเต้นเบาๆ ให้รู้ว่านี่คือการกระทำที่ย้อนกลับยาก */
function WarningMark() {
  return (
    <span className="relative grid h-14 w-14 place-items-center" aria-hidden>
      <span className="loader-halo absolute inset-0 rounded-full bg-heart/25 blur-md" />
      <span className="relative grid h-12 w-12 place-items-center rounded-full bg-heart/12 text-heart ring-1 ring-heart/30">
        <svg viewBox="0 0 24 24" width="26" height="26">
          <path
            d="M12 8.5v5m0 3.2v.3M10.3 3.9 2.6 17.2A1.8 1.8 0 0 0 4.2 20h15.6a1.8 1.8 0 0 0 1.6-2.8L13.7 3.9a1.9 1.9 0 0 0-3.4 0Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    </span>
  );
}

/**
 * กล่องถามยืนยันก่อนทำสิ่งที่ย้อนกลับยาก ใช้แทน window.confirm
 *
 * ตัวปุ่มยืนยันส่งเข้ามาทาง children เพราะแต่ละที่ที่เรียกใช้ต้องการปุ่มไม่เหมือนกัน
 * เช่นปุ่มลบต้องเป็นปุ่ม submit ของฟอร์มที่ผูกกับ server action ของตัวเอง
 */
export function ConfirmDialog({
  open,
  onClose,
  title,
  description,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: ReactNode;
  children: ReactNode;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      icon={<WarningMark />}
    >
      <div className="flex flex-col-reverse gap-2 sm:flex-row">
        <button type="button" onClick={onClose} className="btn btn-secondary flex-1 text-sm">
          ไม่ลบ เก็บไว้
        </button>
        {children}
      </div>
    </Modal>
  );
}
