import Link from "next/link";

import { HeartDisplay } from "@/components/HeartDisplay";
import { ScoreBadge } from "@/components/ScoreBadge";
import { PERSON_LABEL, PRICE_LEVELS } from "@/lib/constants";
import { formatDateLong } from "@/lib/format";
import { averageOfRating, averageOfRatings } from "@/lib/scores";
import type { VisitWithDetails } from "@/lib/types";

export function VisitCard({ visit }: { visit: VisitWithDetails }) {
  const overall = averageOfRatings(visit.ratings);
  const price = PRICE_LEVELS.find((level) => level.value === visit.restaurant.price_level);

  return (
    <Link
      href={`/visit/${visit.id}`}
      className="card card-interactive block p-4"
    >
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-lg font-bold">{visit.restaurant.name}</h3>
          <p className="text-sm text-muted">{formatDateLong(visit.visited_on)}</p>
        </div>
        <ScoreBadge score={overall} hint="คะแนนเฉลี่ยของทุกคน" />
      </div>

      {visit.restaurant.category || price ? (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {visit.restaurant.category ? (
            <span className="chip">{visit.restaurant.category}</span>
          ) : null}
          {price ? <span className="chip">{price.label}</span> : null}
        </div>
      ) : null}

      {visit.ratings.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1">
          {visit.ratings.map((rating) => (
            <span key={rating.id} className="flex items-center gap-1.5 text-sm">
              <span className="text-muted">{PERSON_LABEL[rating.reviewer]}</span>
              <HeartDisplay
                value={Math.round(averageOfRating(rating))}
                size={14}
                label={PERSON_LABEL[rating.reviewer]}
              />
            </span>
          ))}
        </div>
      ) : (
        <p className="mt-3 text-sm text-muted">ยังไม่มีใครให้คะแนน</p>
      )}

      {visit.note ? (
        <p className="mt-3 line-clamp-2 text-sm text-muted">{visit.note}</p>
      ) : null}
    </Link>
  );
}
