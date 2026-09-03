-- RD Station CRM -> Meta Conversions API. No customer matching data is stored here.
create type public.meta_conversion_event_status as enum (
  'pending', 'processing', 'sent', 'failed', 'ignored', 'review_required'
);

create table public.meta_conversion_settings (
  id boolean primary key default true check (id),
  enabled boolean not null default false,
  rd_source_id text not null default '6a980525d9c2fd0020f81357',
  meta_pixel_id text not null default '1293414084833785',
  test_event_code text,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint meta_conversion_settings_test_event_code_length check (test_event_code is null or length(test_event_code) <= 128)
);

insert into public.meta_conversion_settings (id) values (true);

create trigger meta_conversion_settings_set_updated_at
before update on public.meta_conversion_settings
for each row execute function private.set_updated_at();

create table public.meta_conversion_campaigns (
  id uuid primary key default gen_random_uuid(),
  rd_campaign_id text not null unique,
  name text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint meta_conversion_campaign_name_not_blank check (length(trim(name)) between 2 and 160)
);

insert into public.meta_conversion_campaigns (rd_campaign_id, name) values
  ('6874ffc7c2915d001468360d', 'China e Singapura'),
  ('67641a5d45b136001d808c53', 'Vietnã, Camboja e Tailândia');

create trigger meta_conversion_campaigns_set_updated_at
before update on public.meta_conversion_campaigns
for each row execute function private.set_updated_at();

-- RD rotates the refresh token at each OAuth renewal. Only encrypted values are
-- persisted and this table is never exposed to browser roles.
create table public.meta_conversion_rd_oauth_tokens (
  id boolean primary key default true check (id),
  encrypted_access_token text,
  encrypted_refresh_token text not null,
  access_token_expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint meta_conversion_rd_oauth_access_token_length check (encrypted_access_token is null or length(encrypted_access_token) <= 8192),
  constraint meta_conversion_rd_oauth_refresh_token_length check (length(encrypted_refresh_token) between 20 and 8192)
);

create trigger meta_conversion_rd_oauth_tokens_set_updated_at
before update on public.meta_conversion_rd_oauth_tokens
for each row execute function private.set_updated_at();

create table public.meta_conversion_events (
  id uuid primary key default gen_random_uuid(),
  event_key text not null unique,
  rd_transaction_uuid text,
  rd_deal_id text not null,
  rd_contact_ids text[] not null default '{}',
  rd_source_id text,
  rd_source_name text,
  rd_campaign_id text,
  rd_campaign_name text,
  closed_at timestamptz,
  sale_value numeric(14,2),
  meta_event_id text,
  status public.meta_conversion_event_status not null default 'pending',
  attempts smallint not null default 0,
  meta_response_status smallint,
  last_error text,
  next_retry_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint meta_conversion_events_key_not_blank check (length(trim(event_key)) between 3 and 255),
  constraint meta_conversion_events_deal_not_blank check (length(trim(rd_deal_id)) between 1 and 255),
  constraint meta_conversion_events_attempts check (attempts between 0 and 25),
  constraint meta_conversion_events_response_status check (meta_response_status is null or meta_response_status between 100 and 599),
  constraint meta_conversion_events_error_length check (last_error is null or length(last_error) <= 1000),
  constraint meta_conversion_events_value_positive check (sale_value is null or sale_value > 0)
);

create index meta_conversion_events_status_retry_idx
on public.meta_conversion_events (status, next_retry_at, created_at desc);

create index meta_conversion_events_deal_idx
on public.meta_conversion_events (rd_deal_id, created_at desc);

create trigger meta_conversion_events_set_updated_at
before update on public.meta_conversion_events
for each row execute function private.set_updated_at();

alter table public.meta_conversion_settings enable row level security;
alter table public.meta_conversion_campaigns enable row level security;
alter table public.meta_conversion_rd_oauth_tokens enable row level security;
alter table public.meta_conversion_events enable row level security;

revoke all on public.meta_conversion_settings, public.meta_conversion_campaigns, public.meta_conversion_rd_oauth_tokens, public.meta_conversion_events from anon, authenticated;
grant select, insert, update, delete on public.meta_conversion_settings, public.meta_conversion_campaigns, public.meta_conversion_rd_oauth_tokens, public.meta_conversion_events to service_role;
grant usage on type public.meta_conversion_event_status to service_role;

insert into public.permissions (key, module, action, label, description, sort_order) values
  ('meta_conversions.view', 'meta_conversions', 'view', 'Visualizar conversões Meta', 'Visualizar configuração e histórico de conversões vindas do RD.', 105),
  ('meta_conversions.manage', 'meta_conversions', 'manage', 'Administrar conversões Meta', 'Ativar, testar e reenviar conversões Meta.', 106)
on conflict (key) do update set
  action = excluded.action,
  label = excluded.label,
  description = excluded.description,
  module = excluded.module,
  sort_order = excluded.sort_order;
