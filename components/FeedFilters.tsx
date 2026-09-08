"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

import { PEOPLE, PERSON_LABEL } from "@/lib/constants";

const MIN_SCORES = [
  { value: "", label: "คะแนนเท่าไหร่ก็ได้" },
  { value: "3", label: "3 ดวงขึ้นไป" },
  { value: "4", label: "4 ดวงขึ้นไป" },
  { value: "4.5", label: "4.5 ดวงขึ้นไป" },
];

export function FeedFilters({ categories }: { categories: string[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  function update(key: string, value: string) {
    const next = new URLSearchParams(searchParams.toString());
    if (value) next.set(key, value);
    else next.delete(key);

    startTransition(() => {
      router.replace(next.size > 0 ? `/feed?${next}` : "/feed", { scroll: false });
    });
  }

  const hasFilters = searchParams.size > 0;

  return (
    <div
      className={`flex flex-wrap items-center gap-2 transition-opacity ${
        pending ? "opacity-60" : ""
      }`}
    >
      <select
        aria-label="กรองตามประเภทอาหาร"
        value={searchParams.get("category") ?? ""}
        onChange={(event) => update("category", event.target.value)}
        className="field-input w-auto py-1.5 text-sm"
      >
        <option value="">ทุกประเภท</option>
        {categories.map((category) => (
          <option key={category} value={category}>
            {category}
          </option>
        ))}
      </select>

      <select
        aria-label="กรองตามคะแนน"
        value={searchParams.get("min") ?? ""}
        onChange={(event) => update("min", event.target.value)}
        className="field-input w-auto py-1.5 text-sm"
      >
        {MIN_SCORES.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      <select
        aria-label="กรองตามคนให้คะแนน"
        value={searchParams.get("by") ?? ""}
        onChange={(event) => update("by", event.target.value)}
        className="field-input w-auto py-1.5 text-sm"
      >
        <option value="">ใครให้คะแนนก็ได้</option>
        {PEOPLE.map((person) => (
          <option key={person} value={person}>
            {PERSON_LABEL[person]}ให้คะแนนแล้ว
          </option>
        ))}
      </select>

      {hasFilters ? (
        <button
          type="button"
          onClick={() => startTransition(() => router.replace("/feed", { scroll: false }))}
          className="btn btn-ghost px-2 py-1 text-sm"
        >
          ล้างตัวกรอง
        </button>
      ) : null}
    </div>
  );
}
