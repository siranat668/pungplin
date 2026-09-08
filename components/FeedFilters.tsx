"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

import { Select, type SelectOption } from "@/components/ui/Select";
import { Spinner } from "@/components/ui/Spinner";
import { PEOPLE, PERSON_LABEL } from "@/lib/constants";

const MIN_SCORES: SelectOption[] = [
  { value: "", label: "คะแนนเท่าไหร่ก็ได้" },
  { value: "3", label: "3 ดวงขึ้นไป" },
  { value: "4", label: "4 ดวงขึ้นไป" },
  { value: "4.5", label: "4.5 ดวงขึ้นไป" },
];

const REVIEWERS: SelectOption[] = [
  { value: "", label: "ใครให้คะแนนก็ได้" },
  ...PEOPLE.map((person) => ({
    value: person,
    label: `${PERSON_LABEL[person]}ให้คะแนนแล้ว`,
  })),
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

  const categoryOptions: SelectOption[] = [
    { value: "", label: "ทุกประเภท" },
    ...categories.map((category) => ({ value: category, label: category })),
  ];

  const hasFilters = searchParams.size > 0;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select
        ariaLabel="กรองตามประเภทอาหาร"
        value={searchParams.get("category") ?? ""}
        onChange={(value) => update("category", value)}
        options={categoryOptions}
        compact
      />

      <Select
        ariaLabel="กรองตามคะแนน"
        value={searchParams.get("min") ?? ""}
        onChange={(value) => update("min", value)}
        options={MIN_SCORES}
        compact
      />

      <Select
        ariaLabel="กรองตามคนให้คะแนน"
        value={searchParams.get("by") ?? ""}
        onChange={(value) => update("by", value)}
        options={REVIEWERS}
        compact
      />

      {hasFilters ? (
        <button
          type="button"
          onClick={() => startTransition(() => router.replace("/feed", { scroll: false }))}
          className="btn btn-ghost px-2 py-1 text-sm"
        >
          ล้างตัวกรอง
        </button>
      ) : null}

      {/* ตัวหมุนเล็กๆ ตอนกำลังไปเอารายการชุดใหม่ ไม่ได้หรี่ทั้งแถบเหมือนเดิม
          เพราะการหรี่ทำให้ตัวหนังสืออ่านยากขึ้นทั้งที่ยังกดใช้งานได้ปกติ */}
      {pending ? (
        <span className="fade flex items-center gap-1.5 text-xs text-muted" role="status">
          <Spinner size={14} />
          กำลังกรอง
        </span>
      ) : null}
    </div>
  );
}
