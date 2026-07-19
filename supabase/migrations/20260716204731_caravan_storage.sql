insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'caravan-images',
  'caravan-images',
  false,
  8388608,
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create or replace function private.is_public_caravan_asset(object_name text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.caravans
    where published = true
      and object_name in (
        card_image_url,
        hero_image_url,
        video_thumbnail_url,
        leader_image_url
      )
  )
  or exists (
    select 1
    from public.caravan_images
    join public.caravans on caravans.id = caravan_images.caravan_id
    where caravans.published = true
      and caravan_images.image_url = object_name
  )
  or exists (
    select 1
    from public.caravan_itinerary_days
    join public.caravans on caravans.id = caravan_itinerary_days.caravan_id
    where caravans.published = true
      and caravan_itinerary_days.image_url = object_name
  );
$$;

revoke all on function private.is_public_caravan_asset(text) from public, anon, authenticated;
grant usage on schema private to anon;
grant execute on function private.is_active_staff() to anon;
grant execute on function private.is_public_caravan_asset(text) to anon, authenticated;

create policy caravan_storage_public_select
on storage.objects for select to anon, authenticated
using (
  bucket_id = 'caravan-images'
  and (
    (select private.is_active_staff())
    or (select private.is_public_caravan_asset(name))
  )
);

create policy caravan_storage_staff_insert
on storage.objects for insert to authenticated
with check (
  bucket_id = 'caravan-images'
  and (select private.is_active_staff())
  and (storage.foldername(name))[1] ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
);

create policy caravan_storage_staff_update
on storage.objects for update to authenticated
using (bucket_id = 'caravan-images' and (select private.is_active_staff()))
with check (bucket_id = 'caravan-images' and (select private.is_active_staff()));

create policy caravan_storage_staff_delete
on storage.objects for delete to authenticated
using (bucket_id = 'caravan-images' and (select private.is_active_staff()));
