-- Unifica o catálogo de mídia sem copiar objetos entre buckets.
-- Os paths legados continuam válidos; novos uploads usam site-media.
alter table public.media_assets
  add column storage_bucket text not null default 'site-media',
  add column source_type text not null default 'general',
  add column source_id uuid,
  add column source_label text,
  add column tags text[] not null default '{}';

alter table public.media_assets
  add constraint media_assets_storage_bucket_allowed
    check (storage_bucket in ('site-media', 'caravan-images', 'blog-images')),
  add constraint media_assets_source_type_format
    check (source_type ~ '^[a-z][a-z0-9_-]{0,49}$'),
  add constraint media_assets_source_label_length
    check (source_label is null or length(source_label) <= 180),
  add constraint media_assets_tags_limit
    check (cardinality(tags) <= 20 and array_position(tags, null) is null);

create index media_assets_source_idx
  on public.media_assets (source_type, source_id)
  where source_id is not null;
create index media_assets_tags_gin_idx on public.media_assets using gin (tags);
create index media_assets_bucket_path_idx on public.media_assets (storage_bucket, storage_path);

alter table public.caravan_images drop constraint if exists caravan_images_image_url_key;
alter table public.caravan_images
  add constraint caravan_images_caravan_path_key unique (caravan_id, image_url);

update public.media_assets
set source_type = case folder
  when 'popups' then 'popup'
  when 'testimonials' then 'testimonial'
  when 'seo' then 'seo'
  when 'home' then 'home'
  else 'general'
end,
tags = array[folder]
where tags = '{}';

create temporary table media_asset_backfill_refs on commit drop as
select distinct * from (
  select c.card_image_url as storage_path, 'caravan-images'::text as storage_bucket,
    'packages'::text as folder, 'package'::text as source_type, c.id as source_id,
    c.title as source_label, 'card'::text as tag
  from public.caravans c where c.card_image_url is not null and c.card_image_url !~ '^https?://'
  union all
  select c.hero_image_url, 'caravan-images', 'packages', 'package', c.id, c.title, 'hero'
  from public.caravans c where c.hero_image_url is not null and c.hero_image_url !~ '^https?://'
  union all
  select c.leader_image_url, 'caravan-images', 'packages', 'package', c.id, c.title, 'leader'
  from public.caravans c where c.leader_image_url is not null and c.leader_image_url !~ '^https?://'
  union all
  select c.video_thumbnail_url, 'caravan-images', 'packages', 'package', c.id, c.title, 'video'
  from public.caravans c where c.video_thumbnail_url is not null and c.video_thumbnail_url !~ '^https?://'
  union all
  select ci.image_url, 'caravan-images', 'packages', 'package', c.id, c.title, 'gallery'
  from public.caravan_images ci join public.caravans c on c.id = ci.caravan_id
  where ci.image_url !~ '^https?://'
  union all
  select d.image_url, 'caravan-images', 'packages', 'package', c.id, c.title, 'itinerary'
  from public.caravan_itinerary_days d join public.caravans c on c.id = d.caravan_id
  where d.image_url is not null and d.image_url !~ '^https?://'
  union all
  select p.cover_image_url, 'blog-images', 'blog', 'blog_post', p.id, p.title, 'cover'
  from public.blog_posts p where p.cover_image_url is not null and p.cover_image_url !~ '^https?://'
  union all
  select i.image_url, 'blog-images', 'blog', 'blog_post', p.id, p.title, 'gallery'
  from public.blog_post_images i join public.blog_posts p on p.id = i.blog_post_id
  where i.image_url !~ '^https?://'
) references_with_roles
where storage_path is not null and length(trim(storage_path)) > 0;

insert into public.media_assets (
  storage_path, storage_bucket, file_name, mime_type, file_size, folder,
  source_type, source_id, source_label, tags, created_at, updated_at
)
select
  refs.storage_path,
  refs.storage_bucket,
  regexp_replace(refs.storage_path, '^.*/', ''),
  case
    when lower(refs.storage_path) like '%.webp' then 'image/webp'
    when lower(refs.storage_path) like '%.avif' then 'image/avif'
    when lower(refs.storage_path) like '%.png' then 'image/png'
    when lower(refs.storage_path) like '%.jpg' or lower(refs.storage_path) like '%.jpeg' then 'image/jpeg'
    when objects.metadata->>'mimetype' in ('image/jpeg', 'image/png', 'image/webp', 'image/avif') then objects.metadata->>'mimetype'
    else 'image/jpeg'
  end,
  greatest(coalesce(nullif(objects.metadata->>'size', '')::bigint, 1), 1),
  min(refs.folder),
  min(refs.source_type),
  min(refs.source_id::text)::uuid,
  min(refs.source_label),
  array_agg(distinct refs.tag order by refs.tag)
    || array[min(refs.source_type), 'origin:' || min(refs.source_id::text)],
  coalesce(objects.created_at, now()),
  now()
from media_asset_backfill_refs refs
join storage.objects objects
  on objects.bucket_id = refs.storage_bucket and objects.name = refs.storage_path
left join public.media_assets existing on existing.storage_path = refs.storage_path
where existing.id is null
group by refs.storage_path, refs.storage_bucket, objects.metadata, objects.created_at;

drop policy if exists site_media_permission_insert on storage.objects;
create policy site_media_permission_insert on storage.objects for insert to authenticated
with check (
  bucket_id = 'site-media'
  and (select private.has_permission('media.upload'))
  and (storage.foldername(name))[1] in (
    'general', 'packages', 'blog', 'testimonials', 'popups', 'seo', 'home'
  )
  and (storage.foldername(name))[2] ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
);

comment on column public.media_assets.storage_bucket is
  'Bucket real do objeto; permite catalogar mídia legada sem duplicar Storage.';
comment on column public.media_assets.source_type is
  'Origem inicial do upload, por exemplo package, blog_post ou popup.';
comment on column public.media_assets.source_id is
  'ID da entidade que originou o primeiro upload, quando disponível.';
comment on column public.media_assets.tags is
  'Tags pesquisáveis para função, origem e organização editorial.';
