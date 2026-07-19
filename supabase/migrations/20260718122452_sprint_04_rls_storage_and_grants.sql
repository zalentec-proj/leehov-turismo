-- Sprint 04: explicit Data API privileges, RLS and private Storage access.
alter table public.media_assets enable row level security;
alter table public.testimonials enable row level security;
alter table public.google_business_settings enable row level security;
alter table public.google_reviews_cache enable row level security;
alter table public.popups enable row level security;
alter table public.site_settings enable row level security;

revoke all on public.media_assets from anon, authenticated;
revoke all on public.testimonials from anon, authenticated;
revoke all on public.google_business_settings from anon, authenticated;
revoke all on public.google_reviews_cache from anon, authenticated;
revoke all on public.popups from anon, authenticated;
revoke all on public.site_settings from anon, authenticated;

grant usage on type public.review_display_mode, public.popup_type, public.popup_display_location, public.popup_frequency to anon, authenticated, service_role;

grant select on public.testimonials, public.google_reviews_cache, public.popups, public.site_settings to anon;
grant select, insert, update, delete on public.media_assets, public.testimonials, public.popups to authenticated;
grant select on public.google_reviews_cache to authenticated;
grant update (visible, featured, updated_by) on public.google_reviews_cache to authenticated;
grant select, update on public.google_business_settings, public.site_settings to authenticated;

grant select, insert, update, delete on public.media_assets, public.testimonials, public.google_business_settings, public.google_reviews_cache, public.popups, public.site_settings to service_role;

create policy media_assets_staff_select
on public.media_assets for select to authenticated
using ((select private.is_active_staff()));

create policy media_assets_staff_insert
on public.media_assets for insert to authenticated
with check ((select private.is_active_staff()));

create policy media_assets_staff_update
on public.media_assets for update to authenticated
using ((select private.is_active_staff()))
with check ((select private.is_active_staff()));

create policy media_assets_staff_delete
on public.media_assets for delete to authenticated
using ((select private.is_active_staff()));

create policy testimonials_public_or_staff_select
on public.testimonials for select to anon, authenticated
using (active = true or (select private.is_active_staff()));

create policy testimonials_staff_insert
on public.testimonials for insert to authenticated
with check ((select private.is_active_staff()));

create policy testimonials_staff_update
on public.testimonials for update to authenticated
using ((select private.is_active_staff()))
with check ((select private.is_active_staff()));

create policy testimonials_staff_delete_inactive
on public.testimonials for delete to authenticated
using ((select private.is_active_staff()) and active = false);

create policy google_business_settings_admin_select
on public.google_business_settings for select to authenticated
using ((select private.is_admin()));

create policy google_business_settings_admin_update
on public.google_business_settings for update to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));

create policy google_reviews_public_or_staff_select
on public.google_reviews_cache for select to anon, authenticated
using (visible = true or (select private.is_active_staff()));

create policy google_reviews_staff_update
on public.google_reviews_cache for update to authenticated
using ((select private.is_active_staff()))
with check ((select private.is_active_staff()));

create policy popups_public_or_staff_select
on public.popups for select to anon, authenticated
using (active = true or (select private.is_active_staff()));

create policy popups_staff_insert
on public.popups for insert to authenticated
with check ((select private.is_active_staff()));

create policy popups_staff_update
on public.popups for update to authenticated
using ((select private.is_active_staff()))
with check ((select private.is_active_staff()));

create policy popups_staff_delete_inactive
on public.popups for delete to authenticated
using ((select private.is_active_staff()) and active = false);

create policy site_settings_public_or_admin_select
on public.site_settings for select to anon, authenticated
using (public_read = true or (select private.is_admin()));

create policy site_settings_admin_update
on public.site_settings for update to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'site-media',
  'site-media',
  false,
  8388608,
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create policy site_media_staff_select
on storage.objects for select to authenticated
using (bucket_id = 'site-media' and (select private.is_active_staff()));

create policy site_media_staff_insert
on storage.objects for insert to authenticated
with check (
  bucket_id = 'site-media'
  and (select private.is_active_staff())
  and (storage.foldername(name))[1] in ('general', 'testimonials', 'popups', 'seo', 'home')
  and (storage.foldername(name))[2] ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
);

create policy site_media_staff_update
on storage.objects for update to authenticated
using (bucket_id = 'site-media' and (select private.is_active_staff()))
with check (
  bucket_id = 'site-media'
  and (select private.is_active_staff())
  and (storage.foldername(name))[1] in ('general', 'testimonials', 'popups', 'seo', 'home')
);

create policy site_media_staff_delete
on storage.objects for delete to authenticated
using (bucket_id = 'site-media' and (select private.is_active_staff()));
