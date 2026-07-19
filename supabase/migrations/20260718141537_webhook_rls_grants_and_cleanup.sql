-- Sprint 05: service-only webhook secrets, explicit grants and log retention.
alter table public.webhooks enable row level security;
alter table public.webhook_logs enable row level security;

revoke all on public.webhooks from anon, authenticated;
revoke all on public.webhook_logs from anon, authenticated;

grant select, insert, update, delete on public.webhooks to service_role;
grant select, insert, update, delete on public.webhook_logs to service_role;
grant usage on type public.webhook_event, public.webhook_delivery_status to service_role;

create or replace function private.cleanup_expired_webhook_logs()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  deleted_count integer;
begin
  delete from public.webhook_logs
  where created_at < now() - interval '90 days';

  get diagnostics deleted_count = row_count;
  return deleted_count;
end;
$$;

revoke all on function private.cleanup_expired_webhook_logs() from public, anon, authenticated;

do $$
begin
  if not exists (
    select 1 from cron.job where jobname = 'leehov-cleanup-expired-webhook-logs'
  ) then
    perform cron.schedule(
      'leehov-cleanup-expired-webhook-logs',
      '41 3 * * *',
      'select private.cleanup_expired_webhook_logs()'
    );
  end if;
end;
$$;
