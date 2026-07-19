alter table public.leads enable row level security;
alter table public.newsletter_subscribers enable row level security;
alter table public.email_logs enable row level security;
alter table public.form_rate_limits enable row level security;

revoke all on public.leads from anon, authenticated;
revoke all on public.newsletter_subscribers from anon, authenticated;
revoke all on public.email_logs from anon, authenticated;
revoke all on public.form_rate_limits from anon, authenticated;

grant select on public.leads to authenticated;
grant update (status, updated_by) on public.leads to authenticated;

grant select (
  id,
  name,
  email,
  source,
  status,
  active,
  confirmation_sent_at,
  confirmed_at,
  unsubscribed_at,
  created_at,
  updated_at
) on public.newsletter_subscribers to authenticated;

grant select on public.email_logs to authenticated;

grant select, insert, update on public.leads to service_role;
grant select, insert, update on public.newsletter_subscribers to service_role;
grant select, insert, update on public.email_logs to service_role;
grant select, insert, update, delete on public.form_rate_limits to service_role;

create policy leads_staff_select
on public.leads for select to authenticated
using ((select private.is_active_staff()));

create policy leads_staff_update
on public.leads for update to authenticated
using ((select private.is_active_staff()))
with check ((select private.is_active_staff()));

create policy newsletter_subscribers_staff_select
on public.newsletter_subscribers for select to authenticated
using ((select private.is_active_staff()));

create policy email_logs_staff_select
on public.email_logs for select to authenticated
using ((select private.is_active_staff()));
