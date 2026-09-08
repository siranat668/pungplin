"use client";

import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";

import { Spinner } from "@/components/ui/Spinner";

/**
 * ปุ่มส่งฟอร์มที่มีตัวหมุนอยู่ในตัว
 *
 * ถ้าไม่ส่ง pending มา มันจะไปถาม useFormStatus เอาสถานะของฟอร์มที่มันอยู่ข้างใน
 * ส่วนฟอร์มที่ใช้ useActionState อยู่แล้วก็ส่ง pending ที่มีเข้ามาได้ตรงๆ
 * เรียกนอกฟอร์มก็ไม่พัง useFormStatus จะคืน pending เป็น false เฉยๆ
 */
export function SubmitButton({
  children,
  pendingLabel,
  pending,
  variant = "primary",
  className = "",
}: {
  children: ReactNode;
  pendingLabel: string;
  pending?: boolean;
  variant?: "primary" | "secondary" | "danger";
  className?: string;
}) {
  const status = useFormStatus();
  const busy = pending ?? status.pending;

  return (
    <button
      type="submit"
      disabled={busy}
      aria-busy={busy}
      className={`btn btn-${variant} ${className}`}
    >
      {busy ? (
        <>
          <Spinner size={17} />
          {pendingLabel}
        </>
      ) : (
        children
      )}
    </button>
  );
}
