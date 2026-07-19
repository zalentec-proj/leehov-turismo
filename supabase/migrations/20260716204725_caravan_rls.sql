alter table public.profiles enable row level security;
alter table public.caravan_categories enable row level security;
alter table public.caravans enable row level security;
alter table public.caravan_departures enable row level security;
alter table public.caravan_itinerary_days enable row level security;
alter table public.caravan_images enable row level security;

revoke all on public.profiles from anon, authenticated;
revoke all on public.caravan_categories from anon, authenticated;
revoke all on public.caravans from anon, authenticated;
revoke all on public.caravan_departures from anon, authenticated;
revoke all on public.caravan_itinerary_days from anon, authenticated;
revoke all on public.caravan_images from anon, authenticated;

grant select on public.caravan_categories, public.caravans,
  public.caravan_departures, public.caravan_itinerary_days, public.caravan_images
to anon;

grant select on public.profiles to authenticated;
grant update (name, role, active) on public.profiles to authenticated;
grant select, insert, update, delete on public.caravan_categories to authenticated;
grant select, insert, update on public.caravans to authenticated;
grant select, insert, update, delete on public.caravan_departures to authenticated;
grant select, insert, update, delete on public.caravan_itinerary_days to authenticated;
grant select, insert, update, delete on public.caravan_images to authenticated;

create policy profiles_select_own_or_admin
on public.profiles for select to authenticated
using (id = (select auth.uid()) or (select private.is_admin()));

create policy profiles_update_admin
on public.profiles for update to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));

create policy caravan_categories_public_select
on public.caravan_categories for select to anon, authenticated
using (active = true or (select private.is_active_staff()));

create policy caravan_categories_admin_insert
on public.caravan_categories for insert to authenticated
with check ((select private.is_admin()));

create policy caravan_categories_admin_update
on public.caravan_categories for update to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));

create policy caravan_categories_admin_delete
on public.caravan_categories for delete to authenticated
using ((select private.is_admin()));

create policy caravans_public_or_staff_select
on public.caravans for select to anon, authenticated
using (published = true or (select private.is_active_staff()));

create policy caravans_staff_insert
on public.caravans for insert to authenticated
with check ((select private.is_active_staff()));

create policy caravans_staff_update
on public.caravans for update to authenticated
using ((select private.is_active_staff()))
with check ((select private.is_active_staff()));

create policy caravan_departures_public_or_staff_select
on public.caravan_departures for select to anon, authenticated
using (
  (select private.is_active_staff())
  or exists (
    select 1 from public.caravans
    where caravans.id = caravan_departures.caravan_id
      and caravans.published = true
  )
);

create policy caravan_departures_staff_insert
on public.caravan_departures for insert to authenticated
with check ((select private.is_active_staff()));
create policy caravan_departures_staff_update
on public.caravan_departures for update to authenticated
using ((select private.is_active_staff())) with check ((select private.is_active_staff()));
create policy caravan_departures_staff_delete
on public.caravan_departures for delete to authenticated
using ((select private.is_active_staff()));

create policy caravan_itinerary_days_public_or_staff_select
on public.caravan_itinerary_days for select to anon, authenticated
using (
  (select private.is_active_staff())
  or exists (
    select 1 from public.caravans
    where caravans.id = caravan_itinerary_days.caravan_id
      and caravans.published = true
  )
);

create policy caravan_itinerary_days_staff_insert
on public.caravan_itinerary_days for insert to authenticated
with check ((select private.is_active_staff()));
create policy caravan_itinerary_days_staff_update
on public.caravan_itinerary_days for update to authenticated
using ((select private.is_active_staff())) with check ((select private.is_active_staff()));
create policy caravan_itinerary_days_staff_delete
on public.caravan_itinerary_days for delete to authenticated
using ((select private.is_active_staff()));

create policy caravan_images_public_or_staff_select
on public.caravan_images for select to anon, authenticated
using (
  (select private.is_active_staff())
  or exists (
    select 1 from public.caravans
    where caravans.id = caravan_images.caravan_id
      and caravans.published = true
  )
);

create policy caravan_images_staff_insert
on public.caravan_images for insert to authenticated
with check ((select private.is_active_staff()));
create policy caravan_images_staff_update
on public.caravan_images for update to authenticated
using ((select private.is_active_staff())) with check ((select private.is_active_staff()));
create policy caravan_images_staff_delete
on public.caravan_images for delete to authenticated
using ((select private.is_active_staff()));
