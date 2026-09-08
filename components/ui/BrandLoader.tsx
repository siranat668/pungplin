import { LOGO_SMALL } from "@/lib/constants";

/**
 * ตัวรอโหลดตัวใหญ่ ทำจากโลโก้ของแอพ
 *
 * ประกอบจากสามชั้น: แสงเรืองที่เต้นอยู่ข้างหลัง, วงแหวนสองเส้นสีเหลืองกับชมพู
 * ที่วิ่งไล่กันเป็นวงกลม และโลโก้ที่ลอยขึ้นลงเบาๆ อยู่ตรงกลาง
 *
 * วงแหวนวาดด้วย SVG ไม่ได้ใช้ conic-gradient กับ mask เพราะสองอย่างนั้น
 * ยังมีปัญหาบนเบราว์เซอร์เก่าบางตัว และตั้งใจไม่ใช้ gradient ที่ต้องมี id
 * เพราะถ้าวางตัวโหลดสองตัวในหน้าเดียวกัน id จะซ้ำซึ่งเป็น HTML ที่ไม่ถูกต้อง
 */
export function BrandLoader({ size = 88 }: { size?: number }) {
  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <div
        className="loader-halo absolute inset-0 rounded-full blur-xl"
        style={{
          background:
            "radial-gradient(circle, rgba(255,200,0,0.55) 0%, rgba(255,111,168,0.35) 55%, transparent 72%)",
        }}
        aria-hidden
      />

      <svg viewBox="0 0 100 100" className="loader-ring absolute inset-0 h-full w-full" aria-hidden>
        <circle cx="50" cy="50" r="46" fill="none" stroke="var(--color-line)" strokeWidth="2.5" />
        {/* เส้นรอบวงยาว 2 * pi * 46 ประมาณ 289 หน่วย ตัวเลข dasharray จึงคิดจากค่านี้ */}
        <circle
          cx="50"
          cy="50"
          r="46"
          fill="none"
          stroke="#ffc800"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray="74 215"
        />
        <circle
          cx="50"
          cy="50"
          r="46"
          fill="none"
          stroke="#ff6fa8"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray="30 259"
          strokeDashoffset="-88"
        />
      </svg>

      {/* ใช้ img ธรรมดาไม่ใช่ next/image ดูเหตุผลที่ LOGO_SMALL ใน lib/constants.ts */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={LOGO_SMALL}
        alt=""
        width={192}
        height={192}
        className="loader-mark relative object-contain drop-shadow-sm"
        style={{ width: size * 0.6, height: size * 0.6 }}
      />
    </div>
  );
}

/** จุดสามจุดเต้นไล่กัน ใช้ต่อท้ายข้อความว่ากำลังทำอะไรอยู่ */
export function LoadingDots() {
  return (
    <span className="inline-flex items-end gap-1 pb-1" aria-hidden>
      <span className="loader-dot h-1.5 w-1.5 rounded-full bg-yolk-deep" />
      <span className="loader-dot h-1.5 w-1.5 rounded-full bg-bubble-deep" />
      <span className="loader-dot h-1.5 w-1.5 rounded-full bg-yolk-deep" />
    </span>
  );
}
