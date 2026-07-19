create or replace function private.is_active_staff()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.role()) = 'authenticated'
    and exists (
      select 1
      from public.profiles
      where id = (select auth.uid())
        and active = true
        and role in ('admin', 'editor')
    );
$$;

create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.role()) = 'authenticated'
    and exists (
      select 1
      from public.profiles
      where id = (select auth.uid())
        and active = true
        and role = 'admin'
    );
$$;
