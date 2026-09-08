"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";

import { Modal } from "@/components/ui/Modal";
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

/** คีย์ทั้งหมดที่ถือว่าเป็นตัวกรอง ใช้นับว่ากรองอยู่กี่อย่าง */
const FILTER_KEYS = ["category", "min", "by"] as const;

/**
 * ตัวกรองของหน้าบันทึก
 *
 * เดิมวางช่องเลือกสามช่องเรียงกันบนหน้า ซึ่งบนจอมือถือแคบๆ มันตกบรรทัด
 * เป็นสองแถวเพราะข้อความในช่องยาว รวมมาเป็นปุ่มเดียวแล้วเปิดเป็นแผ่นขึ้นมา
 * จากขอบล่างจอ ที่ซึ่งมีที่ว่างเหลือเฟือให้วางช่องเลือกเรียงลงมาพร้อมหัวข้อกำกับ
 * และเป็นตำแหน่งที่นิ้วโป้งเอื้อมถึงง่ายกว่าด้านบนของจอ
 *
 * ค่าที่เลือกมีผลทันทีไม่ต้องกดยืนยัน ปุ่มปิดจึงบอกจำนวนผลลัพธ์ที่ได้ไปเลย
 * คนจะรู้ว่ากรองแล้วเหลือเท่าไหร่ก่อนปิดแผ่นลงไปดู
 */
export function FeedFilters({
  categories,
  resultCount,
}: {
  categories: string[];
  resultCount: number;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);

  function update(key: string, value: string) {
    const next = new URLSearchParams(searchParams.toString());
    if (value) next.set(key, value);
    else next.delete(key);

    startTransition(() => {
      router.replace(next.size > 0 ? `/feed?${next}` : "/feed", { scroll: false });
    });
  }

  function clearAll() {
    startTransition(() => router.replace("/feed", { scroll: false }));
  }

  const categoryOptions: SelectOption[] = [
    { value: "", label: "ทุกประเภท" },
    ...categories.map((category) => ({ value: category, label: category })),
  ];

  const activeCount = FILTER_KEYS.filter((key) => searchParams.get(key)).length;

  return (
    <>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="btn btn-secondary gap-2 py-1.5 text-sm"
        >
          <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden>
            <path
              d="M4 6h16M7 12h10M10 18h4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
            />
          </svg>
          ตัวกรอง
          {activeCount > 0 ? (
            <span className="pop grid h-5 min-w-5 place-items-center rounded-full bg-yolk px-1 text-xs font-bold text-ink">
              {activeCount}
            </span>
          ) : null}
        </button>

        {activeCount > 0 ? (
          <button type="button" onClick={clearAll} className="btn btn-ghost px-2 py-1 text-sm">
            ล้างตัวกรอง
          </button>
        ) : null}

        {pending ? (
          <span className="fade flex items-center gap-1.5 text-xs text-muted" role="status">
            <Spinner size={14} />
            กำลังกรอง
          </span>
        ) : null}
      </div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="กรองบันทึก"
        placement="sheet"
      >
        <div className="space-y-3.5">
          <div>
            <span className="field-label">ประเภทอาหาร</span>
            <Select
              ariaLabel="กรองตามประเภทอาหาร"
              value={searchParams.get("category") ?? ""}
              onChange={(value) => update("category", value)}
              options={categoryOptions}
            />
          </div>

          <div>
            <span className="field-label">คะแนน</span>
            <Select
              ariaLabel="กรองตามคะแนน"
              value={searchParams.get("min") ?? ""}
              onChange={(value) => update("min", value)}
              options={MIN_SCORES}
            />
          </div>

          <div>
            <span className="field-label">คนให้คะแนน</span>
            <Select
              ariaLabel="กรองตามคนให้คะแนน"
              value={searchParams.get("by") ?? ""}
              onChange={(value) => update("by", value)}
              options={REVIEWERS}
            />
          </div>

          <div className="flex gap-2 pt-1">
            {activeCount > 0 ? (
              <button
                type="button"
                onClick={clearAll}
                className="btn btn-secondary text-sm"
              >
                ล้างทั้งหมด
              </button>
            ) : null}

            <button
              type="button"
              onClick={() => setOpen(false)}
              className="btn btn-primary flex-1 text-sm"
            >
              {pending ? (
                <>
                  <Spinner size={16} />
                  กำลังกรอง
                </>
              ) : (
                `ดูผลลัพธ์ ${resultCount} ครั้ง`
              )}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
