"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function NavLink({ href, label }: { href: string; label: string }) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      className={`rounded-full px-3 py-1.5 text-sm font-semibold transition-colors ${
        active ? "bg-raised text-yolk" : "text-muted hover:text-cream"
      }`}
    >
      {label}
    </Link>
  );
}
