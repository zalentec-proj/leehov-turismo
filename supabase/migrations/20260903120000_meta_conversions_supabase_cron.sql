-- The retry endpoint remains in Next.js so it can use the existing Meta/RD
-- integration code. Supabase owns the schedule because this Vercel team is on
-- Hobby, where a 15-minute Vercel Cron is not available.
--
-- Required Vault entries (created outside version control):
--   leehov_meta_conversions_retry_url
--   leehov_meta_conversions_retry_token

create or replace function private.dispatch_meta_conversions_retry()
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
  where name = 'leehov_meta_conversions_retry_url'
  limit 1;

  select decrypted_secret into bearer_token
  from vault.decrypted_secrets
  where name = 'leehov_meta_conversions_retry_token'
  limit 1;

  -- Until Production credentials are provisioned, keep the job harmless.
  if endpoint is null or bearer_token is null or endpoint !~ '^https://' then
    return false;
  end if;

  perform net.http_get(
    url := endpoint,
    headers := jsonb_build_object(
      'authorization', 'Bearer ' || bearer_token
    ),
    timeout_milliseconds := 10_000
  );

  return true;
end;
$$;

revoke all on function private.dispatch_meta_conversions_retry() from public, anon, authenticated;

do $$
begin
  if not exists (
    select 1
    from cron.job
    where jobname = 'leehov-meta-conversions-retry-every-15-minutes'
  ) then
    perform cron.schedule(
      'leehov-meta-conversions-retry-every-15-minutes',
      '*/15 * * * *',
      'select private.dispatch_meta_conversions_retry()'
    );
  end if;
end;
$$;
