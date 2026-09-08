import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex flex-1 items-center justify-center px-5 py-16">
      <div className="card max-w-md p-6 text-center">
        <h1 className="text-xl font-bold text-yolk">ไม่เจอหน้านี้</h1>
        <p className="mt-2 text-sm text-muted">
          บันทึกหรือร้านที่หาอาจถูกลบไปแล้ว หรือลิงก์พิมพ์ผิด
        </p>
        <Link href="/feed" className="btn btn-primary mt-5">
          กลับไปหน้าบันทึก
        </Link>
      </div>
    </main>
  );
}
