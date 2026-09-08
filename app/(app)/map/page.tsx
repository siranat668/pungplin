import type { Metadata } from "next";
import Link from "next/link";

import { MapOverview, type MapPin } from "@/components/MapOverview";
import { ScoreBadge } from "@/components/ScoreBadge";
import { SetupNotice } from "@/components/SetupNotice";
import { isDbConfigured } from "@/lib/db";
import { listRestaurantsWithStats } from "@/lib/queries";

export const metadata: Metadata = { title: "แผนที่" };

export default async function MapPage() {
  if (!isDbConfigured()) return <SetupNotice />;

  const restaurants = await listRestaurantsWithStats();

  const pins: MapPin[] = restaurants
    .filter((restaurant) => restaurant.lat !== null && restaurant.lng !== null)
    .map((restaurant) => ({
      id: restaurant.id,
      name: restaurant.name,
      lat: restaurant.lat as number,
      lng: restaurant.lng as number,
      visitCount: restaurant.visitCount,
      averageScore: restaurant.averageScore,
      category: restaurant.category,
    }));

  const unpinned = restaurants.filter(
    (restaurant) => restaurant.lat === null || restaurant.lng === null,
  );

  return (
    <div className="stagger space-y-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-2xl font-bold">แผนที่</h1>
        <span className="text-sm text-muted">{pins.length} ร้านบนแผนที่</span>
      </div>

      {pins.length === 0 ? (
        <div className="card pop p-8 text-center">
          <p className="text-muted">ยังไม่มีร้านที่ปักหมุดไว้</p>
          <Link href="/new" className="btn btn-primary mt-4">
            เพิ่มบันทึกพร้อมปักหมุด
          </Link>
        </div>
      ) : (
        <>
          <MapOverview pins={pins} />
          <p className="text-xs text-muted">
            สีหมุดบอกคะแนนเฉลี่ย เขียวคือชอบมาก ไล่ลงมาเป็นเหลือง ชมพู แล้วก็แดง
            ส่วนสีเทาคือยังไม่มีใครให้คะแนน
          </p>
        </>
      )}

      {unpinned.length > 0 ? (
        <section className="card p-4">
          <h2 className="mb-2 font-bold">ร้านที่ยังไม่ได้ปักหมุด</h2>
          <ul className="divide-y divide-line">
            {unpinned.map((restaurant) => (
              <li key={restaurant.id} className="flex items-center justify-between gap-3 py-2">
                <Link
                  href={`/restaurant/${restaurant.id}`}
                  className="min-w-0 flex-1 truncate text-sm transition-colors hover:text-yolk-deep"
                >
                  {restaurant.name}
                </Link>
                <ScoreBadge score={restaurant.averageScore} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
