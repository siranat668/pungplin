import type { Person } from "./constants";

export type RestaurantRow = {
  id: string;
  name: string;
  address: string | null;
  lat: number | null;
  lng: number | null;
  google_url: string | null;
  category: string | null;
  price_level: number | null;
  created_by: Person;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type VisitRow = {
  id: string;
  restaurant_id: string;
  visited_on: string;
  note: string | null;
  created_by: Person;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type RatingRow = {
  id: string;
  visit_id: string;
  reviewer: Person;
  taste: number;
  value: number;
  ambience: number;
  service: number;
  cleanliness: number;
  comment: string | null;
  created_at: string;
  updated_at: string;
};

type Insertable<T, Optional extends keyof T> = Omit<T, Optional> &
  Partial<Pick<T, Optional>>;

type Defaulted = "id" | "created_at" | "updated_at";

export type Database = {
  public: {
    Tables: {
      restaurants: {
        Row: RestaurantRow;
        Insert: Insertable<RestaurantRow, Defaulted | "deleted_at">;
        Update: Partial<RestaurantRow>;
        Relationships: [];
      };
      visits: {
        Row: VisitRow;
        Insert: Insertable<VisitRow, Defaulted | "deleted_at">;
        Update: Partial<VisitRow>;
        Relationships: [];
      };
      ratings: {
        Row: RatingRow;
        Insert: Insertable<RatingRow, Defaulted>;
        Update: Partial<RatingRow>;
        Relationships: [];
      };
    };
    Views: Record<never, never>;
    Functions: Record<never, never>;
    Enums: Record<never, never>;
    CompositeTypes: Record<never, never>;
  };
};

/** รูปทรงที่หน้าเว็บใช้จริง หลังประกอบ visit เข้ากับร้านและคะแนนของทั้งสองคน */
export type VisitWithDetails = VisitRow & {
  restaurant: RestaurantRow;
  ratings: RatingRow[];
};

export type RestaurantWithStats = RestaurantRow & {
  visitCount: number;
  lastVisitedOn: string | null;
  /** ค่าเฉลี่ยรวมทุกหัวข้อของทุกคน 1-5 หรือ null ถ้ายังไม่มีใครให้คะแนน */
  averageScore: number | null;
};
