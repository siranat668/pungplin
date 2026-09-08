"use client";

import { useFormStatus } from "react-dom";

import { Spinner } from "@/components/ui/Spinner";
import { Tooltip } from "@/components/ui/Tooltip";
import { PERSON_LABEL, otherPerson, type Person } from "@/lib/constants";

const PERSON_DOT: Record<Person, string> = {
  mook: "bg-bubble",
  bay: "bg-yolk",
};

/** ปุ่มสลับว่าตอนนี้ใครเป็นคนใช้ อยู่ในฟอร์มเพื่ออ่านสถานะกำลังส่งได้ */
export function PersonSwitcher({ person }: { person: Person }) {
  const { pending } = useFormStatus();

  return (
    <Tooltip label={`เปลี่ยนเป็น${PERSON_LABEL[otherPerson(person)]}`}>
      <button
        type="submit"
        disabled={pending}
        className="chip gap-1.5 hover:border-yolk/60 hover:text-ink"
      >
        {pending ? (
          <Spinner size={11} />
        ) : (
          <span className={`h-2 w-2 rounded-full ${PERSON_DOT[person]}`} aria-hidden />
        )}
        {PERSON_LABEL[person]}
      </button>
    </Tooltip>
  );
}
