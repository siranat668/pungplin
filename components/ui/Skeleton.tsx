/** แถบเทาเรืองแสงไล่ผ่าน ใช้แทนที่ของจริงตอนข้อมูลยังมาไม่ถึง */
export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`skeleton ${className}`} aria-hidden />;
}

/** โครงร่างของการ์ดบันทึกหนึ่งใบ รูปร่างตรงกับ VisitCard เพื่อไม่ให้หน้ากระตุกตอนของจริงมาแทน */
export function VisitCardSkeleton() {
  return (
    <div className="card space-y-3 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-2/5" />
          <Skeleton className="h-3.5 w-1/3" />
        </div>
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-5 w-20 rounded-full" />
        <Skeleton className="h-5 w-12 rounded-full" />
      </div>
      <Skeleton className="h-3.5 w-4/5" />
    </div>
  );
}
