import { BrandLoader, LoadingDots } from "@/components/ui/BrandLoader";

/**
 * หน้าที่ Next.js เอามาแสดงระหว่างที่ยังไปเอาข้อมูลของหน้าถัดไปไม่เสร็จ
 *
 * ครอบทุกหน้าในกลุ่ม (app) จึงได้ทั้งตอนกดลิงก์ในแอพและตอนโหลดหน้าใหม่ทั้งหน้า
 * ไม่ต้องไปใส่ทีละหน้า และเป็นเหตุผลที่การกดลิงก์ในแอพไม่มีจังหวะที่จอค้างเปล่าๆ
 */
export default function AppLoading() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
      <BrandLoader size={96} />
      <p className="flex items-center gap-2 text-sm text-muted">
        กำลังโหลด
        <LoadingDots />
      </p>
    </div>
  );
}
