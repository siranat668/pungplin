import { PersonChoice } from "@/components/PersonChoice";
import { LOGO_LARGE, PEOPLE, PERSON_LABEL } from "@/lib/constants";
import { choosePerson } from "@/lib/actions/identity";
import { getPerson } from "@/lib/identity";

export default async function ChoosePersonPage({ searchParams }: PageProps<"/">) {
  const { next } = await searchParams;
  const current = await getPerson();
  const nextPath = typeof next === "string" ? next : "";

  return (
    <main className="flex flex-1 items-center justify-center px-5 py-12">
      <div className="stagger w-full max-w-sm text-center">
        <div className="relative mx-auto h-44 w-44">
          {/* แสงเรืองหลังโลโก้ เต้นช้าๆ ให้หน้าแรกไม่นิ่งเป็นภาพถ่าย */}
          <div
            className="loader-halo absolute inset-0 rounded-full blur-2xl"
            style={{
              background:
                "radial-gradient(circle, rgba(255,200,0,0.45) 0%, rgba(255,111,168,0.3) 55%, transparent 72%)",
            }}
            aria-hidden
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={LOGO_LARGE}
            alt="พุงปลิ้น"
            width={512}
            height={512}
            fetchPriority="high"
            className="relative h-44 w-44 object-contain drop-shadow-lg"
          />
        </div>

        <h1 className="mt-5 text-3xl font-bold text-yolk-deep">พุงปลิ้น</h1>
        <p className="mt-1 text-sm text-muted">สมุดบันทึกร้านอาหารของมุกกับเบย์</p>

        <p className="mt-9 mb-4 text-base font-semibold">วันนี้ใครเป็นคนจด</p>

        <div className="grid grid-cols-2 gap-3">
          {PEOPLE.map((person) => (
            <form key={person} action={choosePerson}>
              <input type="hidden" name="person" value={person} />
              <input type="hidden" name="next" value={nextPath} />
              <PersonChoice person={person} />
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
