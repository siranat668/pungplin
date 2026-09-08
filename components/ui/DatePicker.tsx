"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";

import { formatDateLong } from "@/lib/format";

/*
 * วันที่ในแอพเป็น date ล้วน (YYYY-MM-DD) ไม่มีเวลาและไม่มีโซนเวลา
 * การคำนวณทั้งหมดข้างล่างจึงทำผ่าน Date.UTC ตายตัว
 *
 * ถ้าใช้ new Date(y, m, d) แบบธรรมดา มันจะตีความเป็นเวลาท้องถิ่นของเครื่อง
 * แล้วคนที่อยู่โซนเวลาติดลบจะได้วันเคลื่อนไปหนึ่งวันตอนแปลงกลับเป็นสตริง
 */

function parseIso(iso: string): { year: number; month: number; day: number } {
  const [year, month, day] = iso.split("-").map(Number);
  return { year, month: month - 1, day };
}

function toIso(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function addDays(iso: string, delta: number): string {
  const { year, month, day } = parseIso(iso);
  const moved = new Date(Date.UTC(year, month, day + delta));
  return toIso(moved.getUTCFullYear(), moved.getUTCMonth(), moved.getUTCDate());
}

function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
}

/** เลื่อนเดือนแล้วหนีบวันที่ไม่ให้ล้น เช่น 31 มกราคม ถอยไปหนึ่งเดือนต้องได้ 28 หรือ 29 กุมภาพันธ์ */
function addMonths(iso: string, delta: number): string {
  const { year, month, day } = parseIso(iso);
  const target = new Date(Date.UTC(year, month + delta, 1));
  const targetYear = target.getUTCFullYear();
  const targetMonth = target.getUTCMonth();
  return toIso(targetYear, targetMonth, Math.min(day, daysInMonth(targetYear, targetMonth)));
}

/** วันแรกของเดือนตกวันอะไร 0 คืออาทิตย์ */
function firstWeekday(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 1)).getUTCDay();
}

