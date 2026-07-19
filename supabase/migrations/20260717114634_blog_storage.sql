insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'blog-images',
  'blog-images',
  false,
  8388608,
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create or replace function private.is_public_blog_asset(object_name text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.blog_posts
    where published = true
      and cover_image_url = object_name
  )
  or exists (
    select 1
    from public.blog_post_images
    join public.blog_posts on blog_posts.id = blog_post_images.blog_post_id
    where blog_posts.published = true
      and blog_post_images.image_url = object_name
  );
$$;

revoke all on function private.is_public_blog_asset(text) from public, anon, authenticated;
grant execute on function private.is_public_blog_asset(text) to anon, authenticated;

create policy blog_storage_public_or_staff_select
on storage.objects for select to anon, authenticated
using (
  bucket_id = 'blog-images'
  and (
    (select private.is_active_staff())
    or (select private.is_public_blog_asset(name))
  )
);

create policy blog_storage_staff_insert
on storage.objects for insert to authenticated
with check (
  bucket_id = 'blog-images'
  and (select private.is_active_staff())
  and (storage.foldername(name))[1] ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
  and (storage.foldername(name))[2] in ('cover', 'gallery')
);

create policy blog_storage_staff_update
on storage.objects for update to authenticated
using (bucket_id = 'blog-images' and (select private.is_active_staff()))
with check (
  bucket_id = 'blog-images'
  and (select private.is_active_staff())
  and (storage.foldername(name))[2] in ('cover', 'gallery')
);

create policy blog_storage_staff_delete
on storage.objects for delete to authenticated
using (bucket_id = 'blog-images' and (select private.is_active_staff()));
