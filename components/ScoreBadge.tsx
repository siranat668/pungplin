import { Tooltip } from "@/components/ui/Tooltip";
import { formatScore, scoreFill, scoreTextColor } from "@/lib/scores";

export function ScoreBadge({ score, hint }: { score: number | null; hint?: string }) {
  const badge = (
    <span
      className="inline-flex shrink-0 items-baseline gap-1 rounded-full px-2.5 py-0.5 text-sm font-bold"
      style={{
        color: scoreTextColor(score),
        backgroundColor: `color-mix(in oklab, ${scoreFill(score)} 20%, transparent)`,
        // เส้นขอบสีเดียวกับพื้นแต่เข้มกว่า ช่วยให้ป้ายไม่จมหายไปกับการ์ดขาว
        boxShadow: `inset 0 0 0 1px color-mix(in oklab, ${scoreFill(score)} 45%, transparent)`,
      }}
      aria-label={hint ? `${formatScore(score)} จาก 5 ${hint}` : undefined}
    >
      {formatScore(score)}
      <span className="text-[0.7em] font-normal opacity-70">/5</span>
    </span>
  );

  // hint เคยอยู่ใน attribute title ซึ่งบนมือถือไม่มีทางเห็น ย้ายมาใช้ป้ายที่เขียนเอง
  return hint ? <Tooltip label={hint}>{badge}</Tooltip> : badge;
}
