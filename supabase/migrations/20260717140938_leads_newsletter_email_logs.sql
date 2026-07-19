create type public.lead_status as enum ('new', 'in_progress', 'converted', 'archived');
create type public.newsletter_status as enum ('pending', 'active', 'unsubscribed');
create type public.email_status as enum ('pending', 'sent', 'failed', 'skipped');

create table public.leads (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email extensions.citext not null,
  phone text not null,
  city text,
  state text,
  message text not null,
  source text not null,
  caravan_id uuid references public.caravans(id) on delete set null,
  status public.lead_status not null default 'new',
  metadata jsonb not null default '{}'::jsonb,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint leads_name_not_blank check (char_length(btrim(name)) between 2 and 100),
  constraint leads_email_not_blank check (char_length(btrim(email::text)) between 3 and 254),
  constraint leads_phone_not_blank check (char_length(btrim(phone)) between 8 and 24),
  constraint leads_message_not_blank check (char_length(btrim(message)) between 10 and 2000),
  constraint leads_city_length check (city is null or char_length(btrim(city)) between 2 and 100),
  constraint leads_state_length check (state is null or char_length(btrim(state)) between 2 and 50),
  constraint leads_source_allowed check (source in ('contact', 'caravan_interest', 'popup')),
  constraint leads_caravan_source_consistency check (
    (source = 'caravan_interest' and caravan_id is not null)
    or (source <> 'caravan_interest' and caravan_id is null)
  ),
  constraint leads_metadata_object check (jsonb_typeof(metadata) = 'object')
);

create table public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  name text,
  email extensions.citext not null,
  source text not null,
  status public.newsletter_status not null default 'pending',
  active boolean generated always as (status = 'active'::public.newsletter_status) stored,
  confirmation_token_hash text,
  confirmation_expires_at timestamptz,
  confirmation_sent_at timestamptz,
  confirmed_at timestamptz,
  unsubscribe_token_hash text,
  unsubscribed_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint newsletter_subscribers_email_key unique (email),
  constraint newsletter_subscribers_name_length check (name is null or char_length(btrim(name)) between 2 and 100),
  constraint newsletter_subscribers_email_not_blank check (char_length(btrim(email::text)) between 3 and 254),
  constraint newsletter_subscribers_source_not_blank check (char_length(btrim(source)) between 2 and 50),
  constraint newsletter_subscribers_confirmation_hash_format check (
    confirmation_token_hash is null or confirmation_token_hash ~ '^[0-9a-f]{64}$'
  ),
  constraint newsletter_subscribers_unsubscribe_hash_format check (
    unsubscribe_token_hash is null or unsubscribe_token_hash ~ '^[0-9a-f]{64}$'
  ),
  constraint newsletter_subscribers_metadata_object check (jsonb_typeof(metadata) = 'object'),
  constraint newsletter_subscribers_status_fields check (
    (
      status = 'pending'
      and confirmation_token_hash is not null
      and confirmation_expires_at is not null
      and confirmation_sent_at is not null
      and unsubscribe_token_hash is null
      and unsubscribed_at is null
    )
    or (
      status = 'active'
      and confirmation_token_hash is null
      and confirmation_expires_at is null
      and confirmed_at is not null
      and unsubscribe_token_hash is not null
      and unsubscribed_at is null
    )
    or (
      status = 'unsubscribed'
      and confirmation_token_hash is null
      and confirmation_expires_at is null
      and confirmed_at is not null
      and unsubscribe_token_hash is not null
      and unsubscribed_at is not null
    )
  )
);

create table public.email_logs (
  id uuid primary key default gen_random_uuid(),
  template_key text not null,
  recipient_email extensions.citext,
  subject text not null,
  provider text not null default 'resend',
  provider_message_id text,
  status public.email_status not null default 'pending',
  error_message text,
  related_entity_type text,
  related_entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  sent_at timestamptz,
  constraint email_logs_template_key_allowed check (
    template_key in (
      'admin_caravan_lead',
      'visitor_caravan_lead_confirmation',
      'admin_contact',
      'visitor_contact_confirmation',
      'newsletter_double_opt_in',
      'newsletter_welcome'
    )
  ),
  constraint email_logs_subject_not_blank check (char_length(btrim(subject)) between 2 and 200),
  constraint email_logs_provider_not_blank check (char_length(btrim(provider)) between 2 and 40),
  constraint email_logs_error_length check (error_message is null or char_length(error_message) <= 500),
  constraint email_logs_related_entity_type_length check (
    related_entity_type is null or char_length(btrim(related_entity_type)) between 2 and 50
  ),
  constraint email_logs_metadata_object check (jsonb_typeof(metadata) = 'object'),
  constraint email_logs_sent_at_consistency check (
    (status = 'sent' and sent_at is not null) or (status <> 'sent' and sent_at is null)
  )
);

create index leads_created_at_idx on public.leads (created_at desc);
create index leads_status_created_at_idx on public.leads (status, created_at desc);
create index leads_source_created_at_idx on public.leads (source, created_at desc);
create index leads_caravan_created_at_idx on public.leads (caravan_id, created_at desc)
  where caravan_id is not null;
create index leads_updated_by_idx on public.leads (updated_by)
  where updated_by is not null;

create index newsletter_subscribers_status_created_at_idx
  on public.newsletter_subscribers (status, created_at desc);
create index newsletter_subscribers_source_created_at_idx
  on public.newsletter_subscribers (source, created_at desc);
create index newsletter_subscribers_confirmed_at_idx
  on public.newsletter_subscribers (confirmed_at desc)
  where status = 'active';
create unique index newsletter_subscribers_confirmation_hash_idx
  on public.newsletter_subscribers (confirmation_token_hash)
  where confirmation_token_hash is not null;
create unique index newsletter_subscribers_unsubscribe_hash_idx
  on public.newsletter_subscribers (unsubscribe_token_hash)
  where unsubscribe_token_hash is not null;

create index email_logs_created_at_idx on public.email_logs (created_at desc);
create index email_logs_status_created_at_idx on public.email_logs (status, created_at desc);
create index email_logs_template_created_at_idx on public.email_logs (template_key, created_at desc);
create index email_logs_related_entity_idx
  on public.email_logs (related_entity_type, related_entity_id, created_at desc)
  where related_entity_id is not null;

create trigger leads_set_updated_at
before update on public.leads
for each row execute function private.set_updated_at();

create trigger newsletter_subscribers_set_updated_at
before update on public.newsletter_subscribers
for each row execute function private.set_updated_at();
