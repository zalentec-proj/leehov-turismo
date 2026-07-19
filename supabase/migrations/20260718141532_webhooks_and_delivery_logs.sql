-- Sprint 05: outbound webhook definitions and durable delivery history.
create type public.webhook_event as enum (
  'lead.created',
  'caravan_interest.created',
  'contact.created',
  'newsletter.subscribed',
  'newsletter.confirmed',
  'google_review.created',
  'google_review.low_rating',
  'caravan.created',
  'caravan.updated',
  'caravan.published',
  'blog_post.published'
);

create type public.webhook_delivery_status as enum ('pending', 'sent', 'failed');

create table public.webhooks (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  endpoint_url text not null,
  events public.webhook_event[] not null,
  validation_key_ciphertext text not null,
  active boolean not null default false,
  created_by uuid references public.profiles(id) on delete set null,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint webhooks_name_not_blank check (length(trim(name)) between 2 and 120),
  constraint webhooks_endpoint_length check (length(endpoint_url) between 10 and 2048),
  constraint webhooks_endpoint_protocol check (endpoint_url ~ '^https?://'),
  constraint webhooks_events_not_empty check (cardinality(events) between 1 and 11),
  constraint webhooks_key_not_blank check (length(trim(validation_key_ciphertext)) >= 32)
);

create index webhooks_active_idx on public.webhooks (created_at desc) where active = true;
create index webhooks_events_idx on public.webhooks using gin (events);
create index webhooks_created_by_idx on public.webhooks (created_by) where created_by is not null;
create index webhooks_updated_by_idx on public.webhooks (updated_by) where updated_by is not null;

create trigger webhooks_set_updated_at
before update on public.webhooks
for each row execute function private.set_updated_at();

create table public.webhook_logs (
  id uuid primary key default gen_random_uuid(),
  delivery_id uuid not null unique,
  webhook_id uuid not null references public.webhooks(id) on delete restrict,
  event public.webhook_event not null,
  payload_version smallint not null default 1,
  payload jsonb not null,
  status public.webhook_delivery_status not null default 'pending',
  attempts smallint not null default 0,
  request_started_at timestamptz,
  completed_at timestamptz,
  response_status smallint,
  response_body text,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint webhook_logs_payload_object check (jsonb_typeof(payload) = 'object'),
  constraint webhook_logs_payload_version check (payload_version > 0),
  constraint webhook_logs_attempts check (attempts between 0 and 25),
  constraint webhook_logs_response_status check (response_status is null or response_status between 100 and 599),
  constraint webhook_logs_response_body_length check (response_body is null or length(response_body) <= 4000),
  constraint webhook_logs_error_length check (error_message is null or length(error_message) <= 1000)
);

create index webhook_logs_webhook_created_idx
on public.webhook_logs (webhook_id, created_at desc);

create index webhook_logs_status_created_idx
on public.webhook_logs (status, created_at desc);

create index webhook_logs_event_created_idx
on public.webhook_logs (event, created_at desc);

create index webhook_logs_retention_idx
on public.webhook_logs (created_at);

create trigger webhook_logs_set_updated_at
before update on public.webhook_logs
for each row execute function private.set_updated_at();
