-- Sprint 04: conversion pop-ups and typed site configuration.
create type public.popup_type as enum ('campaign', 'newsletter', 'whatsapp', 'caravan');
create type public.popup_display_location as enum ('home', 'blog', 'caravans', 'sitewide');
create type public.popup_frequency as enum ('always', 'session', 'daily', 'weekly');

create table public.popups (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  image_asset_id uuid references public.media_assets(id) on delete restrict,
  button_text text,
  button_url text,
  popup_type public.popup_type not null,
  related_caravan_id uuid references public.caravans(id) on delete restrict,
  display_location public.popup_display_location not null default 'sitewide',
  frequency public.popup_frequency not null default 'weekly',
  active boolean not null default false,
  created_by uuid references public.profiles(id) on delete set null,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint popups_title_not_blank check (length(trim(title)) between 3 and 140),
  constraint popups_description_length check (description is null or length(description) <= 1200),
  constraint popups_button_text_length check (button_text is null or length(trim(button_text)) between 1 and 100),
  constraint popups_button_url_safe check (
    button_url is null
    or (button_url ~ '^/' and button_url !~ '^//' and button_url !~ '[[:cntrl:]]')
    or (button_url ~ '^https://' and button_url !~ '[[:cntrl:]]')
  ),
  constraint popups_caravan_consistency check (
    (popup_type = 'caravan' and related_caravan_id is not null)
    or (popup_type <> 'caravan' and related_caravan_id is null)
  ),
  constraint popups_cta_consistency check (
    (popup_type = 'campaign' and button_text is not null and button_url is not null)
    or (popup_type in ('whatsapp', 'caravan') and button_text is not null and button_url is null)
    or (popup_type = 'newsletter' and button_text is null and button_url is null)
  )
);

create unique index popups_single_active_idx on public.popups ((active)) where active = true;
create index popups_active_location_idx on public.popups (display_location, updated_at desc) where active = true;
create index popups_image_asset_id_idx on public.popups (image_asset_id) where image_asset_id is not null;
create index popups_related_caravan_id_idx on public.popups (related_caravan_id) where related_caravan_id is not null;
create index popups_created_by_idx on public.popups (created_by) where created_by is not null;
create index popups_updated_by_idx on public.popups (updated_by) where updated_by is not null;

create trigger popups_set_updated_at
before update on public.popups
for each row execute function private.set_updated_at();

create table public.site_settings (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  value jsonb not null default '{}'::jsonb,
  media_asset_id uuid references public.media_assets(id) on delete restrict,
  public_read boolean not null default false,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint site_settings_key_format check (key ~ '^[a-z][a-z0-9_]{1,63}$'),
  constraint site_settings_value_object check (jsonb_typeof(value) = 'object')
);

create index site_settings_public_key_idx on public.site_settings (key) where public_read = true;
create index site_settings_media_asset_id_idx on public.site_settings (media_asset_id) where media_asset_id is not null;
create index site_settings_updated_by_idx on public.site_settings (updated_by) where updated_by is not null;

create trigger site_settings_set_updated_at
before update on public.site_settings
for each row execute function private.set_updated_at();
