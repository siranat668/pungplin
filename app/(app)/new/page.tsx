import type { Metadata } from "next";

import { SetupNotice } from "@/components/SetupNotice";
import { VisitForm } from "@/components/VisitForm";
import { isDbConfigured } from "@/lib/db";
import { todayInBangkok } from "@/lib/format";
import { requirePerson } from "@/lib/identity";
import { listRestaurants } from "@/lib/queries";

export const metadata: Metadata = { title: "เพิ่มบันทึก" };

export default async function NewVisitPage() {
  const person = await requirePerson();

  if (!isDbConfigured()) return <SetupNotice />;

  const restaurants = await listRestaurants();

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold">เพิ่มบันทึกใหม่</h1>

      <VisitForm
        person={person}
        today={todayInBangkok()}
        restaurants={restaurants.map((restaurant) => ({
          id: restaurant.id,
          name: restaurant.name,
          category: restaurant.category,
        }))}
      />
    </div>
  );
}
