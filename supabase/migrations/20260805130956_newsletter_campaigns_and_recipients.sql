create type public.newsletter_campaign_status as enum (
  'draft',
  'scheduled',
  'sending',
  'paused',
  'sent',
  'cancelled'
);

create type public.newsletter_recipient_status as enum (
  'pending',
  'processing',
  'sent',
  'failed',
  'skipped'
);

create or replace function private.is_valid_newsletter_campaign_content(payload jsonb)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select
    jsonb_typeof(payload) = 'array'
    and jsonb_array_length(payload) between 1 and 100
    and not exists (
      select 1
      from jsonb_array_elements(payload) as block
      where jsonb_typeof(block) <> 'object'
        or jsonb_typeof(block -> 'id') <> 'string'
        or jsonb_typeof(block -> 'type') <> 'string'
        or jsonb_typeof(block -> 'data') <> 'object'
        or block ->> 'type' not in ('heading', 'paragraph', 'image', 'button', 'divider', 'spacer')
    );
$$;

revoke all on function private.is_valid_newsletter_campaign_content(jsonb) from public, anon, authenticated;

create table public.newsletter_campaigns (
  id uuid primary key default gen_random_uuid(),
  internal_title text not null,
  subject text not null,
  preheader text,
  content jsonb not null default '[]'::jsonb,
  status public.newsletter_campaign_status not null default 'draft',
  scheduled_at timestamptz,
  audience_frozen_at timestamptz,
  sending_started_at timestamptz,
  sent_at timestamptz,
  cancelled_at timestamptz,
  archived_at timestamptz,
  pause_reason text,
  last_error text,
  created_by uuid references public.profiles(id) on delete set null,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint newsletter_campaigns_internal_title_length check (char_length(btrim(internal_title)) between 2 and 160),
  constraint newsletter_campaigns_subject_length check (char_length(btrim(subject)) between 2 and 200),
  constraint newsletter_campaigns_preheader_length check (preheader is null or char_length(preheader) <= 250),
  constraint newsletter_campaigns_content_valid check (private.is_valid_newsletter_campaign_content(content)),
  constraint newsletter_campaigns_error_length check (last_error is null or char_length(last_error) <= 1000),
  constraint newsletter_campaigns_pause_reason_length check (pause_reason is null or char_length(pause_reason) <= 500),
  constraint newsletter_campaigns_schedule_consistency check (
    status not in ('scheduled', 'sending') or scheduled_at is not null
  ),
  constraint newsletter_campaigns_sent_consistency check (
    (status = 'sent' and sent_at is not null) or (status <> 'sent' and sent_at is null)
  )
);

create table public.newsletter_campaign_recipients (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.newsletter_campaigns(id) on delete cascade,
  subscriber_id uuid references public.newsletter_subscribers(id) on delete set null,
  recipient_name text,
  recipient_email extensions.citext not null,
  status public.newsletter_recipient_status not null default 'pending',
  attempts smallint not null default 0,
  unsubscribe_token_hash text,
  provider_message_id text,
  error_message text,
  processing_started_at timestamptz,
  next_attempt_at timestamptz,
  sent_at timestamptz,
  skipped_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint newsletter_campaign_recipients_campaign_email_key unique (campaign_id, recipient_email),
  constraint newsletter_campaign_recipients_name_length check (recipient_name is null or char_length(btrim(recipient_name)) between 2 and 100),
  constraint newsletter_campaign_recipients_email_length check (char_length(btrim(recipient_email::text)) between 3 and 254),
  constraint newsletter_campaign_recipients_attempts check (attempts between 0 and 3),
  constraint newsletter_campaign_recipients_unsubscribe_hash check (unsubscribe_token_hash is null or unsubscribe_token_hash ~ '^[0-9a-f]{64}$'),
  constraint newsletter_campaign_recipients_error_length check (error_message is null or char_length(error_message) <= 1000),
  constraint newsletter_campaign_recipients_sent_consistency check (
    (status = 'sent' and sent_at is not null) or (status <> 'sent' and sent_at is null)
  )
);

create trigger newsletter_campaigns_set_updated_at
before update on public.newsletter_campaigns
for each row execute function private.set_updated_at();

create trigger newsletter_campaign_recipients_set_updated_at
before update on public.newsletter_campaign_recipients
for each row execute function private.set_updated_at();

create or replace function private.protect_started_newsletter_campaign()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.sending_started_at is not null and (
    new.internal_title is distinct from old.internal_title
    or new.subject is distinct from old.subject
    or new.preheader is distinct from old.preheader
    or new.content is distinct from old.content
    or new.scheduled_at is distinct from old.scheduled_at
  ) then
    raise exception 'Campanhas iniciadas são imutáveis';
  end if;
  return new;
end;
$$;

revoke all on function private.protect_started_newsletter_campaign() from public, anon, authenticated;

create trigger newsletter_campaigns_protect_started
before update on public.newsletter_campaigns
for each row execute function private.protect_started_newsletter_campaign();

create or replace function private.protect_newsletter_campaign_delete()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.status <> 'draft' then
    raise exception 'Somente campanhas em rascunho podem ser excluídas';
  end if;
  return old;
end;
$$;

revoke all on function private.protect_newsletter_campaign_delete() from public, anon, authenticated;

create trigger newsletter_campaigns_protect_delete
before delete on public.newsletter_campaigns
for each row execute function private.protect_newsletter_campaign_delete();
