-- Sprint 04: reusable private media catalog.
create table public.media_assets (
  id uuid primary key default gen_random_uuid(),
  storage_path text not null unique,
  file_name text not null,
  mime_type text not null,
  file_size bigint not null,
  alt_text text,
  caption text,
  folder text not null default 'general',
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint media_assets_storage_path_not_blank check (length(trim(storage_path)) > 0 and storage_path !~ '(^|/)\.\.(/|$)'),
  constraint media_assets_file_name_not_blank check (length(trim(file_name)) between 1 and 255),
  constraint media_assets_mime_allowed check (mime_type in ('image/jpeg', 'image/png', 'image/webp', 'image/avif')),
  constraint media_assets_file_size_allowed check (file_size between 1 and 8388608),
  constraint media_assets_alt_length check (alt_text is null or length(alt_text) <= 300),
  constraint media_assets_caption_length check (caption is null or length(caption) <= 500),
  constraint media_assets_folder_format check (folder ~ '^[a-z0-9][a-z0-9_-]{0,49}$')
);

create index media_assets_folder_created_at_idx on public.media_assets (folder, created_at desc);
create index media_assets_created_by_idx on public.media_assets (created_by) where created_by is not null;

create trigger media_assets_set_updated_at
before update on public.media_assets
for each row execute function private.set_updated_at();
