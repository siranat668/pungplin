import Image from "next/image";

import { PEOPLE, PERSON_LABEL, type Person } from "@/lib/constants";
import { choosePerson } from "@/lib/actions/identity";
import { getPerson } from "@/lib/identity";

const PERSON_STYLE: Record<Person, string> = {
  mook: "bg-bubble text-ink",
  bay: "bg-yolk text-ink",
};

export default async function ChoosePersonPage({ searchParams }: PageProps<"/">) {
  const { next } = await searchParams;
  const current = await getPerson();
  const nextPath = typeof next === "string" ? next : "";

  return (
    <main className="flex flex-1 items-center justify-center px-5 py-12">
      <div className="w-full max-w-sm text-center">
        <Image
          src="/logo.png"
          alt="พุงปลิ้น"
          width={640}
          height={640}
          priority
          className="mx-auto h-44 w-44 object-contain drop-shadow-lg"
        />

        <h1 className="mt-5 text-3xl font-bold text-yolk-deep">พุงปลิ้น</h1>
        <p className="mt-1 text-sm text-muted">สมุดบันทึกร้านอาหารของมุกกับเบย์</p>

        <p className="mt-9 mb-4 text-base font-semibold">วันนี้ใครเป็นคนจด</p>

        <div className="grid grid-cols-2 gap-3">
          {PEOPLE.map((person) => (
            <form key={person} action={choosePerson}>
              <input type="hidden" name="person" value={person} />
              <input type="hidden" name="next" value={nextPath} />
              <button
                type="submit"
                className={`btn w-full py-4 text-xl ${PERSON_STYLE[person]}`}
              >
                {PERSON_LABEL[person]}
              </button>
            </form>
          ))}
        </div>

        {current ? (
          <p className="mt-6 text-sm text-muted">
            ครั้งก่อนเข้ามาเป็น{" "}
            <span className="font-semibold text-ink">{PERSON_LABEL[current]}</span>
          </p>
        ) : null}
      </div>
    </main>
  );
}
