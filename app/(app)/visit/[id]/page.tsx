import Link from "next/link";
import { notFound } from "next/navigation";

import { DangerButton } from "@/components/DangerButton";
import { RatingPanel } from "@/components/RatingPanel";
import { ScoreBadge } from "@/components/ScoreBadge";
import { VisitEditForm } from "@/components/VisitEditForm";
import { PEOPLE, PERSON_LABEL, PRICE_LEVELS } from "@/lib/constants";
import { deleteVisitAction } from "@/lib/actions/visits";
import { formatDateLong } from "@/lib/format";
import { requirePerson } from "@/lib/identity";
import { getVisit } from "@/lib/queries";
import { idSchema } from "@/lib/schemas";
import { averageOfRatings } from "@/lib/scores";

export async function generateMetadata({ params }: PageProps<"/visit/[id]">) {
  const { id } = await params;
  if (!idSchema.safeParse({ id }).success) return { title: "ไม่พบบันทึก" };
  const visit = await getVisit(id);
  return { title: visit ? visit.restaurant.name : "ไม่พบบันทึก" };
}

/** ลิงก์เปิดแผนที่ ใช้ลิงก์ที่ผู้ใช้แนบมาก่อน ถ้าไม่มีก็สร้างจากพิกัด */
function mapLink(googleUrl: string | null, lat: number | null, lng: number | null) {
  if (googleUrl) return googleUrl;
  if (lat === null || lng === null) return null;
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
}

export default async function VisitPage({ params }: PageProps<"/visit/[id]">) {
  const person = await requirePerson();
  const { id } = await params;

  if (!idSchema.safeParse({ id }).success) notFound();

  const visit = await getVisit(id);
  if (!visit) notFound();

  const { restaurant } = visit;
  const price = PRICE_LEVELS.find((level) => level.value === restaurant.price_level);
  const directions = mapLink(restaurant.google_url, restaurant.lat, restaurant.lng);
  const overall = averageOfRatings(visit.ratings);

  return (
    <div className="space-y-5">
      <div>
        <Link href="/feed" className="text-sm text-muted hover:text-cream">
          กลับไปหน้าบันทึก
        </Link>

        <div className="mt-2 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold">{restaurant.name}</h1>
            <p className="text-sm text-muted">{formatDateLong(visit.visited_on)}</p>
          </div>
          <ScoreBadge score={overall} hint="คะแนนเฉลี่ยของทุกคน" />
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          {restaurant.category ? <span className="chip">{restaurant.category}</span> : null}
          {price ? <span className="chip">{price.label}</span> : null}
          <span className="chip">บันทึกโดย{PERSON_LABEL[visit.created_by]}</span>
        </div>
      </div>

      <section className="card space-y-2 p-4">
        <h2 className="font-bold">ที่ตั้ง</h2>
        <p className="text-sm text-muted">{restaurant.address ?? "ยังไม่ได้ใส่ที่อยู่"}</p>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
          {directions ? (
            <a
              href={directions}
              target="_blank"
              rel="noreferrer noopener"
              className="text-yolk hover:underline"
            >
              เปิดใน Google Maps
            </a>
          ) : (
            <span className="text-muted">ยังไม่ได้ปักหมุด</span>
          )}
          <Link href={`/restaurant/${restaurant.id}`} className="text-yolk hover:underline">
            ดูทุกครั้งที่ไปร้านนี้
          </Link>
        </div>
      </section>

      {visit.note ? (
        <section className="card p-4">
          <h2 className="mb-1 font-bold">บันทึกของวันนั้น</h2>
          <p className="whitespace-pre-line text-sm">{visit.note}</p>
        </section>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        {PEOPLE.map((who) => (
          <RatingPanel
            key={who}
            visitId={visit.id}
            person={who}
            rating={visit.ratings.find((rating) => rating.reviewer === who) ?? null}
            editable={who === person}
          />
        ))}
      </div>

      <details className="card p-4">
        <summary className="cursor-pointer font-bold">แก้ไขบันทึกครั้งนี้</summary>
        <div className="mt-4">
          <VisitEditForm visitId={visit.id} visitedOn={visit.visited_on} note={visit.note} />
        </div>
      </details>

      <DangerButton
        action={deleteVisitAction}
        name="visit_id"
        value={visit.id}
        label="ลบบันทึกครั้งนี้"
        confirmText="ลบบันทึกครั้งนี้ใช่ไหม ข้อมูลจะซ่อนไปจากแอพ แต่ยังกู้คืนได้จากฐานข้อมูล"
      />
    </div>
  );
}
