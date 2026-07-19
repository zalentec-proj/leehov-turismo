-- Sprint 05: encrypted OAuth connections and Google review cache compliance.
create type public.google_business_connection_status as enum (
  'pending_location',
  'connected',
  'disconnected',
  'error'
);

create type public.google_review_reply_status as enum (
  'none',
  'pending',
  'synced',
  'delete_pending',
  'error'
);

create table public.google_business_connections (
  id uuid primary key default gen_random_uuid(),
  refresh_token_ciphertext text,
  scopes text[] not null default array[]::text[],
  status public.google_business_connection_status not null default 'pending_location',
  account_id text,
  account_name text,
  location_id text,
  location_name text,
  google_maps_url text,
  connected_by uuid references public.profiles(id) on delete set null,
  updated_by uuid references public.profiles(id) on delete set null,
  connected_at timestamptz not null default now(),
  disconnected_at timestamptz,
  last_token_refresh_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint google_business_connections_token_lifecycle
    check (
      (status = 'disconnected' and refresh_token_ciphertext is null)
      or (status <> 'disconnected' and length(trim(refresh_token_ciphertext)) >= 32)
    ),
  constraint google_business_connections_scopes_not_empty
    check (cardinality(scopes) > 0),
  constraint google_business_connections_account_length
    check (account_id is null or length(account_id) <= 240),
  constraint google_business_connections_location_length
    check (location_id is null or length(location_id) <= 240),
  constraint google_business_connections_maps_https
    check (google_maps_url is null or google_maps_url ~ '^https://'),
  constraint google_business_connections_location_pair
    check ((location_id is null) = (account_id is null)),
  constraint google_business_connections_disconnected_at
    check ((status = 'disconnected') = (disconnected_at is not null))
);

create unique index google_business_connections_one_live_idx
on public.google_business_connections ((true))
where status <> 'disconnected';

create index google_business_connections_connected_by_idx
on public.google_business_connections (connected_by)
where connected_by is not null;

create index google_business_connections_updated_by_idx
on public.google_business_connections (updated_by)
where updated_by is not null;

create trigger google_business_connections_set_updated_at
before update on public.google_business_connections
for each row execute function private.set_updated_at();

alter table public.google_business_settings
  add column connection_id uuid references public.google_business_connections(id) on delete set null,
  add column google_maps_url text,
  add column sync_lock_token uuid,
  add column sync_lock_until timestamptz;

alter table public.google_business_settings
  add constraint google_business_settings_maps_https
    check (google_maps_url is null or google_maps_url ~ '^https://'),
  add constraint google_business_settings_sync_lock_pair
    check ((sync_lock_token is null) = (sync_lock_until is null));

create index google_business_settings_connection_id_idx
on public.google_business_settings (connection_id)
where connection_id is not null;

alter table public.google_reviews_cache
  add column connection_id uuid references public.google_business_connections(id) on delete cascade,
  add column expires_at timestamptz not null default (now() + interval '30 days'),
  add column reply_status public.google_review_reply_status not null default 'none',
  add column reply_error text,
  add column reply_pending_at timestamptz;

alter table public.google_reviews_cache
  drop constraint google_reviews_cache_reply_length,
  add constraint google_reviews_cache_reply_bytes
    check (reply_comment is null or octet_length(reply_comment) <= 4096),
  add constraint google_reviews_cache_reply_error_length
    check (reply_error is null or length(reply_error) <= 1000),
  add constraint google_reviews_cache_expiration_window
    check (expires_at > synced_at and expires_at <= synced_at + interval '30 days');

create index google_reviews_cache_connection_id_idx
on public.google_reviews_cache (connection_id)
where connection_id is not null;

create index google_reviews_cache_expiration_idx
on public.google_reviews_cache (expires_at);

drop index public.google_reviews_cache_visible_featured_idx;
create index google_reviews_cache_visible_featured_idx
on public.google_reviews_cache (featured desc, create_time desc, expires_at)
where visible = true;
