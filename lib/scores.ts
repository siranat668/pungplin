import { RATING_CATEGORIES } from "./constants";
import type { RatingRow } from "./types";

/** ค่าเฉลี่ยห้าหัวข้อของคะแนนหนึ่งชุด */
export function averageOfRating(rating: RatingRow): number {
  const total = RATING_CATEGORIES.reduce((sum, category) => sum + rating[category.key], 0);
  return total / RATING_CATEGORIES.length;
}

/** ค่าเฉลี่ยรวมของทุกคนที่ให้คะแนน คืน null ถ้ายังไม่มีใครให้ */
export function averageOfRatings(ratings: RatingRow[]): number | null {
  if (ratings.length === 0) return null;
  const total = ratings.reduce((sum, rating) => sum + averageOfRating(rating), 0);
  return total / ratings.length;
}

export function formatScore(score: number | null): string {
  return score === null ? "-" : score.toFixed(1);
}

/** สีหมุดบนแผนที่และป้ายคะแนน ไล่จากแดงไปเขียวตามความชอบ */
export function scoreColor(score: number | null): string {
  if (score === null) return "var(--color-muted)";
  if (score >= 4.5) return "var(--color-leaf)";
  if (score >= 3.5) return "var(--color-yolk)";
  if (score >= 2.5) return "var(--color-bubble)";
  return "var(--color-heart)";
}
