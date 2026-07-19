create type public.app_role as enum ('admin', 'editor');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
  email extensions.citext not null unique,
  role public.app_role not null default 'editor',
  active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index profiles_role_idx on public.profiles (role);
create index profiles_active_role_idx on public.profiles (active, role);

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function private.set_updated_at();

create or replace function private.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, name, email, role, active)
  values (
    new.id,
    nullif(trim(coalesce(new.raw_user_meta_data ->> 'name', new.raw_user_meta_data ->> 'full_name', '')), ''),
    new.email,
    'editor',
    false
  )
  on conflict (id) do update
    set email = excluded.email,
        name = coalesce(public.profiles.name, excluded.name);
  return new;
end;
$$;

revoke all on function private.handle_new_auth_user() from public, anon, authenticated;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function private.handle_new_auth_user();

insert into public.profiles (id, name, email, role, active)
select
  users.id,
  nullif(trim(coalesce(users.raw_user_meta_data ->> 'name', users.raw_user_meta_data ->> 'full_name', '')), ''),
  users.email,
  'editor',
  false
from auth.users as users
where users.email is not null
on conflict (id) do update
  set email = excluded.email,
      name = coalesce(public.profiles.name, excluded.name);

create or replace function private.is_active_staff()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
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
  select exists (
    select 1
    from public.profiles
    where id = (select auth.uid())
      and active = true
      and role = 'admin'
  );
$$;

revoke all on function private.is_active_staff() from public, anon, authenticated;
revoke all on function private.is_admin() from public, anon, authenticated;
grant usage on schema private to authenticated;
grant execute on function private.is_active_staff() to authenticated;
grant execute on function private.is_admin() to authenticated;

create or replace function private.protect_last_active_admin()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.role = 'admin'
     and old.active = true
     and (new.role <> 'admin' or new.active = false)
     and not exists (
       select 1
       from public.profiles
       where id <> old.id
         and role = 'admin'
         and active = true
     ) then
    raise exception 'A aplicação precisa manter ao menos um administrador ativo.';
  end if;
  return new;
end;
$$;

revoke all on function private.protect_last_active_admin() from public, anon, authenticated;

create trigger profiles_protect_last_active_admin
before update on public.profiles
for each row execute function private.protect_last_active_admin();
