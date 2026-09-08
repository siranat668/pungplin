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

type ScoreTier = "great" | "good" | "ok" | "meh" | "none";

function scoreTier(score: number | null): ScoreTier {
  if (score === null) return "none";
  if (score >= 4.5) return "great";
  if (score >= 3.5) return "good";
  if (score >= 2.5) return "ok";
  return "meh";
}

/*
 * สีคะแนนแยกเป็นสองชุดเพราะพื้นแอพเป็นสีขาว
 *
 * ชุดถมพื้นเป็นสีสดไว้ทำหมุดบนแผนที่ ซึ่งมีตัวเลขสีเข้มทับอยู่ด้านบน
 * ชุดตัวอักษรเป็นสีเข้มกว่า เพราะเหลืองหรือชมพูสดๆ วางบนพื้นขาวคอนทราสต์
 * ไม่ถึงเกณฑ์ WCAG AA อ่านกลางแดดไม่ออกเลย
 *
 * ต้องเขียนเป็นค่าสีจริง ไม่ใช่ var(--color-x) เพราะ OpenLayers เอาไปวาดลง
 * canvas ซึ่งอ่านตัวแปร CSS ไม่ได้ ค่าพวกนี้จึงต้องตรงกับพาเลตต์ใน globals.css
 */
const SCORE_FILL: Record<ScoreTier, string> = {
  great: "#22c55e",
  good: "#ffc800",
  ok: "#ff6fa8",
  meh: "#fb7185",
  none: "#d8d1c2",
};

const SCORE_TEXT: Record<ScoreTier, string> = {
  great: "#15803d",
  good: "#9c6b00",
  ok: "#c2185b",
  meh: "#be123c",
  none: "#7a7263",
};

/** สีสำหรับถมพื้น เช่น วงหมุดบนแผนที่ */
export function scoreFill(score: number | null): string {
  return SCORE_FILL[scoreTier(score)];
}

/** สีสำหรับตัวอักษรบนพื้นขาว */
export function scoreTextColor(score: number | null): string {
  return SCORE_TEXT[scoreTier(score)];
}
