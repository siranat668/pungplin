import Link from "next/link";
import { notFound } from "next/navigation";

import { DangerButton } from "@/components/DangerButton";
import { RestaurantEditForm } from "@/components/RestaurantEditForm";
import { ScoreBadge } from "@/components/ScoreBadge";
import { VisitCard } from "@/components/VisitCard";
import { PERSON_LABEL, PRICE_LEVELS, RATING_CATEGORIES, type Person } from "@/lib/constants";
import { deleteRestaurantAction } from "@/lib/actions/visits";
import { formatDateLong } from "@/lib/format";
import { getRestaurant, listVisitsForRestaurant } from "@/lib/queries";
import { idSchema } from "@/lib/schemas";
import { averageOfRatings, formatScore } from "@/lib/scores";
import type { RatingRow } from "@/lib/types";

export async function generateMetadata({ params }: PageProps<"/restaurant/[id]">) {
  const { id } = await params;
  if (!idSchema.safeParse({ id }).success) return { title: "ไม่พบร้าน" };
  const restaurant = await getRestaurant(id);
  return { title: restaurant ? restaurant.name : "ไม่พบร้าน" };
}

export default async function RestaurantPage({ params }: PageProps<"/restaurant/[id]">) {
  const { id } = await params;
  if (!idSchema.safeParse({ id }).success) notFound();

  const restaurant = await getRestaurant(id);
  if (!restaurant) notFound();

  const visits = await listVisitsForRestaurant(restaurant.id);
  const allRatings: RatingRow[] = visits.flatMap((visit) => visit.ratings);
  const overall = averageOfRatings(allRatings);
  const price = PRICE_LEVELS.find((level) => level.value === restaurant.price_level);

  /** ค่าเฉลี่ยรายหัวข้อ ดูได้ว่าร้านนี้เด่นเรื่องไหน */
  const perCategory = RATING_CATEGORIES.map((category) => ({
    label: category.label,
    score:
      allRatings.length === 0
        ? null
        : allRatings.reduce((sum, rating) => sum + rating[category.key], 0) /
          allRatings.length,
  }));

  const perPerson = (["mook", "bay"] as Person[]).map((who) => ({
    person: who,
    score: averageOfRatings(allRatings.filter((rating) => rating.reviewer === who)),
  }));

  return (
    <div className="space-y-5">
      <div>
        <Link href="/feed" className="text-sm text-muted hover:text-cream">
          กลับไปหน้าบันทึก
        </Link>

        <div className="mt-2 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold">{restaurant.name}</h1>
            <p className="text-sm text-muted">
              ไปมาแล้ว {visits.length} ครั้ง
              {visits[0] ? ` ล่าสุด ${formatDateLong(visits[0].visited_on)}` : ""}
            </p>
          </div>
          <ScoreBadge score={overall} hint="คะแนนเฉลี่ยรวมทุกครั้ง" />
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {restaurant.category ? <span className="chip">{restaurant.category}</span> : null}
          {price ? <span className="chip">{price.label}</span> : null}
        </div>
      </div>

      {allRatings.length > 0 ? (
        <section className="card p-4">
          <h2 className="mb-3 font-bold">คะแนนเฉลี่ยของร้านนี้</h2>

          <dl className="space-y-1.5">
            {perCategory.map((row) => (
              <div key={row.label} className="flex items-center gap-3">
                <dt className="w-28 shrink-0 text-sm text-muted">{row.label}</dt>
                <dd className="flex flex-1 items-center gap-2">
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-raised">
                    <div
                      className="h-full rounded-full bg-yolk"
                      style={{ width: `${((row.score ?? 0) / 5) * 100}%` }}
                    />
                  </div>
                  <span className="w-8 text-right text-sm tabular-nums">
                    {formatScore(row.score)}
                  </span>
                </dd>
              </div>
            ))}
          </dl>

          <div className="mt-4 flex gap-4 border-t border-line pt-3 text-sm">
            {perPerson.map((row) => (
              <span key={row.person} className="flex items-center gap-2">
                <span className="text-muted">{PERSON_LABEL[row.person]}</span>
                <ScoreBadge score={row.score} />
              </span>
            ))}
          </div>
        </section>
      ) : null}

      <section className="space-y-3">
        <h2 className="font-bold">ทุกครั้งที่ไป</h2>
        {visits.length === 0 ? (
          <p className="card p-6 text-center text-sm text-muted">ยังไม่มีบันทึกของร้านนี้</p>
        ) : (
          visits.map((visit) => <VisitCard key={visit.id} visit={visit} />)
        )}
      </section>

      <details className="card p-4">
        <summary className="cursor-pointer font-bold">แก้ไขข้อมูลร้าน</summary>
        <div className="mt-4">
          <RestaurantEditForm restaurant={restaurant} />
        </div>
      </details>

      <DangerButton
        action={deleteRestaurantAction}
        name="restaurant_id"
        value={restaurant.id}
        label="ลบร้านนี้พร้อมบันทึกทั้งหมด"
        confirmText={`ลบ ${restaurant.name} พร้อมบันทึกทุกครั้งที่ไปใช่ไหม ข้อมูลจะซ่อนไปจากแอพ แต่ยังกู้คืนได้จากฐานข้อมูล`}
      />
    </div>
  );
}
