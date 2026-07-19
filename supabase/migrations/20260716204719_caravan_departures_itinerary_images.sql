create type public.departure_status as enum (
  'available',
  'coming_soon',
  'waitlist',
  'sold_out'
);

create table public.caravan_departures (
  id uuid primary key default extensions.gen_random_uuid(),
  caravan_id uuid not null references public.caravans(id) on delete cascade,
  label text,
  start_date date,
  end_date date,
  available_spots integer,
  status public.departure_status not null default 'available',
  notes text,
  order_index integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint caravan_departures_spots_nonnegative check (available_spots is null or available_spots >= 0),
  constraint caravan_departures_order_nonnegative check (order_index >= 0),
  constraint caravan_departures_date_range check (start_date is null or end_date is null or start_date <= end_date)
);

create index caravan_departures_caravan_id_idx on public.caravan_departures (caravan_id);
create index caravan_departures_start_date_idx on public.caravan_departures (start_date);
create index caravan_departures_caravan_order_idx on public.caravan_departures (caravan_id, order_index);

create trigger caravan_departures_set_updated_at
before update on public.caravan_departures
for each row execute function private.set_updated_at();

create table public.caravan_itinerary_days (
  id uuid primary key default extensions.gen_random_uuid(),
  caravan_id uuid not null references public.caravans(id) on delete cascade,
  day_number integer not null,
  title text not null,
  location text,
  description text,
  image_url text,
  meals jsonb not null default '[]'::jsonb,
  accommodation text,
  notes text,
  order_index integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint caravan_itinerary_days_day_positive check (day_number > 0),
  constraint caravan_itinerary_days_title_not_blank check (length(trim(title)) > 0),
  constraint caravan_itinerary_days_meals_is_array check (jsonb_typeof(meals) = 'array'),
  constraint caravan_itinerary_days_order_nonnegative check (order_index >= 0),
  constraint caravan_itinerary_days_number_unique unique (caravan_id, day_number)
);

create index caravan_itinerary_days_caravan_order_idx
on public.caravan_itinerary_days (caravan_id, order_index);

create trigger caravan_itinerary_days_set_updated_at
before update on public.caravan_itinerary_days
for each row execute function private.set_updated_at();

create table public.caravan_images (
  id uuid primary key default extensions.gen_random_uuid(),
  caravan_id uuid not null references public.caravans(id) on delete cascade,
  image_url text not null unique,
  alt_text text,
  caption text,
  order_index integer not null default 0,
  created_at timestamptz not null default now(),
  constraint caravan_images_url_not_blank check (length(trim(image_url)) > 0),
  constraint caravan_images_order_nonnegative check (order_index >= 0)
);

create index caravan_images_caravan_order_idx
on public.caravan_images (caravan_id, order_index);
