"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function NavLink({ href, label }: { href: string; label: string }) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`relative rounded-full px-3 py-1.5 text-sm font-semibold transition-all duration-200 ease-out ${
        active
          ? "bg-raised text-yolk-deep shadow-[inset_0_0_0_1px_var(--color-line)]"
          : "text-muted hover:bg-raised/60 hover:text-ink"
      }`}
    >
      {label}
    </Link>
  );
}
