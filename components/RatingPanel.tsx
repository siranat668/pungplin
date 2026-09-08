"use client";

import { useActionState, useState } from "react";

import { HeartDisplay } from "@/components/HeartDisplay";
import { HeartRating } from "@/components/HeartRating";
import { ScoreBadge } from "@/components/ScoreBadge";
import { PERSON_LABEL, RATING_CATEGORIES, type Person } from "@/lib/constants";
import { upsertRatingAction } from "@/lib/actions/visits";
import { initialFormState } from "@/lib/form-state";
import { averageOfRating } from "@/lib/scores";
import type { RatingRow } from "@/lib/types";

const ACCENT: Record<Person, string> = {
  mook: "text-bubble-deep",
  bay: "text-yolk-deep",
};

export function RatingPanel({
  visitId,
  person,
  rating,
  editable,
}: {
  visitId: string;
  person: Person;
  rating: RatingRow | null;
  editable: boolean;
}) {
  const [state, formAction, pending] = useActionState(upsertRatingAction, initialFormState);

  /**
   * โหมดแก้ไขคำนวณจาก updated_at ของคะแนนที่ server ส่งมา ไม่ได้เก็บเป็น state แยก
   * พอบันทึกสำเร็จ server action จะ revalidate แล้วส่ง updated_at ค่าใหม่กลับมา
   * ค่าที่จำไว้ตอนกดแก้จึงไม่ตรงกันอีกต่อไป ฟอร์มก็ปิดตัวเอง
   * ถ้าบันทึกไม่ผ่าน updated_at เท่าเดิม ฟอร์มยังเปิดค้างพร้อมข้อความ error
   */
  const [editingSince, setEditingSince] = useState<string | null>(null);
  const editing =
    editable && (rating === null || (editingSince !== null && editingSince === rating.updated_at));

  const errors = state.errors ?? {};

  if (editing) {
    return (
      <form action={formAction} className="card p-4">
        <input type="hidden" name="visit_id" value={visitId} />

        <h3 className={`text-lg font-bold ${ACCENT[person]}`}>
          คะแนนของ{PERSON_LABEL[person]}
        </h3>

        <div className="mt-2 divide-y divide-line">
          {RATING_CATEGORIES.map((category) => (
            <HeartRating
              key={category.key}
              name={category.key}
              label={category.label}
              defaultValue={rating?.[category.key] ?? 0}
              error={errors[category.key]}
            />
          ))}
        </div>

        <div className="mt-3">
          <label className="field-label" htmlFor={`comment-${person}`}>
            ความเห็นเพิ่มเติม
          </label>
          <textarea
            id={`comment-${person}`}
            name="comment"
            rows={3}
            defaultValue={rating?.comment ?? ""}
            placeholder="อร่อยตรงไหน ติดตรงไหน จะกลับไปอีกไหม"
            className="field-input resize-y"
          />
          {errors.comment ? <p className="field-error">{errors.comment}</p> : null}
        </div>

        {state.status === "error" && state.message ? (
          <p className="field-error">{state.message}</p>
        ) : null}

        <div className="mt-4 flex gap-2">
          <button type="submit" disabled={pending} className="btn btn-primary flex-1 text-sm">
            {pending ? "กำลังบันทึก" : "บันทึกคะแนน"}
          </button>
          {rating ? (
            <button
              type="button"
              onClick={() => setEditingSince(null)}
              className="btn btn-secondary text-sm"
            >
              ยกเลิก
            </button>
          ) : null}
        </div>
      </form>
    );
  }

  if (!rating) {
    return (
      <div className="card p-4">
        <h3 className={`text-lg font-bold ${ACCENT[person]}`}>
          คะแนนของ{PERSON_LABEL[person]}
        </h3>
        <p className="mt-2 text-sm text-muted">
          {PERSON_LABEL[person]}ยังไม่ได้ให้คะแนน สลับเป็น{PERSON_LABEL[person]}ที่มุมขวาบนแล้วมาให้คะแนนได้
        </p>
      </div>
    );
  }

  return (
    <div className="card p-4">
      <div className="flex items-start justify-between gap-2">
        <h3 className={`text-lg font-bold ${ACCENT[person]}`}>
          คะแนนของ{PERSON_LABEL[person]}
        </h3>
        <ScoreBadge score={averageOfRating(rating)} />
      </div>

      <dl className="mt-2 space-y-1">
        {RATING_CATEGORIES.map((category) => (
          <div key={category.key} className="flex items-center justify-between gap-3">
            <dt className="text-sm text-muted">{category.label}</dt>
            <dd>
              <HeartDisplay value={rating[category.key]} label={category.label} />
            </dd>
          </div>
        ))}
      </dl>

      {rating.comment ? (
        <p className="mt-3 whitespace-pre-line border-t border-line pt-3 text-sm">
          {rating.comment}
        </p>
      ) : null}

      {editable ? (
        <button
          type="button"
          onClick={() => setEditingSince(rating.updated_at)}
          className="btn btn-ghost mt-3 px-0 text-sm"
        >
          แก้คะแนนของฉัน
        </button>
      ) : null}

      {state.status === "success" ? (
        <p className="mt-2 text-sm text-leaf">{state.message}</p>
      ) : null}
    </div>
  );
}
