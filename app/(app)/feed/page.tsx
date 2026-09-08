import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { FeedFilters } from "@/components/FeedFilters";
import { SetupNotice } from "@/components/SetupNotice";
import { VisitCard } from "@/components/VisitCard";
import { Skeleton } from "@/components/ui/Skeleton";
import { isDbConfigured } from "@/lib/db";
import { listUsedCategories, listVisits } from "@/lib/queries";

export const metadata: Metadata = { title: "บันทึกทั้งหมด" };

function firstValue(value: string | string[] | undefined): string | undefined {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw && raw.trim() !== "" ? raw : undefined;
}

export default async function FeedPage({ searchParams }: PageProps<"/feed">) {
  if (!isDbConfigured()) return <SetupNotice />;

  const params = await searchParams;
  const minRaw = firstValue(params.min);
  const minScore = minRaw !== undefined ? Number(minRaw) : undefined;

  const [visits, categories] = await Promise.all([
    listVisits({
      category: firstValue(params.category),
      reviewer: firstValue(params.by),
      minScore: Number.isFinite(minScore) ? minScore : undefined,
    }),
    listUsedCategories(),
  ]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-2xl font-bold">บันทึกทั้งหมด</h1>
        <span className="text-sm text-muted">{visits.length} ครั้ง</span>
      </div>

      {/* FeedFilters อ่าน searchParams จึงต้องอยู่ใน Suspense
          ระหว่างรอก็วางแถบสีเทารูปร่างเท่าตัวจริงไว้ก่อน ไม่ให้หน้ากระตุกตอนของโผล่ */}
      <Suspense fallback={<Skeleton className="h-9 w-28 rounded-full" />}>
        <FeedFilters categories={categories} resultCount={visits.length} />
      </Suspense>

      {visits.length === 0 ? (
        <div className="card pop p-8 text-center">
          <p className="text-muted">ยังไม่มีบันทึกที่ตรงกับที่กรองไว้</p>
          <Link href="/new" className="btn btn-primary mt-4">
            เพิ่มบันทึกแรก
          </Link>
        </div>
      ) : (
        <div className="stagger space-y-3">
          {visits.map((visit) => (
            <VisitCard key={visit.id} visit={visit} />
          ))}
        </div>
      )}
    </div>
  );
}
