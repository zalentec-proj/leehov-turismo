-- Sprint 05: Google integration privileges, public cache policy and retention.
alter table public.google_business_connections enable row level security;

revoke all on public.google_business_connections from anon, authenticated;
grant select, insert, update, delete on public.google_business_connections to service_role;

grant usage on type public.google_business_connection_status, public.google_review_reply_status
to service_role;

grant select, insert, update, delete on public.google_reviews_cache to service_role;
grant select, update on public.google_business_settings to service_role;

drop policy if exists google_reviews_public_select on public.google_reviews_cache;
drop policy if exists google_reviews_authenticated_select on public.google_reviews_cache;
drop policy if exists google_reviews_staff_update on public.google_reviews_cache;

create policy google_reviews_public_select
on public.google_reviews_cache for select to anon
using (visible = true and expires_at > now());

create policy google_reviews_authenticated_select
on public.google_reviews_cache for select to authenticated
using (
  (visible = true and expires_at > now())
  or (select private.is_active_staff())
);

create policy google_reviews_staff_update
on public.google_reviews_cache for update to authenticated
using ((select private.is_active_staff()))
with check ((select private.is_active_staff()));

revoke update on public.google_reviews_cache from authenticated;
grant update (visible, featured, updated_by) on public.google_reviews_cache to authenticated;

create extension if not exists pg_cron;

create or replace function private.cleanup_expired_google_reviews()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  deleted_count integer;
begin
  delete from public.google_reviews_cache
  where expires_at <= now();

  get diagnostics deleted_count = row_count;
  return deleted_count;
end;
$$;

revoke all on function private.cleanup_expired_google_reviews() from public, anon, authenticated;

do $$
begin
  if not exists (
    select 1 from cron.job where jobname = 'leehov-cleanup-expired-google-reviews'
  ) then
    perform cron.schedule(
      'leehov-cleanup-expired-google-reviews',
      '23 3 * * *',
      'select private.cleanup_expired_google_reviews()'
    );
  end if;
end;
$$;
