import Link from "next/link";

import { NavLink } from "@/components/NavLink";
import { PersonSwitcher } from "@/components/PersonSwitcher";
import { LOGO_SMALL, type Person } from "@/lib/constants";
import { switchPerson } from "@/lib/actions/identity";

export function Header({ person }: { person: Person }) {
  return (
    <header className="glass sticky top-0 z-20 border-b border-line">
      <div className="mx-auto flex max-w-3xl flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3">
        <Link href="/feed" className="group flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={LOGO_SMALL}
            alt=""
            width={192}
            height={192}
            className="h-9 w-9 object-contain transition-transform duration-300 ease-out group-hover:scale-110 group-hover:-rotate-6"
          />
          <span className="text-lg font-bold text-yolk-deep">พุงปลิ้น</span>
        </Link>

        <nav className="flex items-center gap-1">
          <NavLink href="/feed" label="บันทึก" />
          <NavLink href="/map" label="แผนที่" />
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <form action={switchPerson}>
            <PersonSwitcher person={person} />
          </form>

          <Link href="/new" className="btn btn-primary gap-1.5 px-4 py-1.5 text-sm">
            <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden>
              <path
                d="M12 5v14M5 12h14"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
            เพิ่มบันทึก
          </Link>
        </div>
      </div>
    </header>
  );
}
