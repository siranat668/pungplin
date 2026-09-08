"use client";

import { useCallback, useEffect, useId, useRef, type KeyboardEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";

/* ของที่โฟกัสได้ ใช้หากรอบว่าในกล่องมีอะไรให้กด Tab ไปได้บ้าง */
const FOCUSABLE = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

/**
 * กล่องซ้อนหน้าที่เขียนเอง ใช้แทน window.confirm กับ window.alert
 *
 * กล่องของเบราว์เซอร์หน้าตาคนละเรื่องกันทุกเครื่อง บน Windows เป็นแถบเทา
 * บน Mac เป็นกล่องกลางจอ บนมือถือเป็นอีกแบบ และตกแต่งไม่ได้เลยแม้แต่นิดเดียว
 * ที่แย่กว่านั้นคือมันหยุด JavaScript ทั้งหน้าไว้จนกว่าคนจะกดตอบ
 *
 * กล่องนี้ทำครบทุกอย่างที่กล่องของเบราว์เซอร์ทำได้: กด Escape เพื่อปิด,
 * กดพื้นหลังเพื่อปิด, Tab วนอยู่แต่ในกล่องไม่หลุดไปข้างหลัง, และพอปิดแล้ว
 * โฟกัสเด้งกลับไปที่ปุ่มที่กดเปิดมันขึ้นมา
 */
export function Modal({
  open,
  onClose,
  title,
  description,
  icon,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: ReactNode;
  icon?: ReactNode;
  children?: ReactNode;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    if (!open) return;

    returnFocusRef.current = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // ย้ายโฟกัสเข้ามาในกล่อง ไม่งั้นคนที่ใช้คีย์บอร์ดจะยังกด Tab อยู่กับของข้างหลัง
    const panel = panelRef.current;
    const first = panel?.querySelector<HTMLElement>(FOCUSABLE);
    (first ?? panel)?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      returnFocusRef.current?.focus();
    };
  }, [open]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        onClose();
        return;
      }

      if (event.key !== "Tab") return;

      const panel = panelRef.current;
      if (!panel) return;

      const items = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (element) => element.offsetParent !== null,
      );
      if (items.length === 0) return;

      const first = items[0];
      const last = items[items.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    },
    [onClose],
  );

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fade fixed inset-0 z-[90] grid place-items-center overflow-y-auto bg-ink/25 px-5 py-10 backdrop-blur-sm"
      onClick={(event) => {
        // ปิดเฉพาะตอนกดพื้นหลังจริงๆ ไม่ใช่ตอนกดของข้างในแล้ว event ลอยขึ้นมา
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
        onKeyDown={handleKeyDown}
        className="pop card w-full max-w-sm p-6 outline-none"
      >
        {icon ? <div className="mb-3 flex justify-center">{icon}</div> : null}

        <h2 id={titleId} className="text-center text-lg font-bold">
          {title}
        </h2>

        {description ? (
          <p id={descriptionId} className="mt-2 text-center text-sm text-muted">
            {description}
          </p>
        ) : null}

        {children ? <div className="mt-5">{children}</div> : null}
      </div>
    </div>,
    document.body,
  );
}
