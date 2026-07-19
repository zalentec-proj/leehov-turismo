-- Sprint 04: manual testimonials and Google Business Profile cache preparation.
create type public.review_display_mode as enum ('manual', 'google', 'mixed');

create table public.testimonials (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  role_title text,
  city text,
  testimonial_text text not null,
  rating smallint not null default 5,
  image_asset_id uuid references public.media_assets(id) on delete restrict,
  active boolean not null default false,
  featured boolean not null default false,
  order_index integer not null default 0,
  created_by uuid references public.profiles(id) on delete set null,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint testimonials_name_not_blank check (length(trim(name)) between 2 and 120),
  constraint testimonials_role_length check (role_title is null or length(role_title) <= 120),
  constraint testimonials_city_length check (city is null or length(city) <= 120),
  constraint testimonials_text_not_blank check (length(trim(testimonial_text)) between 10 and 2000),
  constraint testimonials_rating_range check (rating between 1 and 5),
  constraint testimonials_order_nonnegative check (order_index >= 0),
  constraint testimonials_featured_requires_active check (not featured or active)
);

create index testimonials_active_order_idx on public.testimonials (order_index, created_at desc) where active = true;
create index testimonials_featured_order_idx on public.testimonials (order_index, created_at desc) where active = true and featured = true;
create index testimonials_image_asset_id_idx on public.testimonials (image_asset_id) where image_asset_id is not null;
create index testimonials_created_by_idx on public.testimonials (created_by) where created_by is not null;
create index testimonials_updated_by_idx on public.testimonials (updated_by) where updated_by is not null;

create trigger testimonials_set_updated_at
before update on public.testimonials
for each row execute function private.set_updated_at();

create table public.google_business_settings (
  id uuid primary key default gen_random_uuid(),
  singleton boolean not null default true unique,
  account_id text,
  location_id text,
  enabled boolean not null default false,
  display_mode public.review_display_mode not null default 'manual',
  reviews_limit smallint not null default 6,
  min_rating smallint not null default 4,
  cache_hours integer not null default 24,
  last_sync_at timestamptz,
  last_sync_status text,
  last_sync_error text,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint google_business_settings_singleton check (singleton),
  constraint google_business_settings_account_length check (account_id is null or length(account_id) <= 200),
  constraint google_business_settings_location_length check (location_id is null or length(location_id) <= 200),
  constraint google_business_settings_reviews_limit check (reviews_limit between 1 and 20),
  constraint google_business_settings_min_rating check (min_rating between 1 and 5),
  constraint google_business_settings_cache_hours check (cache_hours between 1 and 168),
  constraint google_business_settings_status_length check (last_sync_status is null or length(last_sync_status) <= 40),
  constraint google_business_settings_error_length check (last_sync_error is null or length(last_sync_error) <= 1000)
);

create index google_business_settings_updated_by_idx on public.google_business_settings (updated_by) where updated_by is not null;

create trigger google_business_settings_set_updated_at
before update on public.google_business_settings
for each row execute function private.set_updated_at();

create table public.google_reviews_cache (
  id uuid primary key default gen_random_uuid(),
  google_review_id text not null unique,
  review_name text,
  reviewer_display_name text,
  reviewer_profile_photo_url text,
  reviewer_profile_url text,
  star_rating smallint not null,
  comment text,
  create_time timestamptz,
  update_time timestamptz,
  reply_comment text,
  reply_update_time timestamptz,
  visible boolean not null default true,
  featured boolean not null default false,
  raw_data jsonb not null default '{}'::jsonb,
  synced_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint google_reviews_cache_id_not_blank check (length(trim(google_review_id)) > 0),
  constraint google_reviews_cache_rating_range check (star_rating between 1 and 5),
  constraint google_reviews_cache_name_length check (reviewer_display_name is null or length(reviewer_display_name) <= 200),
  constraint google_reviews_cache_comment_length check (comment is null or length(comment) <= 10000),
  constraint google_reviews_cache_reply_length check (reply_comment is null or length(reply_comment) <= 10000),
  constraint google_reviews_cache_raw_object check (jsonb_typeof(raw_data) = 'object'),
  constraint google_reviews_cache_featured_requires_visible check (not featured or visible),
  constraint google_reviews_cache_photo_https check (reviewer_profile_photo_url is null or reviewer_profile_photo_url ~ '^https://'),
  constraint google_reviews_cache_profile_https check (reviewer_profile_url is null or reviewer_profile_url ~ '^https://')
);

create index google_reviews_cache_visible_featured_idx on public.google_reviews_cache (featured desc, create_time desc) where visible = true;
create index google_reviews_cache_star_rating_idx on public.google_reviews_cache (star_rating, create_time desc);
create index google_reviews_cache_updated_by_idx on public.google_reviews_cache (updated_by) where updated_by is not null;

create trigger google_reviews_cache_set_updated_at
before update on public.google_reviews_cache
for each row execute function private.set_updated_at();
