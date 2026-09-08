"use client";

import { useState } from "react";

const SCORES = [1, 2, 3, 4, 5] as const;

function Heart({ filled }: { filled: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-7 w-7 transition-transform"
      fill={filled ? "var(--color-heart)" : "transparent"}
      stroke={filled ? "var(--color-heart)" : "var(--color-line)"}
      strokeWidth={2}
      aria-hidden
    >
      <path d="M12 20.5 4.2 13a4.8 4.8 0 0 1 0-6.8 4.6 4.6 0 0 1 6.6 0l1.2 1.2 1.2-1.2a4.6 4.6 0 0 1 6.6 0 4.8 4.8 0 0 1 0 6.8Z" />
    </svg>
  );
}

export function HeartRating({
  name,
  label,
  defaultValue = 0,
  error,
}: {
  name: string;
  label: string;
  defaultValue?: number;
  error?: string;
}) {
  const [value, setValue] = useState(defaultValue);
  const [preview, setPreview] = useState(0);
  const shown = preview || value;

  return (
    <fieldset className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 py-1.5">
      <legend className="sr-only">{label}</legend>
      <span className="text-sm font-semibold">{label}</span>

      <div className="flex items-center gap-1" onMouseLeave={() => setPreview(0)}>
        {SCORES.map((score) => (
          <label
            key={score}
            className="cursor-pointer rounded-lg p-0.5 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-yolk"
            onMouseEnter={() => setPreview(score)}
          >
            {/* เป็น radio จริงๆ ไม่ใช่ปุ่มปลอม คีย์บอร์ดกับ screen reader จึงใช้ได้ */}
            <input
              type="radio"
              name={name}
              value={score}
              checked={value === score}
              onChange={() => setValue(score)}
              className="sr-only"
            />
            <span className="sr-only">
              {label} {score} ดวง
            </span>
            <Heart filled={score <= shown} />
          </label>
        ))}
      </div>

      {error ? <p className="field-error w-full">{error}</p> : null}
    </fieldset>
  );
}
