"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";

export type SelectOption = {
  value: string;
  label: string;
  hint?: string;
};

/**
 * ช่องเลือกที่เขียนเอง ใช้แทน select ของเบราว์เซอร์
 *
 * select ของเดิมเปิดขึ้นมาหน้าตาไม่เหมือนกันเลยแต่ละเครื่อง บน Windows เป็นกล่องเหลี่ยม
 * บน Mac เป็นกล่องมนพร้อมเงา บน iOS เด้งเป็นวงล้อขึ้นมาจากด้านล่างจอ แต่งด้วย CSS
 * ก็ไม่ได้เพราะรายการตัวเลือกวาดโดยระบบปฏิบัติการไม่ใช่โดยหน้าเว็บ
 *
 * ตัวนี้วาดด้วย div ทั้งหมดจึงคุมหน้าตาได้ทุกจุด แล้วซ่อน input ไว้ข้างในหนึ่งตัว
 * ค่าจึงยังถูกส่งไปกับฟอร์มตามปกติเหมือน select เดิม
 *
 * รองรับคีย์บอร์ดครบตามที่ควรเป็น: ลูกศรขึ้นลงเลื่อนตัวเลือก, Enter หรือ Space
 * เพื่อเลือก, Escape ปิด, Home กับ End ไปตัวแรกตัวสุดท้าย และพิมพ์ตัวอักษร
 * เพื่อกระโดดไปตัวเลือกที่ขึ้นต้นด้วยตัวนั้น
 */
export function Select({
  name,
  value,
  onChange,
  options,
  placeholder = "เลือก",
  ariaLabel,
  id,
  compact = false,
}: {
  name?: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  ariaLabel?: string;
  id?: string;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [dropUp, setDropUp] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  const selectedIndex = options.findIndex((option) => option.value === value);
  const selected = selectedIndex >= 0 ? options[selectedIndex] : null;

  // กดที่อื่นนอกกล่องแล้วปิด ใช้ pointerdown ไม่ใช่ click เพราะ click จะมาหลัง
  // การกดปุ่มอื่นเสร็จแล้ว ทำให้เมนูค้างอยู่หนึ่งจังหวะซึ่งเห็นได้ด้วยตา
  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }

    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  /** เลื่อนตัวเลือกที่กำลังชี้อยู่ให้อยู่ในสายตา ตอนไล่ด้วยลูกศรในรายการยาวๆ */
  function revealOption(index: number) {
    const node = listRef.current?.children[index];
    if (node instanceof HTMLElement) node.scrollIntoView({ block: "nearest" });
  }

  function openList() {
    // วัดที่ว่างใต้ปุ่มตอนกำลังจะเปิด ถ้าเหลือไม่พอก็กางขึ้นด้านบนแทน
    // คิดตรงนี้เพราะเป็นจังหวะที่ยังรู้ตำแหน่งจริงก่อนเมนูจะโผล่มาดันหน้า
    const rect = buttonRef.current?.getBoundingClientRect();
    if (rect) {
      const spaceBelow = window.innerHeight - rect.bottom;
      setDropUp(spaceBelow < 260 && rect.top > spaceBelow);
    }

    const start = selectedIndex >= 0 ? selectedIndex : 0;
    setActiveIndex(start);
    setOpen(true);
    requestAnimationFrame(() => revealOption(start));
  }

  function choose(index: number) {
    const option = options[index];
    if (!option) return;
    onChange(option.value);
    setOpen(false);
    buttonRef.current?.focus();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (!open) {
      if (["Enter", " ", "ArrowDown", "ArrowUp"].includes(event.key)) {
        event.preventDefault();
        openList();
      }
      return;
    }

    switch (event.key) {
      case "Escape":
        event.preventDefault();
        setOpen(false);
        buttonRef.current?.focus();
        return;
      case "Enter":
      case " ":
        event.preventDefault();
        choose(activeIndex);
        return;
      case "ArrowDown": {
        event.preventDefault();
        const next = Math.min(activeIndex + 1, options.length - 1);
        setActiveIndex(next);
        revealOption(next);
        return;
      }
      case "ArrowUp": {
        event.preventDefault();
        const next = Math.max(activeIndex - 1, 0);
        setActiveIndex(next);
        revealOption(next);
        return;
      }
      case "Home":
        event.preventDefault();
        setActiveIndex(0);
        revealOption(0);
        return;
      case "End": {
        event.preventDefault();
        const last = options.length - 1;
        setActiveIndex(last);
        revealOption(last);
        return;
      }
      default:
        break;
    }

    // พิมพ์ตัวอักษรเดียวเพื่อกระโดดไปตัวเลือกถัดไปที่ขึ้นต้นด้วยตัวนั้น
    if (event.key.length === 1) {
      const needle = event.key.toLowerCase();
      const from = activeIndex + 1;
      const order = [...options.slice(from), ...options.slice(0, from)];
      const found = order.find((option) => option.label.toLowerCase().startsWith(needle));
      if (found) {
        const index = options.indexOf(found);
        setActiveIndex(index);
        revealOption(index);
      }
    }
  }

  return (
    <div ref={rootRef} className="relative" onKeyDown={handleKeyDown}>
      {name ? <input type="hidden" name={name} value={value} /> : null}

      <button
        ref={buttonRef}
        id={id}
        type="button"
        onClick={() => (open ? setOpen(false) : openList())}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-label={ariaLabel}
        data-open={open}
        className={`field-input flex items-center justify-between gap-2 text-left ${
          compact ? "py-1.5 text-sm" : ""
        }`}
      >
        <span className={selected ? "truncate" : "truncate text-muted"}>
          {selected ? selected.label : placeholder}
        </span>
        <svg
          viewBox="0 0 24 24"
          width="16"
          height="16"
          aria-hidden
          className="shrink-0 text-muted transition-transform duration-200"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
        >
          <path
            d="m6 9 6 6 6-6"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {open ? (
        <div
          ref={listRef}
          id={listId}
          role="listbox"
          aria-label={ariaLabel}
          /* min-w-max ให้เมนูกว้างพอไม่ตัดชื่อตัวเลือกที่ยาวกว่าปุ่ม
             แต่ต้องมี max-w กันไว้ ไม่งั้นชื่อร้านยาวๆ จะดันเมนูล้นออกนอกจอมือถือ */
          className={`popover absolute z-50 max-h-60 w-full min-w-max max-w-[75vw] overflow-y-auto py-1 ${
            dropUp ? "bottom-full mb-2" : "top-full mt-2"
          }`}
        >
          {options.map((option, index) => (
            <div
              key={option.value}
              role="option"
              aria-selected={option.value === value}
              onClick={() => choose(index)}
              onPointerEnter={() => setActiveIndex(index)}
              data-active={index === activeIndex}
              data-selected={option.value === value}
              className="menu-item cursor-pointer"
            >
              <span className="truncate">{option.label}</span>
              {option.value === value ? (
                <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden className="shrink-0">
                  <path
                    d="m5 13 4 4L19 7"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
