-- พุงปลิ้น: โครงสร้างฐานข้อมูลเริ่มต้น
-- รันไฟล์นี้ใน Supabase Dashboard -> SQL Editor -> New query

create extension if not exists pgcrypto;

-- ร้านอาหาร หนึ่งแถวคือหนึ่งหมุดบนแผนที่
create table if not exists public.restaurants (
  id            uuid primary key default gen_random_uuid(),
  name          text not null check (char_length(name) between 1 and 200),
  address       text check (char_length(address) <= 500),
  lat           double precision check (lat between -90 and 90),
  lng           double precision check (lng between -180 and 180),
  google_url    text check (char_length(google_url) <= 2000),
  category      text check (char_length(category) <= 60),
  price_level   smallint check (price_level between 1 and 4),
  created_by    text not null check (created_by in ('mook', 'bay')),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  deleted_at    timestamptz
);

-- การไปกินหนึ่งครั้ง ร้านเดียวมีได้หลายครั้ง
create table if not exists public.visits (
  id            uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  visited_on    date not null,
  note          text check (char_length(note) <= 4000),
  created_by    text not null check (created_by in ('mook', 'bay')),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  deleted_at    timestamptz
);

-- คะแนนของแต่ละคนต่อการไปกินครั้งนั้น มุกกับเบย์ให้คนละชุด
create table if not exists public.ratings (
  id            uuid primary key default gen_random_uuid(),
  visit_id      uuid not null references public.visits(id) on delete cascade,
  reviewer      text not null check (reviewer in ('mook', 'bay')),
  taste         smallint not null check (taste between 1 and 5),
  value         smallint not null check (value between 1 and 5),
  ambience      smallint not null check (ambience between 1 and 5),
  service       smallint not null check (service between 1 and 5),
  cleanliness   smallint not null check (cleanliness between 1 and 5),
  comment       text check (char_length(comment) <= 4000),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (visit_id, reviewer)
);

create index if not exists visits_restaurant_visited_idx
  on public.visits (restaurant_id, visited_on desc);
create index if not exists visits_visited_on_idx
  on public.visits (visited_on desc);
create index if not exists ratings_visit_idx
  on public.ratings (visit_id);

-- อัปเดต updated_at ให้อัตโนมัติ
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists restaurants_touch on public.restaurants;
create trigger restaurants_touch before update on public.restaurants
  for each row execute function public.touch_updated_at();

drop trigger if exists visits_touch on public.visits;
create trigger visits_touch before update on public.visits
  for each row execute function public.touch_updated_at();

drop trigger if exists ratings_touch on public.ratings;
create trigger ratings_touch before update on public.ratings
  for each row execute function public.touch_updated_at();

-- ปิดประตูหลัง
-- เปิด RLS แต่จงใจไม่สร้าง policy ใดๆ เลย
-- ผลคือ role anon และ authenticated อ่านหรือเขียนอะไรไม่ได้เลยแม้จะมี anon key
-- มีแต่ service_role (ซึ่งข้าม RLS โดยธรรมชาติ และเก็บไว้ฝั่ง server เท่านั้น) ที่เข้าถึงได้
alter table public.restaurants enable row level security;
alter table public.visits      enable row level security;
alter table public.ratings     enable row level security;

-- ตัดสิทธิ์ที่ Supabase ให้ไว้เป็นค่าเริ่มต้นออกอีกชั้น เผื่อมีใครเผลอสร้าง policy ทีหลัง
revoke all on public.restaurants from anon, authenticated;
revoke all on public.visits      from anon, authenticated;
revoke all on public.ratings     from anon, authenticated;
