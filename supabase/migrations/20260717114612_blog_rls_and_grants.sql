alter table public.blog_categories enable row level security;
alter table public.blog_posts enable row level security;
alter table public.blog_post_images enable row level security;

revoke all on public.blog_categories from anon, authenticated;
revoke all on public.blog_posts from anon, authenticated;
revoke all on public.blog_post_images from anon, authenticated;

grant select on public.blog_categories, public.blog_posts, public.blog_post_images to anon;
grant select, insert, update on public.blog_categories to authenticated;
grant select, insert, update, delete on public.blog_posts to authenticated;
grant select, insert, update, delete on public.blog_post_images to authenticated;

create policy blog_categories_public_or_staff_select
on public.blog_categories for select to anon, authenticated
using (
  (select private.is_active_staff())
  or exists (
    select 1
    from public.blog_posts
    where blog_posts.category_id = blog_categories.id
      and blog_posts.published = true
  )
);

create policy blog_categories_staff_insert
on public.blog_categories for insert to authenticated
with check ((select private.is_active_staff()));

create policy blog_categories_staff_update
on public.blog_categories for update to authenticated
using ((select private.is_active_staff()))
with check ((select private.is_active_staff()));

create policy blog_posts_public_or_staff_select
on public.blog_posts for select to anon, authenticated
using (published = true or (select private.is_active_staff()));

create policy blog_posts_staff_insert
on public.blog_posts for insert to authenticated
with check ((select private.is_active_staff()));

create policy blog_posts_staff_update
on public.blog_posts for update to authenticated
using ((select private.is_active_staff()))
with check ((select private.is_active_staff()));

create policy blog_posts_staff_delete_draft
on public.blog_posts for delete to authenticated
using ((select private.is_active_staff()) and published = false);

create policy blog_post_images_public_or_staff_select
on public.blog_post_images for select to anon, authenticated
using (
  (select private.is_active_staff())
  or exists (
    select 1
    from public.blog_posts
    where blog_posts.id = blog_post_images.blog_post_id
      and blog_posts.published = true
  )
);

create policy blog_post_images_staff_insert
on public.blog_post_images for insert to authenticated
with check ((select private.is_active_staff()));

create policy blog_post_images_staff_update
on public.blog_post_images for update to authenticated
using ((select private.is_active_staff()))
with check ((select private.is_active_staff()));

create policy blog_post_images_staff_delete
on public.blog_post_images for delete to authenticated
using ((select private.is_active_staff()));
