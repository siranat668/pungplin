"use client";

import { useActionState } from "react";

import { updateVisitAction } from "@/lib/actions/visits";
import { initialFormState } from "@/lib/form-state";
import { todayInBangkok } from "@/lib/format";

export function VisitEditForm({
  visitId,
  visitedOn,
  note,
}: {
  visitId: string;
  visitedOn: string;
  note: string | null;
}) {
  const [state, formAction, pending] = useActionState(updateVisitAction, initialFormState);
  const errors = state.errors ?? {};

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="visit_id" value={visitId} />

      <div>
        <label className="field-label" htmlFor="edit-visited-on">
          วันที่ไปกิน
        </label>
        <input
          id="edit-visited-on"
          name="visited_on"
          type="date"
          defaultValue={visitedOn}
          max={todayInBangkok()}
          className="field-input"
        />
        {errors.visited_on ? <p className="field-error">{errors.visited_on}</p> : null}
      </div>

      <div>
        <label className="field-label" htmlFor="edit-note">
          บันทึกของวันนั้น
        </label>
        <textarea
          id="edit-note"
          name="note"
          rows={3}
          defaultValue={note ?? ""}
          className="field-input resize-y"
        />
        {errors.note ? <p className="field-error">{errors.note}</p> : null}
      </div>

      {state.status === "error" && state.message ? (
        <p className="field-error">{state.message}</p>
      ) : null}
      {state.status === "success" ? (
        <p className="text-sm text-leaf">{state.message}</p>
      ) : null}

      <button type="submit" disabled={pending} className="btn btn-secondary text-sm">
        {pending ? "กำลังบันทึก" : "บันทึกการแก้ไข"}
      </button>
    </form>
  );
}
