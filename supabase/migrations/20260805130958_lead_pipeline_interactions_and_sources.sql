alter table public.leads
  drop constraint leads_email_not_blank,
  drop constraint leads_message_not_blank,
  drop constraint leads_source_allowed,
  drop constraint leads_caravan_source_consistency;

alter table public.leads
  alter column email drop not null,
  alter column message drop not null,
  add column assigned_to uuid references public.profiles(id) on delete set null,
  add column next_follow_up_at timestamptz,
  add constraint leads_email_optional check (
    email is null or char_length(btrim(email::text)) between 3 and 254
  ),
  add constraint leads_message_optional check (
    message is null or char_length(btrim(message)) between 1 and 2000
  ),
  add constraint leads_source_allowed check (
    source in (
      'contact', 'caravan_interest', 'popup',
      'manual', 'whatsapp', 'phone', 'referral', 'social', 'other'
    )
  ),
  add constraint leads_caravan_source_consistency check (
    source <> 'caravan_interest' or caravan_id is not null
  );

create type public.lead_interaction_type as enum (
  'note',
  'status_change',
  'assignment',
  'follow_up',
  'call',
  'whatsapp',
  'profile_update'
);

create table public.lead_interactions (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete restrict,
  interaction_type public.lead_interaction_type not null,
  title text not null,
  body text,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint lead_interactions_title_length check (char_length(btrim(title)) between 2 and 160),
  constraint lead_interactions_body_length check (body is null or char_length(body) <= 4000),
  constraint lead_interactions_metadata_object check (jsonb_typeof(metadata) = 'object')
);
