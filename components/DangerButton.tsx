"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";

import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { LoadingOverlay } from "@/components/ui/LoadingOverlay";
import { SubmitButton } from "@/components/ui/SubmitButton";

/** อยู่ในฟอร์มเพื่อให้ useFormStatus อ่านสถานะของฟอร์มนั้นได้ */
function DeleteSubmit() {
  const { pending } = useFormStatus();

  return (
    <>
      <SubmitButton variant="danger" pendingLabel="กำลังลบ" className="w-full text-sm">
        ลบเลย
      </SubmitButton>
      <LoadingOverlay show={pending} message="กำลังลบ" />
    </>
  );
}

/**
 * ปุ่มลบ ลบจริงเป็น soft delete ฝั่ง server แถวยังอยู่ในฐานข้อมูล
 * กู้คืนได้ด้วยการเซ็ต deleted_at กลับเป็น null
 *
 * เดิมใช้ window.confirm ซึ่งหน้าตาต่างกันทุกเครื่องและแต่งไม่ได้เลย
 * เปลี่ยนมาใช้กล่องยืนยันที่เขียนเองใน components/ui/ConfirmDialog.tsx
 */
export function DangerButton({
  action,
  name,
  value,
  label,
  confirmText,
}: {
  action: (formData: FormData) => Promise<void>;
  name: string;
  value: string;
  label: string;
  confirmText: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="btn btn-ghost gap-1.5 px-0 text-sm text-heart hover:text-heart"
      >
        <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden>
          <path
            d="M4 7h16M9 7V4h6v3m-8 0 1 13h8l1-13M10 11v6M14 11v6"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        {label}
      </button>

      <ConfirmDialog
        open={open}
        onClose={() => setOpen(false)}
        title={label}
        description={confirmText}
      >
        <form action={action} className="flex-1">
          <input type="hidden" name={name} value={value} />
          <DeleteSubmit />
        </form>
      </ConfirmDialog>
    </>
  );
}
