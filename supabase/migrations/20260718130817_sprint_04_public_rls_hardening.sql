-- Keep privileged helper functions private by separating public and staff policies.
drop policy if exists testimonials_public_or_staff_select on public.testimonials;
create policy testimonials_public_select
on public.testimonials for select to anon
using (active = true);
create policy testimonials_authenticated_select
on public.testimonials for select to authenticated
using (active = true or (select private.is_active_staff()));

drop policy if exists google_reviews_public_or_staff_select on public.google_reviews_cache;
create policy google_reviews_public_select
on public.google_reviews_cache for select to anon
using (visible = true);
create policy google_reviews_authenticated_select
on public.google_reviews_cache for select to authenticated
using (visible = true or (select private.is_active_staff()));

drop policy if exists popups_public_or_staff_select on public.popups;
create policy popups_public_select
on public.popups for select to anon
using (active = true);
create policy popups_authenticated_select
on public.popups for select to authenticated
using (active = true or (select private.is_active_staff()));

drop policy if exists site_settings_public_or_admin_select on public.site_settings;
create policy site_settings_public_select
on public.site_settings for select to anon
using (public_read = true);
create policy site_settings_authenticated_select
on public.site_settings for select to authenticated
using (public_read = true or (select private.is_admin()));
