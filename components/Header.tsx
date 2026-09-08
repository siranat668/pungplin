import Image from "next/image";
import Link from "next/link";

import { NavLink } from "@/components/NavLink";
import { PERSON_LABEL, type Person } from "@/lib/constants";
import { switchPerson } from "@/lib/actions/identity";

const PERSON_DOT: Record<Person, string> = {
  mook: "bg-bubble",
  bay: "bg-yolk",
};

export function Header({ person }: { person: Person }) {
  return (
    <header className="sticky top-0 z-20 border-b border-line bg-ink/85 backdrop-blur">
      <div className="mx-auto flex max-w-3xl flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3">
        <Link href="/feed" className="flex items-center gap-2">
          <Image
            src="/logo.jpg"
            alt=""
            width={64}
            height={64}
            className="h-9 w-9 rounded-xl border border-line object-cover"
          />
          <span className="text-lg font-bold text-yolk">พุงปลิ้น</span>
        </Link>

        <nav className="flex items-center gap-1">
          <NavLink href="/feed" label="บันทึก" />
          <NavLink href="/map" label="แผนที่" />
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <form action={switchPerson}>
            <button
              type="submit"
              className="chip hover:text-cream"
              title="เปลี่ยนเป็นอีกคน"
            >
              <span
                className={`h-2 w-2 rounded-full ${PERSON_DOT[person]}`}
                aria-hidden
              />
              {PERSON_LABEL[person]}
            </button>
          </form>

          <Link href="/new" className="btn btn-primary px-4 py-1.5 text-sm">
            เพิ่มบันทึก
          </Link>
        </div>
      </div>
    </header>
  );
}
