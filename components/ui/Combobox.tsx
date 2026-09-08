"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";

/**
 * ช่องพิมพ์ที่มีตัวเลือกแนะนำ ใช้แทน input list ที่คู่กับ datalist
 *
 * datalist เป็น element ที่แต่ละเบราว์เซอร์ตีความไม่เหมือนกันที่สุดตัวหนึ่ง
 * Chrome ขึ้นรายการใต้ช่อง Safari บนมือถือแทบไม่ขึ้นอะไรเลย Firefox กรองคำ
 * ด้วยกฎของตัวเอง และทุกเบราว์เซอร์แต่งหน้าตารายการด้วย CSS ไม่ได้
 *
 * ตัวนี้ยังพิมพ์อะไรลงไปก็ได้เหมือนเดิม ตัวเลือกเป็นแค่ทางลัด ไม่ได้บังคับ
 */
export function Combobox({
  name,
  value,
  onChange,
  suggestions,
  placeholder,
  id,
}: {
  name: string;
  value: string;
  onChange: (value: string) => void;
  suggestions: readonly string[];
  placeholder?: string;
  id?: string;
}) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  const needle = value.trim().toLowerCase();
  // พิมพ์แล้วกรองให้เหลือที่เกี่ยวข้อง ยังไม่พิมพ์ก็โชว์ทั้งหมด
  const matches = needle
    ? suggestions.filter((item) => item.toLowerCase().includes(needle))
    : [...suggestions];

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }

    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  function revealOption(index: number) {
    const node = listRef.current?.children[index];
    if (node instanceof HTMLElement) node.scrollIntoView({ block: "nearest" });
  }

  function pick(item: string) {
    onChange(item);
    setOpen(false);
    setActiveIndex(-1);
    inputRef.current?.focus();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      if (open) {
        event.preventDefault();
        setOpen(false);
        setActiveIndex(-1);
      }
      return;
    }

    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (!open) {
        setOpen(true);
        setActiveIndex(0);
        return;
      }
      const delta = event.key === "ArrowDown" ? 1 : -1;
      const next = Math.min(Math.max(activeIndex + delta, 0), matches.length - 1);
      setActiveIndex(next);
      revealOption(next);
      return;
    }

    if (event.key === "Enter" && open && activeIndex >= 0 && matches[activeIndex]) {
      // กันไม่ให้ Enter ตอนเลือกตัวเลือกไปกด submit ฟอร์มทั้งอัน
      event.preventDefault();
      pick(matches[activeIndex]);
    }
  }

  return (
    <div ref={rootRef} className="relative">
      <input
        ref={inputRef}
        id={id}
        name={name}
        value={value}
        onChange={(event) => {
          onChange(event.target.value);
          setOpen(true);
          setActiveIndex(-1);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        autoComplete="off"
        role="combobox"
        aria-expanded={open && matches.length > 0}
        aria-controls={open ? listId : undefined}
        aria-autocomplete="list"
        className="field-input"
      />

      {open && matches.length > 0 ? (
        <div
          ref={listRef}
          id={listId}
          role="listbox"
          className="popover absolute top-full left-0 z-50 mt-2 max-h-52 w-full overflow-y-auto py-1"
        >
          {matches.map((item, index) => (
            <div
              key={item}
              role="option"
              aria-selected={item === value}
              onClick={() => pick(item)}
              onPointerEnter={() => setActiveIndex(index)}
              data-active={index === activeIndex}
              data-selected={item === value}
              className="menu-item cursor-pointer"
            >
              <span className="truncate">{item}</span>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
