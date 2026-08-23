-- Keep only keyed HMAC identifiers. Raw IP addresses are never persisted.
alter table public.form_rate_limits
  drop constraint if exists form_rate_limits_scope_allowed;

alter table public.form_rate_limits
  add constraint form_rate_limits_scope_allowed check (
    scope in ('contact', 'caravan_interest', 'newsletter', 'login', 'password_recovery')
  );

create or replace function public.consume_form_rate_limit(
  p_scope text,
  p_identifier_hash text,
  p_limit smallint default 5,
  p_window_seconds integer default 900
)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_window_started_at timestamptz;
  v_attempts smallint;
begin
  if p_scope not in ('contact', 'caravan_interest', 'newsletter', 'login', 'password_recovery')
     or p_identifier_hash !~ '^[0-9a-f]{64}$'
     or p_limit < 1
     or p_limit > 20
     or p_window_seconds < 60
     or p_window_seconds > 86400 then
    raise exception 'Invalid form rate limit parameters.';
  end if;

  v_window_started_at := to_timestamp(
    floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds
  );

  insert into public.form_rate_limits (
    scope,
    identifier_hash,
    window_started_at,
    attempts,
    last_attempt_at
  )
  values (
    p_scope,
    p_identifier_hash,
    v_window_started_at,
    1,
    now()
  )
  on conflict (scope, identifier_hash, window_started_at)
  do update set
    attempts = public.form_rate_limits.attempts + 1,
    last_attempt_at = now()
  returning attempts into v_attempts;

  return v_attempts <= p_limit;
end;
$$;

revoke all on function public.consume_form_rate_limit(text, text, smallint, integer)
from public, anon, authenticated;

grant execute on function public.consume_form_rate_limit(text, text, smallint, integer)
to service_role;
