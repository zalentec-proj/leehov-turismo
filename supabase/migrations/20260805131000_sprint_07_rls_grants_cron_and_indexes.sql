alter table public.newsletter_campaigns enable row level security;
alter table public.newsletter_campaign_recipients enable row level security;
alter table public.lead_interactions enable row level security;

revoke all on public.newsletter_campaigns from anon, authenticated;
revoke all on public.newsletter_campaign_recipients from anon, authenticated;
revoke all on public.lead_interactions from anon, authenticated;

grant select, insert, update, delete on public.newsletter_campaigns to service_role;
grant select, insert, update, delete on public.newsletter_campaign_recipients to service_role;
grant select, insert on public.lead_interactions to service_role;
grant usage on type public.newsletter_campaign_status, public.newsletter_recipient_status, public.lead_interaction_type to service_role;

revoke update (status, updated_by) on public.leads from authenticated;
grant select on public.leads to authenticated;
grant select, insert, update on public.leads to service_role;

create index newsletter_campaigns_status_schedule_idx
  on public.newsletter_campaigns (status, scheduled_at)
  where status in ('scheduled', 'sending', 'paused');
create index newsletter_campaigns_created_at_idx on public.newsletter_campaigns (created_at desc);
create index newsletter_campaigns_created_by_idx on public.newsletter_campaigns (created_by) where created_by is not null;
create index newsletter_campaigns_updated_by_idx on public.newsletter_campaigns (updated_by) where updated_by is not null;

create unique index newsletter_campaign_recipients_unsubscribe_hash_idx
  on public.newsletter_campaign_recipients (unsubscribe_token_hash)
  where unsubscribe_token_hash is not null;
create index newsletter_campaign_recipients_claim_idx
  on public.newsletter_campaign_recipients (campaign_id, status, next_attempt_at, created_at)
  where status in ('pending', 'processing', 'failed');
create index newsletter_campaign_recipients_subscriber_idx
  on public.newsletter_campaign_recipients (subscriber_id) where subscriber_id is not null;

create index leads_assigned_to_idx on public.leads (assigned_to) where assigned_to is not null;
create index leads_next_follow_up_idx on public.leads (next_follow_up_at) where next_follow_up_at is not null;
create index lead_interactions_lead_created_idx on public.lead_interactions (lead_id, created_at desc);
create index lead_interactions_created_by_idx on public.lead_interactions (created_by) where created_by is not null;

create extension if not exists pg_net with schema extensions;

create or replace function private.dispatch_due_newsletter_campaigns()
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  endpoint text;
  bearer_token text;
begin
  select decrypted_secret into endpoint
  from vault.decrypted_secrets
  where name = 'leehov_newsletter_cron_url'
  limit 1;

  select decrypted_secret into bearer_token
  from vault.decrypted_secrets
  where name = 'leehov_newsletter_cron_token'
  limit 1;

  if endpoint is null or bearer_token is null or endpoint !~ '^https://' then
    return false;
  end if;

  perform net.http_post(
    url := endpoint,
    headers := jsonb_build_object(
      'content-type', 'application/json',
      'authorization', 'Bearer ' || bearer_token
    ),
    body := jsonb_build_object('source', 'supabase_cron')
  );
  return true;
end;
$$;

revoke all on function private.dispatch_due_newsletter_campaigns() from public, anon, authenticated;

do $$
begin
  if not exists (select 1 from cron.job where jobname = 'leehov-newsletter-campaigns-every-minute') then
    perform cron.schedule(
      'leehov-newsletter-campaigns-every-minute',
      '* * * * *',
      'select private.dispatch_due_newsletter_campaigns()'
    );
  end if;
end;
$$;
