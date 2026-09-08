"use client";

import { useActionState, useState } from "react";

import { AutoTextarea } from "@/components/ui/AutoTextarea";
import { DatePicker } from "@/components/ui/DatePicker";
import { LoadingOverlay } from "@/components/ui/LoadingOverlay";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { updateVisitAction } from "@/lib/actions/visits";
import { initialFormState } from "@/lib/form-state";

export function VisitEditForm({
  visitId,
  visitedOn,
  note,
  today,
}: {
  visitId: string;
  visitedOn: string;
  note: string | null;
  today: string;
}) {
  const [state, formAction, pending] = useActionState(updateVisitAction, initialFormState);
  const [date, setDate] = useState(visitedOn);
  const errors = state.errors ?? {};

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="visit_id" value={visitId} />

      <div>
        <label className="field-label" htmlFor="edit-visited-on">
          วันที่ไปกิน
        </label>
        <DatePicker
          id="edit-visited-on"
          name="visited_on"
          value={date}
          onChange={setDate}
          today={today}
          max={today}
        />
        {errors.visited_on ? <p className="field-error">{errors.visited_on}</p> : null}
      </div>

      <div>
        <label className="field-label" htmlFor="edit-note">
          บันทึกของวันนั้น
        </label>
        <AutoTextarea id="edit-note" name="note" defaultValue={note ?? ""} />
        {errors.note ? <p className="field-error">{errors.note}</p> : null}
      </div>

      {state.status === "error" && state.message ? (
        <p className="field-error">{state.message}</p>
      ) : null}
      {state.status === "success" ? (
        <p className="fade text-sm text-leaf">{state.message}</p>
      ) : null}

      <SubmitButton
        variant="secondary"
        pending={pending}
        pendingLabel="กำลังบันทึก"
        className="text-sm"
      >
        บันทึกการแก้ไข
      </SubmitButton>

      <LoadingOverlay show={pending} message="กำลังบันทึก" />
    </form>
  );
}
