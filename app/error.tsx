"use client";

import { useEffect } from "react";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex flex-1 items-center justify-center px-5 py-16">
      <div className="card max-w-md p-6 text-center">
        <h1 className="text-xl font-bold text-heart">มีอะไรพัง</h1>
        <p className="mt-2 text-sm text-muted">
          ส่วนใหญ่เกิดจากต่อฐานข้อมูลไม่ได้ ลองใหม่อีกครั้ง ถ้ายังไม่หายให้เช็คว่า Supabase
          ยังไม่ถูกหยุดโปรเจกต์และค่า environment variables ครบ
        </p>
        {error.digest ? (
          <p className="mt-3 text-xs text-muted">รหัสอ้างอิง {error.digest}</p>
        ) : null}
        <button type="button" onClick={reset} className="btn btn-primary mt-5">
          ลองใหม่
        </button>
      </div>
    </main>
  );
}
