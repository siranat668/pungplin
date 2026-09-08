export function SetupNotice() {
  return (
    <div className="card space-y-3 p-5">
      <h2 className="text-lg font-bold text-yolk">ยังไม่ได้ต่อฐานข้อมูล</h2>
      <p className="text-sm text-muted">
        แอพขึ้นแล้วแต่ยังไม่รู้จัก Supabase ตั้งค่าสองตัวนี้ให้ครบก่อน แล้ว deploy ใหม่อีกครั้ง
      </p>
      <ul className="space-y-1 text-sm">
        <li>
          <code className="rounded bg-raised px-1.5 py-0.5 text-yolk">SUPABASE_URL</code>
        </li>
        <li>
          <code className="rounded bg-raised px-1.5 py-0.5 text-yolk">
            SUPABASE_SERVICE_ROLE_KEY
          </code>
        </li>
      </ul>
      <p className="text-sm text-muted">
        บนเครื่องตัวเองใส่ในไฟล์ <code className="text-cream">.env.local</code> บน Vercel ใส่ที่
        Project Settings ตรง Environment Variables ห้ามเติม
        <code className="text-cream"> NEXT_PUBLIC_</code> นำหน้าเด็ดขาด
      </p>
    </div>
  );
}
