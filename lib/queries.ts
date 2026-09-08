import "server-only";

import { db } from "./db";
import { averageOfRatings } from "./scores";
import type {
  RatingRow,
  RestaurantRow,
  RestaurantWithStats,
  VisitRow,
  VisitWithDetails,
} from "./types";

/**
 * ข้อมูลของแอพนี้เล็กมาก (สมุดบันทึกของคนสองคน) จึงดึงแยกตารางแล้วประกอบใน JS
 * แทนที่จะใช้ nested select ของ PostgREST ผลลัพธ์คือ type ตรงไปตรงมา
 * และไม่ต้องพึ่ง relationship metadata ที่ต้อง generate จาก Supabase CLI
 */

function joinVisits(
  visits: VisitRow[],
  restaurants: RestaurantRow[],
  ratings: RatingRow[],
): VisitWithDetails[] {
  const restaurantById = new Map(restaurants.map((row) => [row.id, row]));
  const ratingsByVisit = new Map<string, RatingRow[]>();

  for (const rating of ratings) {
    const list = ratingsByVisit.get(rating.visit_id);
    if (list) list.push(rating);
    else ratingsByVisit.set(rating.visit_id, [rating]);
  }

  return visits.flatMap((visit) => {
    const restaurant = restaurantById.get(visit.restaurant_id);
    // ร้านถูกลบไปแล้ว บันทึกของร้านนั้นก็ไม่ต้องโผล่
    if (!restaurant || restaurant.deleted_at) return [];
    return [{ ...visit, restaurant, ratings: ratingsByVisit.get(visit.id) ?? [] }];
  });
}

async function fetchRatings(visitIds: string[]): Promise<RatingRow[]> {
  if (visitIds.length === 0) return [];
  const { data, error } = await db().from("ratings").select("*").in("visit_id", visitIds);
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function listRestaurants(): Promise<RestaurantRow[]> {
  const { data, error } = await db()
    .from("restaurants")
    .select("*")
    .is("deleted_at", null)
    .order("name", { ascending: true });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export type VisitFilters = {
  category?: string;
  minScore?: number;
  reviewer?: string;
};

export async function listVisits(filters: VisitFilters = {}): Promise<VisitWithDetails[]> {
  const { data: visits, error } = await db()
    .from("visits")
    .select("*")
    .is("deleted_at", null)
    .order("visited_on", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(300);

  if (error) throw new Error(error.message);
  if (!visits || visits.length === 0) return [];

  const [restaurants, ratings] = await Promise.all([
    listRestaurants(),
    fetchRatings(visits.map((visit) => visit.id)),
  ]);

  let joined = joinVisits(visits, restaurants, ratings);

  if (filters.category) {
    joined = joined.filter((visit) => visit.restaurant.category === filters.category);
  }

  if (filters.reviewer) {
    joined = joined.filter((visit) =>
      visit.ratings.some((rating) => rating.reviewer === filters.reviewer),
    );
  }

  if (typeof filters.minScore === "number") {
    const threshold = filters.minScore;
    joined = joined.filter((visit) => {
      const average = averageOfRatings(visit.ratings);
      return average !== null && average >= threshold;
    });
  }

  return joined;
}

export async function getVisit(id: string): Promise<VisitWithDetails | null> {
  const { data: visit, error } = await db()
    .from("visits")
    .select("*")
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!visit) return null;

  const [restaurant, ratings] = await Promise.all([
    getRestaurant(visit.restaurant_id),
    fetchRatings([visit.id]),
  ]);

  if (!restaurant) return null;
  return { ...visit, restaurant, ratings };
}

export async function getRestaurant(id: string): Promise<RestaurantRow | null> {
  const { data, error } = await db()
    .from("restaurants")
    .select("*")
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ?? null;
}

export async function listVisitsForRestaurant(
  restaurantId: string,
): Promise<VisitWithDetails[]> {
  const restaurant = await getRestaurant(restaurantId);
  if (!restaurant) return [];

  const { data: visits, error } = await db()
    .from("visits")
    .select("*")
    .eq("restaurant_id", restaurantId)
    .is("deleted_at", null)
    .order("visited_on", { ascending: false });

  if (error) throw new Error(error.message);
  if (!visits || visits.length === 0) return [];

  const ratings = await fetchRatings(visits.map((visit) => visit.id));
  return joinVisits(visits, [restaurant], ratings);
}

/** ร้านทั้งหมดพร้อมจำนวนครั้งที่ไปและคะแนนเฉลี่ย ใช้ในหน้าแผนที่ */
export async function listRestaurantsWithStats(): Promise<RestaurantWithStats[]> {
  const [restaurants, visitsResult] = await Promise.all([
    listRestaurants(),
    db().from("visits").select("*").is("deleted_at", null),
  ]);

  if (visitsResult.error) throw new Error(visitsResult.error.message);
  const visits = visitsResult.data ?? [];
  const ratings = await fetchRatings(visits.map((visit) => visit.id));

  const ratingsByVisit = new Map<string, RatingRow[]>();
  for (const rating of ratings) {
    const list = ratingsByVisit.get(rating.visit_id);
    if (list) list.push(rating);
    else ratingsByVisit.set(rating.visit_id, [rating]);
  }

  const byRestaurant = new Map<string, { count: number; last: string | null; scores: RatingRow[] }>();
  for (const visit of visits) {
    const entry = byRestaurant.get(visit.restaurant_id) ?? {
      count: 0,
      last: null,
      scores: [],
    };
    entry.count += 1;
    if (!entry.last || visit.visited_on > entry.last) entry.last = visit.visited_on;
    entry.scores.push(...(ratingsByVisit.get(visit.id) ?? []));
    byRestaurant.set(visit.restaurant_id, entry);
  }

  return restaurants.map((restaurant) => {
    const stats = byRestaurant.get(restaurant.id);
    return {
      ...restaurant,
      visitCount: stats?.count ?? 0,
      lastVisitedOn: stats?.last ?? null,
      averageScore: averageOfRatings(stats?.scores ?? []),
    };
  });
}

/** รายชื่อประเภทอาหารที่มีอยู่จริงในฐาน ใช้ทำตัวกรอง */
export async function listUsedCategories(): Promise<string[]> {
  const restaurants = await listRestaurants();
  const categories = new Set<string>();
  for (const restaurant of restaurants) {
    if (restaurant.category) categories.add(restaurant.category);
  }
  return [...categories].sort((a, b) => a.localeCompare(b, "th"));
}
