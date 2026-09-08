import { formatScore, scoreFill, scoreTextColor } from "@/lib/scores";

export function ScoreBadge({ score, hint }: { score: number | null; hint?: string }) {
  return (
    <span
      className="inline-flex shrink-0 items-baseline gap-1 rounded-full px-2.5 py-0.5 text-sm font-bold"
      style={{
        color: scoreTextColor(score),
        backgroundColor: `color-mix(in oklab, ${scoreFill(score)} 22%, transparent)`,
      }}
      title={hint}
    >
      {formatScore(score)}
      <span className="text-[0.7em] font-normal opacity-70">/5</span>
    </span>
  );
}