const monthTitle = new Intl.DateTimeFormat("th-TH", {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

/* ตัวย่อวันในสัปดาห์ เขียนไว้ตรงๆ เพราะ Intl ของแต่ละเครื่องย่อไม่เหมือนกัน
   บางเครื่องได้ "อา." บางเครื่องได้ "อา" ซึ่งทำให้ความกว้างช่องไม่เท่ากัน */
const WEEKDAYS = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"];

/**
 * ปฏิทินที่เขียนเอง ใช้แทน input type="date"
 *
 * ช่องวันที่ของเบราว์เซอร์เป็นจุดที่ต่างกันมากที่สุดในบรรดา control ทั้งหมด
 * Chrome บน Windows ขึ้นปฏิทินแบบหนึ่ง Safari บน Mac ขึ้นอีกแบบ Firefox
 * อีกแบบ ส่วน iOS เด้งวงล้อขึ้นจากด้านล่างจอ และที่สำคัญคือลำดับช่องวันเดือนปี
 * ขึ้นกับภาษาที่ตั้งไว้ในเครื่อง คนที่ตั้งเครื่องเป็นอังกฤษจะเห็นเดือนมาก่อนวัน
 * ทั้งที่คนไทยคาดหวังว่าวันต้องมาก่อน
 *
 * ตัวนี้ขึ้นปฏิทินไทยพร้อมปีพุทธศักราชเหมือนกันทุกเครื่อง ส่วนค่าที่ส่งขึ้น server
 * ยังเป็น YYYY-MM-DD ตามเดิม ฝั่ง server จึงไม่ต้องแก้อะไรเลย
 */
export function DatePicker({
  name,
  value,
  onChange,
  today,
  max,
  min,
  id,
}: {
  name: string;
  value: string;
  onChange: (value: string) => void;
  /** วันนี้ตามเวลาไทย คำนวณจาก server เพื่อให้เครื่องที่ตั้งโซนเวลาผิดยังได้วันเดียวกัน */
  today: string;
  max?: string;
  min?: string;
  id?: string;
}) {
  const [open, setOpen] = useState(false);
  const [dropUp, setDropUp] = useState(false);
  /** วันที่ที่แป้นลูกศรกำลังชี้อยู่ และเป็นตัวกำหนดว่าปฏิทินโชว์เดือนไหน */
  const [cursor, setCursor] = useState(value);

  const rootRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const gridId = useId();

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }

    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  // โฟกัสไปที่ตารางวันตอนเปิด แล้วคุมด้วยลูกศรได้ทันทีโดยไม่ต้องกด Tab ไล่ไปเอง
  // ใช้ aria-activedescendant ชี้ว่าช่องไหนกำลังถูกเลือก โฟกัสจริงจึงอยู่ที่ตาราง
  // ตัวเดียวไม่ต้องเด้งไปเด้งมาทีละช่องซึ่งเป็นวิธีที่ screen reader อ่านสับสน
  useEffect(() => {
    if (open) gridRef.current?.focus();
  }, [open]);

  function isBlocked(iso: string): boolean {
    // เทียบเป็นสตริงได้เลย เพราะ YYYY-MM-DD เรียงตามตัวอักษรแล้วได้ลำดับเวลาพอดี
    if (max && iso > max) return true;
    if (min && iso < min) return true;
    return false;
  }

  function openPanel() {
    // ปฏิทินสูงราว 370px วัดที่ว่างใต้ปุ่มก่อนเปิด ถ้าไม่พอก็กางขึ้นด้านบน
    // ไม่งั้นแถวสุดท้ายของเดือนจะอยู่ใต้ขอบจอ เลื่อนลงไปกดก็ไม่ได้เพราะกล่อง
    // ลอยตามปุ่มไปด้วย ต้องคิดตรงนี้เพราะเป็นจังหวะที่ยังรู้ตำแหน่งจริงของปุ่ม
    const rect = buttonRef.current?.getBoundingClientRect();
    if (rect) {
      const spaceBelow = window.innerHeight - rect.bottom;
      setDropUp(spaceBelow < 380 && rect.top > spaceBelow);
    }

    setCursor(value || today);
    setOpen(true);
  }

  function commit(iso: string) {
    if (isBlocked(iso)) return;
    onChange(iso);
    setOpen(false);
    buttonRef.current?.focus();
  }

  function moveCursor(next: string) {
    if (isBlocked(next)) return;
    setCursor(next);
  }

  function handleGridKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    switch (event.key) {
      case "Escape":
        event.preventDefault();
        setOpen(false);
        buttonRef.current?.focus();
        return;
      case "Enter":
      case " ":
        event.preventDefault();
        commit(cursor);
        return;
      case "ArrowLeft":
        event.preventDefault();
        moveCursor(addDays(cursor, -1));
        return;
      case "ArrowRight":
        event.preventDefault();
        moveCursor(addDays(cursor, 1));
        return;
      case "ArrowUp":
        event.preventDefault();
        moveCursor(addDays(cursor, -7));
        return;
      case "ArrowDown":
        event.preventDefault();
        moveCursor(addDays(cursor, 7));
        return;
      case "PageUp":
        event.preventDefault();
        moveCursor(addMonths(cursor, -1));
        return;
      case "PageDown":
        event.preventDefault();
        moveCursor(addMonths(cursor, 1));
        return;
      default:
        break;
    }
  }

  const base = cursor || value || today;
  const view = parseIso(base);
  const total = daysInMonth(view.year, view.month);
  const leading = firstWeekday(view.year, view.month);
  const days = Array.from({ length: total }, (_, index) => index + 1);

  const previousMonth = addMonths(base, -1);
  const nextMonth = addMonths(base, 1);
  // ปิดปุ่มเดือนถัดไปเมื่อวันแรกของเดือนนั้นเลยเพดานไปแล้ว
  const nextBlocked = (() => {
    const target = parseIso(nextMonth);
    return isBlocked(toIso(target.year, target.month, 1));
  })();
  const previousBlocked = (() => {
    const target = parseIso(previousMonth);
    return isBlocked(toIso(target.year, target.month, daysInMonth(target.year, target.month)));
  })();

  return (
    <div ref={rootRef} className="relative">
      <input type="hidden" name={name} value={value} />

      <button
        ref={buttonRef}
        id={id}
        type="button"
        onClick={() => (open ? setOpen(false) : openPanel())}
        aria-haspopup="dialog"
        aria-expanded={open}
        data-open={open}
        className="field-input flex items-center justify-between gap-2 text-left"
      >
        <span>{value ? formatDateLong(value) : "เลือกวันที่"}</span>
        <svg viewBox="0 0 24 24" width="17" height="17" aria-hidden className="shrink-0 text-muted">
          <path
            d="M7 4v3M17 4v3M4 10h16M5 7h14a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </button>

      {open ? (
        <div
          className={`popover absolute left-0 z-50 w-[19.5rem] p-3 ${
            dropUp ? "bottom-full mb-2" : "top-full mt-2"
          }`}
        >
          <div className="mb-2 flex items-center justify-between gap-1">
            <button
              type="button"
              onClick={() => moveCursor(previousMonth)}
              disabled={previousBlocked}
              aria-label="เดือนก่อนหน้า"
              className="btn btn-ghost h-9 w-9 p-0 disabled:opacity-30"
            >
              <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden>
                <path
                  d="m14 6-6 6 6 6"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>

            <span className="font-display text-sm font-bold">
              {monthTitle.format(new Date(Date.UTC(view.year, view.month, 1)))}
            </span>

            <button
              type="button"
              onClick={() => moveCursor(nextMonth)}
              disabled={nextBlocked}
              aria-label="เดือนถัดไป"
              className="btn btn-ghost h-9 w-9 p-0 disabled:opacity-30"
            >
              <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden>
                <path
                  d="m10 6 6 6-6 6"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 pb-1 text-center text-[0.7rem] font-semibold text-muted">
            {WEEKDAYS.map((weekday) => (
              <span key={weekday}>{weekday}</span>
            ))}
          </div>

          <div
            ref={gridRef}
            id={gridId}
            role="grid"
            aria-label="เลือกวันที่"
            tabIndex={0}
            onKeyDown={handleGridKeyDown}
            aria-activedescendant={`${gridId}-${cursor}`}
            className="grid grid-cols-7 gap-1 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-yolk"
          >
            {Array.from({ length: leading }, (_, index) => (
              <span key={`blank-${index}`} aria-hidden />
            ))}

            {days.map((day) => {
              const iso = toIso(view.year, view.month, day);
              const blocked = isBlocked(iso);
              const isSelected = iso === value;
              const isCursor = iso === cursor;

              return (
                <button
                  key={iso}
                  id={`${gridId}-${iso}`}
                  type="button"
                  role="gridcell"
                  aria-selected={isSelected}
                  disabled={blocked}
                  tabIndex={-1}
                  onClick={() => commit(iso)}
                  onPointerEnter={() => moveCursor(iso)}
                  className={`h-9 rounded-xl text-sm transition-colors duration-150 ${
                    isSelected
                      ? "bg-yolk font-bold text-ink shadow-sm"
                      : isCursor
                        ? "bg-yolk/25 font-semibold"
                        : blocked
                          ? "text-muted/40"
                          : "hover:bg-raised"
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {isBlocked(today) || value === today ? null : (
            <button
              type="button"
              onClick={() => commit(today)}
              className="btn btn-ghost mt-2 w-full py-1 text-xs"
            >
              กลับมาวันนี้
            </button>
          )}
        </div>
      ) : null}
    </div>
  );
}
