import { BrandLoader } from "@/components/ui/BrandLoader";

/** ตัวรอโหลดของหน้าเลือกคน เผื่อตอนเปิดแอพครั้งแรกที่ยังไม่มีอะไรอยู่ในแคช */
export default function RootLoading() {
  return (
    <main className="flex flex-1 items-center justify-center px-5 py-12">
      <BrandLoader size={104} />
    </main>
  );
}
