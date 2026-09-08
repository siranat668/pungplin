/**
 * ตัวหมุนขนาดเล็กสำหรับใส่ในปุ่มหรือข้างข้อความ
 *
 * ใช้ currentColor ทั้งวง เอาไปวางในปุ่มสีอะไรก็กลืนกับตัวหนังสือของปุ่มนั้นเอง
 * ไม่มี state ไม่มี hook จึงเรียกได้จากทั้ง server component และ client component
 */
export function Spinner({ size = 18, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={`loader-ring shrink-0 ${className}`}
      aria-hidden
    >
      <circle
        cx="12"
        cy="12"
        r="9"
        fill="none"
        stroke="currentColor"
        strokeOpacity="0.25"
        strokeWidth="2.5"
      />
      <path
        d="M21 12a9 9 0 0 0-9-9"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
