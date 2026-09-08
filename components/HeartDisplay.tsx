const SCORES = [1, 2, 3, 4, 5] as const;

export function HeartDisplay({
  value,
  size = 16,
  label,
}: {
  value: number;
  size?: number;
  label?: string;
}) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${label ?? "คะแนน"} ${value} จาก 5`}>
      {SCORES.map((score) => (
        <svg
          key={score}
          viewBox="0 0 24 24"
          width={size}
          height={size}
          fill={score <= value ? "var(--color-heart)" : "transparent"}
          stroke={score <= value ? "var(--color-heart)" : "var(--color-line)"}
          strokeWidth={2}
          aria-hidden
        >
          <path d="M12 20.5 4.2 13a4.8 4.8 0 0 1 0-6.8 4.6 4.6 0 0 1 6.6 0l1.2 1.2 1.2-1.2a4.6 4.6 0 0 1 6.6 0 4.8 4.8 0 0 1 0 6.8Z" />
        </svg>
      ))}
    </span>
  );
}
