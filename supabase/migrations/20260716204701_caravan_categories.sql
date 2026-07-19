create table public.caravan_categories (
  id uuid primary key default extensions.gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  active boolean not null default true,
  sort_order integer not null default 0 check (sort_order >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint caravan_categories_name_not_blank check (length(trim(name)) > 0),
  constraint caravan_categories_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

create index caravan_categories_active_sort_idx
on public.caravan_categories (active, sort_order, name);

create trigger caravan_categories_set_updated_at
before update on public.caravan_categories
for each row execute function private.set_updated_at();

insert into public.caravan_categories (name, slug, sort_order)
values
  ('Religioso', 'religioso', 10),
  ('Turístico', 'turistico', 20),
  ('Cultural', 'cultural', 30),
  ('Internacional', 'internacional', 40),
  ('Nacional', 'nacional', 50)
on conflict (slug) do update
set name = excluded.name,
    sort_order = excluded.sort_order;
