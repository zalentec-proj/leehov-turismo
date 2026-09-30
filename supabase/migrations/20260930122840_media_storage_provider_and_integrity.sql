alter table public.media_assets
  add column if not exists storage_provider text not null default 'supabase',
  add column if not exists content_sha256 text,
  add column if not exists storage_migrated_at timestamptz;

alter table public.media_assets
  drop constraint if exists media_assets_storage_provider_allowed,
  add constraint media_assets_storage_provider_allowed
    check (storage_provider in ('supabase', 'r2')),
  drop constraint if exists media_assets_content_sha256_format,
  add constraint media_assets_content_sha256_format
    check (content_sha256 is null or content_sha256 ~ '^[0-9a-f]{64}$');

create index if not exists media_assets_storage_provider_idx
  on public.media_assets (storage_provider, created_at desc);

comment on column public.media_assets.storage_provider is
  'Provider físico do objeto. storage_bucket e storage_path continuam sendo a identidade lógica.';
comment on column public.media_assets.content_sha256 is
  'SHA-256 dos bytes originais, usado para verificar migrações entre providers.';
comment on column public.media_assets.storage_migrated_at is
  'Data em que o objeto foi verificado e promovido ao provider atual.';
