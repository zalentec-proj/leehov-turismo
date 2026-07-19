create type public.caravan_status as enum (
  'available',
  'coming_soon',
  'waitlist',
  'sold_out',
  'draft'
);

create table public.caravans (
  id uuid primary key default extensions.gen_random_uuid(),
  title text not null,
  slug text not null unique,
  destination text not null,
  category_id uuid references public.caravan_categories(id) on delete set null,
  type text,
  summary text,
  description text,
  duration text,
  price text,
  currency text not null default 'BRL',
  status public.caravan_status not null default 'draft',
  card_image_url text,
  hero_image_url text,
  video_url text,
  video_thumbnail_url text,
  is_group_trip boolean not null default true,
  is_accompanied boolean not null default true,
  has_portuguese_guide boolean not null default false,
  has_leehov_representative boolean not null default false,
  has_travel_kit boolean not null default false,
  has_travel_insurance boolean not null default false,
  min_people integer,
  max_people integer,
  leader_name text,
  leader_bio text,
  leader_image_url text,
  included jsonb not null default '[]'::jsonb,
  not_included jsonb not null default '[]'::jsonb,
  notes text,
  featured_home boolean not null default false,
  featured_hero boolean not null default false,
  hero_title text,
  hero_description text,
  hero_cta_text text,
  hero_cta_url text,
  hero_order integer not null default 0,
  published boolean not null default false,
  published_at timestamptz,
  seo_title text,
  seo_description text,
  created_by uuid references public.profiles(id) on delete set null,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint caravans_title_not_blank check (length(trim(title)) > 0),
  constraint caravans_destination_not_blank check (length(trim(destination)) > 0),
  constraint caravans_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint caravans_currency_format check (currency ~ '^[A-Z]{3}$'),
  constraint caravans_included_is_array check (jsonb_typeof(included) = 'array'),
  constraint caravans_not_included_is_array check (jsonb_typeof(not_included) = 'array'),
  constraint caravans_min_people_positive check (min_people is null or min_people > 0),
  constraint caravans_max_people_positive check (max_people is null or max_people > 0),
  constraint caravans_group_range check (min_people is null or max_people is null or min_people <= max_people),
  constraint caravans_hero_order_positive check (hero_order >= 0),
  constraint caravans_published_not_draft check (published = false or status <> 'draft')
);

create index caravans_category_id_idx on public.caravans (category_id);
create index caravans_created_by_idx on public.caravans (created_by);
create index caravans_updated_by_idx on public.caravans (updated_by);
create index caravans_status_idx on public.caravans (status);
create index caravans_published_order_idx
on public.caravans (published_at desc, created_at desc)
where published = true;
create index caravans_featured_hero_idx
on public.caravans (hero_order, published_at desc)
where published = true and featured_hero = true;
create index caravans_featured_home_idx
on public.caravans (published_at desc)
where published = true and featured_home = true;

create or replace function private.sync_caravan_publication()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.published = true and (tg_op = 'INSERT' or old.published = false) then
    new.published_at = coalesce(new.published_at, now());
  elsif new.published = false then
    new.published_at = null;
  end if;
  return new;
end;
$$;

revoke all on function private.sync_caravan_publication() from public, anon, authenticated;

create trigger caravans_sync_publication
before insert or update on public.caravans
for each row execute function private.sync_caravan_publication();

create trigger caravans_set_updated_at
before update on public.caravans
for each row execute function private.set_updated_at();
