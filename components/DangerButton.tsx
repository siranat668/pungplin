"use client";

import { useFormStatus } from "react-dom";

function Submit({ label, confirmText }: { label: string; confirmText: string }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      onClick={(event) => {
        if (!window.confirm(confirmText)) event.preventDefault();
      }}
      className="btn btn-ghost px-0 text-sm text-heart hover:text-heart"
    >
      {pending ? "กำลังลบ" : label}
    </button>
  );
}

/**
 * ปุ่มลบ ลบจริงเป็น soft delete ฝั่ง server แถวยังอยู่ในฐานข้อมูล
 * กู้คืนได้ด้วยการเซ็ต deleted_at กลับเป็น null
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
  return (
    <form action={action}>
      <input type="hidden" name={name} value={value} />
      <Submit label={label} confirmText={confirmText} />
    </form>
  );
}
