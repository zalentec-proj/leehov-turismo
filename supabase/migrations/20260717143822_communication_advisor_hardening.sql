-- Keep the rate-limit ledger inaccessible to browser roles while making the
-- deny-by-default rule explicit and auditable.
create policy "form_rate_limits_deny_client_access"
on public.form_rate_limits
for all
to anon, authenticated
using (false)
with check (false);
