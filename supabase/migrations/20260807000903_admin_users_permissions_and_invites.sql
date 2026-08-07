alter table public.profiles
  add column invited_by uuid references public.profiles(id) on delete set null,
  add column invited_at timestamptz,
  add column accepted_at timestamptz,
  add column suspended_at timestamptz,
  add column suspended_by uuid references public.profiles(id) on delete set null;

update public.profiles
set accepted_at = coalesce(accepted_at, created_at)
where active = true;

create table public.permissions (
  key text primary key check (key ~ '^[a-z][a-z0-9_]*\.[a-z][a-z0-9_]*$'),
  module text not null check (module ~ '^[a-z][a-z0-9_]*$'),
  action text not null check (action ~ '^[a-z][a-z0-9_]*$'),
  label text not null check (length(trim(label)) between 2 and 120),
  description text,
  sort_order integer not null default 0 check (sort_order >= 0),
  created_at timestamptz not null default now()
);

create table public.role_permissions (
  role public.app_role not null,
  permission_key text not null references public.permissions(key) on delete cascade,
  allowed boolean not null default true,
  primary key (role, permission_key)
);

create table public.profile_permission_overrides (
  profile_id uuid not null references public.profiles(id) on delete cascade,
  permission_key text not null references public.permissions(key) on delete cascade,
  allowed boolean not null,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (profile_id, permission_key)
);

create trigger profile_permission_overrides_set_updated_at
before update on public.profile_permission_overrides
for each row execute function private.set_updated_at();

create type public.invitation_status as enum ('pending', 'accepted', 'revoked', 'expired', 'failed');

create table public.user_invitation_attempts (
  id uuid primary key default extensions.gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  invited_by uuid references public.profiles(id) on delete set null,
  status public.invitation_status not null default 'pending',
  email_log_id uuid references public.email_logs(id) on delete set null,
  expires_at timestamptz not null,
  accepted_at timestamptz,
  revoked_at timestamptz,
  error_message text check (error_message is null or length(error_message) <= 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index user_invitation_attempts_profile_created_idx
  on public.user_invitation_attempts (profile_id, created_at desc);
create index user_invitation_attempts_pending_expiry_idx
  on public.user_invitation_attempts (expires_at)
  where status = 'pending';

create trigger user_invitation_attempts_set_updated_at
before update on public.user_invitation_attempts
for each row execute function private.set_updated_at();

create table public.user_email_change_requests (
  id uuid primary key default extensions.gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  requested_by uuid references public.profiles(id) on delete set null,
  old_email extensions.citext not null,
  new_email extensions.citext not null,
  token_hash text not null unique check (token_hash ~ '^[0-9a-f]{64}$'),
  expires_at timestamptz not null,
  consumed_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  check (old_email <> new_email)
);

create index user_email_change_requests_profile_created_idx
  on public.user_email_change_requests (profile_id, created_at desc);

create table public.admin_audit_logs (
  id uuid primary key default extensions.gen_random_uuid(),
  actor_profile_id uuid references public.profiles(id) on delete set null,
  action text not null check (action ~ '^[a-z][a-z0-9_.]*$'),
  target_profile_id uuid,
  target_email extensions.citext,
  previous_values jsonb not null default '{}'::jsonb check (jsonb_typeof(previous_values) = 'object'),
  new_values jsonb not null default '{}'::jsonb check (jsonb_typeof(new_values) = 'object'),
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'),
  created_at timestamptz not null default now()
);

create index admin_audit_logs_target_created_idx
  on public.admin_audit_logs (target_profile_id, created_at desc);
create index admin_audit_logs_actor_created_idx
  on public.admin_audit_logs (actor_profile_id, created_at desc);

create table public.resend_webhook_events (
  event_id text primary key check (length(event_id) between 1 and 255),
  event_type text not null check (length(event_type) between 1 and 100),
  provider_message_id text,
  payload jsonb not null default '{}'::jsonb check (jsonb_typeof(payload) = 'object'),
  received_at timestamptz not null default now()
);

alter table public.email_logs
  add column idempotency_key text unique,
  add column delivered_at timestamptz,
  add column last_event_at timestamptz;

alter type public.email_status add value if not exists 'delivered';
alter type public.email_status add value if not exists 'delayed';
alter type public.email_status add value if not exists 'bounced';
alter type public.email_status add value if not exists 'complained';
alter type public.email_status add value if not exists 'suppressed';

insert into public.permissions (key, module, action, label, sort_order) values
  ('dashboard.view', 'dashboard', 'view', 'Visualizar dashboard', 10),
  ('caravans.view', 'caravans', 'view', 'Visualizar caravanas', 20),
  ('caravans.create', 'caravans', 'create', 'Criar caravanas', 21),
  ('caravans.update', 'caravans', 'update', 'Editar caravanas', 22),
  ('caravans.publish', 'caravans', 'publish', 'Publicar caravanas', 23),
  ('caravans.manage_media', 'caravans', 'manage_media', 'Gerenciar imagens de caravanas', 24),
  ('caravans.manage_categories', 'caravans', 'manage_categories', 'Gerenciar categorias de caravanas', 25),
  ('blog.view', 'blog', 'view', 'Visualizar blog', 30),
  ('blog.create', 'blog', 'create', 'Criar posts', 31),
  ('blog.update', 'blog', 'update', 'Editar posts', 32),
  ('blog.delete_draft', 'blog', 'delete_draft', 'Excluir rascunhos', 33),
  ('blog.publish', 'blog', 'publish', 'Publicar posts', 34),
  ('blog.manage_media', 'blog', 'manage_media', 'Gerenciar imagens do blog', 35),
  ('blog.manage_categories', 'blog', 'manage_categories', 'Gerenciar categorias do blog', 36),
  ('leads.view', 'leads', 'view', 'Visualizar leads', 40),
  ('leads.create', 'leads', 'create', 'Criar leads', 41),
  ('leads.update', 'leads', 'update', 'Editar pipeline de leads', 42),
  ('leads.assign', 'leads', 'assign', 'Atribuir responsáveis', 43),
  ('leads.interact', 'leads', 'interact', 'Registrar interações', 44),
  ('newsletter.view', 'newsletter', 'view', 'Visualizar newsletter', 50),
  ('newsletter.manage_drafts', 'newsletter', 'manage_drafts', 'Gerenciar rascunhos de campanhas', 51),
  ('newsletter.send', 'newsletter', 'send', 'Enviar e agendar campanhas', 52),
  ('newsletter.manage_subscribers', 'newsletter', 'manage_subscribers', 'Gerenciar inscritos', 53),
  ('newsletter.view_logs', 'newsletter', 'view_logs', 'Visualizar logs de e-mail', 54),
  ('testimonials.view', 'testimonials', 'view', 'Visualizar depoimentos', 60),
  ('testimonials.manage', 'testimonials', 'manage', 'Criar e editar depoimentos', 61),
  ('testimonials.delete', 'testimonials', 'delete', 'Excluir depoimentos', 62),
  ('testimonials.publish', 'testimonials', 'publish', 'Publicar depoimentos e avaliações', 63),
  ('testimonials.manage_google', 'testimonials', 'manage_google', 'Administrar Google Business', 64),
  ('popups.view', 'popups', 'view', 'Visualizar pop-ups', 70),
  ('popups.manage', 'popups', 'manage', 'Criar e editar pop-ups', 71),
  ('popups.delete', 'popups', 'delete', 'Excluir pop-ups', 72),
  ('popups.publish', 'popups', 'publish', 'Publicar pop-ups', 73),
  ('media.view', 'media', 'view', 'Visualizar mídia', 80),
  ('media.upload', 'media', 'upload', 'Enviar mídia', 81),
  ('media.update', 'media', 'update', 'Editar mídia', 82),
  ('media.delete', 'media', 'delete', 'Excluir mídia', 83),
  ('settings.view', 'settings', 'view', 'Visualizar configurações', 90),
  ('settings.manage', 'settings', 'manage', 'Alterar configurações', 91),
  ('webhooks.view', 'webhooks', 'view', 'Visualizar webhooks', 100),
  ('webhooks.manage', 'webhooks', 'manage', 'Administrar webhooks', 101),
  ('users.view', 'users', 'view', 'Visualizar usuários', 110),
  ('users.invite', 'users', 'invite', 'Convidar usuários', 111),
  ('users.update', 'users', 'update', 'Editar usuários', 112),
  ('users.manage_permissions', 'users', 'manage_permissions', 'Configurar permissões', 113),
  ('users.suspend', 'users', 'suspend', 'Suspender e reativar usuários', 114),
  ('users.delete', 'users', 'delete', 'Excluir usuários', 115),
  ('users.reset_mfa', 'users', 'reset_mfa', 'Redefinir MFA', 116);

insert into public.role_permissions (role, permission_key)
select 'editor'::public.app_role, key
from public.permissions
where key in (
  'dashboard.view',
  'caravans.view', 'caravans.create', 'caravans.update', 'caravans.publish', 'caravans.manage_media',
  'blog.view', 'blog.create', 'blog.update', 'blog.delete_draft', 'blog.publish', 'blog.manage_media', 'blog.manage_categories',
  'leads.view', 'leads.create', 'leads.update', 'leads.assign', 'leads.interact',
  'newsletter.view', 'newsletter.manage_drafts', 'newsletter.view_logs',
  'testimonials.view', 'testimonials.manage', 'testimonials.delete', 'testimonials.publish',
  'popups.view', 'popups.manage', 'popups.delete', 'popups.publish',
  'media.view', 'media.upload', 'media.update', 'media.delete'
);

create or replace function private.has_permission(permission_name text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((
    select case
      when not profile.active then false
      when profile.role = 'admin' then true
      else coalesce(
        (select override.allowed
         from public.profile_permission_overrides as override
         where override.profile_id = profile.id
           and override.permission_key = permission_name),
        (select role_permission.allowed
         from public.role_permissions as role_permission
         where role_permission.role = profile.role
           and role_permission.permission_key = permission_name),
        false
      )
    end
    from public.profiles as profile
    where profile.id = (select auth.uid())
  ), false);
$$;

revoke all on function private.has_permission(text) from public, anon, authenticated;
grant execute on function private.has_permission(text) to authenticated;

create or replace function public.has_permission(permission_name text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.has_permission(permission_name);
$$;

revoke all on function public.has_permission(text) from public, anon;
grant execute on function public.has_permission(text) to authenticated;

create or replace function public.admin_user_delete_preflight(target_profile_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'caravans', (select count(*) from public.caravans where created_by = target_profile_id),
    'blog_posts', (select count(*) from public.blog_posts where created_by = target_profile_id),
    'leads', (select count(*) from public.leads where assigned_to = target_profile_id),
    'media_assets', (select count(*) from public.media_assets where created_by = target_profile_id),
    'storage_objects', (select count(*) from storage.objects where owner_id = target_profile_id::text)
  );
$$;

revoke all on function public.admin_user_delete_preflight(uuid) from public, anon, authenticated;
grant execute on function public.admin_user_delete_preflight(uuid) to service_role;

create or replace function private.protect_last_active_admin()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  removes_active_admin boolean;
begin
  if tg_op = 'DELETE' then
    removes_active_admin := old.role = 'admin' and old.active = true;
  else
    removes_active_admin := old.role = 'admin'
      and old.active = true
      and (new.role <> 'admin' or new.active = false);
  end if;

  if removes_active_admin and not exists (
    select 1
    from public.profiles
    where id <> old.id
      and role = 'admin'
      and active = true
  ) then
    raise exception 'A aplicação precisa manter ao menos um administrador ativo.';
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_protect_last_active_admin on public.profiles;
create trigger profiles_protect_last_active_admin
before update or delete on public.profiles
for each row execute function private.protect_last_active_admin();

alter table public.permissions enable row level security;
alter table public.role_permissions enable row level security;
alter table public.profile_permission_overrides enable row level security;
alter table public.user_invitation_attempts enable row level security;
alter table public.user_email_change_requests enable row level security;
alter table public.admin_audit_logs enable row level security;
alter table public.resend_webhook_events enable row level security;

revoke all on public.permissions, public.role_permissions,
  public.profile_permission_overrides, public.user_invitation_attempts,
  public.user_email_change_requests, public.admin_audit_logs,
  public.resend_webhook_events from anon, authenticated;

grant select, insert, update, delete on public.permissions, public.role_permissions,
  public.profile_permission_overrides, public.user_invitation_attempts,
  public.user_email_change_requests to service_role;
grant select, insert on public.admin_audit_logs to service_role;
grant select, insert on public.resend_webhook_events to service_role;

grant select, update (name, role, active, invited_by, invited_at, accepted_at, suspended_at, suspended_by)
  on public.profiles to service_role;

create index profiles_invitation_state_idx
  on public.profiles (active, accepted_at, invited_at);

-- Replace broad "active staff" access with the effective permission matrix.
drop policy if exists caravan_categories_admin_insert on public.caravan_categories;
drop policy if exists caravan_categories_admin_update on public.caravan_categories;
drop policy if exists caravan_categories_admin_delete on public.caravan_categories;
create policy caravan_categories_permission_insert on public.caravan_categories for insert to authenticated
with check ((select private.has_permission('caravans.manage_categories')));
create policy caravan_categories_permission_update on public.caravan_categories for update to authenticated
using ((select private.has_permission('caravans.manage_categories')))
with check ((select private.has_permission('caravans.manage_categories')));
create policy caravan_categories_permission_delete on public.caravan_categories for delete to authenticated
using ((select private.has_permission('caravans.manage_categories')));

drop policy if exists caravans_staff_insert on public.caravans;
drop policy if exists caravans_staff_update on public.caravans;
create policy caravans_permission_insert on public.caravans for insert to authenticated
with check ((select private.has_permission('caravans.create')) and (published = false or (select private.has_permission('caravans.publish'))));
create policy caravans_permission_update on public.caravans for update to authenticated
using ((select private.has_permission('caravans.update')))
with check ((select private.has_permission('caravans.update')));

drop policy if exists caravan_departures_staff_insert on public.caravan_departures;
drop policy if exists caravan_departures_staff_update on public.caravan_departures;
drop policy if exists caravan_departures_staff_delete on public.caravan_departures;
create policy caravan_departures_permission_insert on public.caravan_departures for insert to authenticated
with check ((select private.has_permission('caravans.create')) or (select private.has_permission('caravans.update')));
create policy caravan_departures_permission_update on public.caravan_departures for update to authenticated
using ((select private.has_permission('caravans.update')))
with check ((select private.has_permission('caravans.update')));
create policy caravan_departures_permission_delete on public.caravan_departures for delete to authenticated
using ((select private.has_permission('caravans.create')) or (select private.has_permission('caravans.update')));

drop policy if exists caravan_itinerary_days_staff_insert on public.caravan_itinerary_days;
drop policy if exists caravan_itinerary_days_staff_update on public.caravan_itinerary_days;
drop policy if exists caravan_itinerary_days_staff_delete on public.caravan_itinerary_days;
create policy caravan_itinerary_permission_insert on public.caravan_itinerary_days for insert to authenticated
with check ((select private.has_permission('caravans.create')) or (select private.has_permission('caravans.update')));
create policy caravan_itinerary_permission_update on public.caravan_itinerary_days for update to authenticated
using ((select private.has_permission('caravans.update')))
with check ((select private.has_permission('caravans.update')));
create policy caravan_itinerary_permission_delete on public.caravan_itinerary_days for delete to authenticated
using ((select private.has_permission('caravans.create')) or (select private.has_permission('caravans.update')));

drop policy if exists caravan_images_staff_insert on public.caravan_images;
drop policy if exists caravan_images_staff_update on public.caravan_images;
drop policy if exists caravan_images_staff_delete on public.caravan_images;
create policy caravan_images_permission_insert on public.caravan_images for insert to authenticated
with check ((select private.has_permission('caravans.manage_media')) or (select private.has_permission('caravans.create')) or (select private.has_permission('caravans.update')));
create policy caravan_images_permission_update on public.caravan_images for update to authenticated
using ((select private.has_permission('caravans.manage_media')) or (select private.has_permission('caravans.update')))
with check ((select private.has_permission('caravans.manage_media')) or (select private.has_permission('caravans.update')));
create policy caravan_images_permission_delete on public.caravan_images for delete to authenticated
using ((select private.has_permission('caravans.manage_media')) or (select private.has_permission('caravans.create')) or (select private.has_permission('caravans.update')));

drop policy if exists blog_categories_staff_insert on public.blog_categories;
drop policy if exists blog_categories_staff_update on public.blog_categories;
create policy blog_categories_permission_insert on public.blog_categories for insert to authenticated
with check ((select private.has_permission('blog.manage_categories')));
create policy blog_categories_permission_update on public.blog_categories for update to authenticated
using ((select private.has_permission('blog.manage_categories')))
with check ((select private.has_permission('blog.manage_categories')));

drop policy if exists blog_posts_staff_insert on public.blog_posts;
drop policy if exists blog_posts_staff_update on public.blog_posts;
drop policy if exists blog_posts_staff_delete_draft on public.blog_posts;
create policy blog_posts_permission_insert on public.blog_posts for insert to authenticated
with check ((select private.has_permission('blog.create')) and (published = false or (select private.has_permission('blog.publish'))));
create policy blog_posts_permission_update on public.blog_posts for update to authenticated
using ((select private.has_permission('blog.update')))
with check ((select private.has_permission('blog.update')));
create policy blog_posts_permission_delete_draft on public.blog_posts for delete to authenticated
using ((select private.has_permission('blog.delete_draft')) and published = false);

drop policy if exists blog_post_images_staff_insert on public.blog_post_images;
drop policy if exists blog_post_images_staff_update on public.blog_post_images;
drop policy if exists blog_post_images_staff_delete on public.blog_post_images;
create policy blog_images_permission_insert on public.blog_post_images for insert to authenticated
with check ((select private.has_permission('blog.manage_media')) or (select private.has_permission('blog.create')) or (select private.has_permission('blog.update')));
create policy blog_images_permission_update on public.blog_post_images for update to authenticated
using ((select private.has_permission('blog.manage_media')) or (select private.has_permission('blog.update')))
with check ((select private.has_permission('blog.manage_media')) or (select private.has_permission('blog.update')));
create policy blog_images_permission_delete on public.blog_post_images for delete to authenticated
using ((select private.has_permission('blog.manage_media')) or (select private.has_permission('blog.create')) or (select private.has_permission('blog.update')));

drop policy if exists leads_staff_select on public.leads;
drop policy if exists leads_staff_update on public.leads;
create policy leads_permission_select on public.leads for select to authenticated
using ((select private.has_permission('leads.view')));
create policy leads_permission_update on public.leads for update to authenticated
using ((select private.has_permission('leads.update')))
with check ((select private.has_permission('leads.update')));

drop policy if exists newsletter_subscribers_staff_select on public.newsletter_subscribers;
drop policy if exists email_logs_staff_select on public.email_logs;
create policy newsletter_subscribers_permission_select on public.newsletter_subscribers for select to authenticated
using ((select private.has_permission('newsletter.view')));
create policy email_logs_permission_select on public.email_logs for select to authenticated
using ((select private.has_permission('newsletter.view_logs')));

drop policy if exists media_assets_staff_select on public.media_assets;
drop policy if exists media_assets_staff_insert on public.media_assets;
drop policy if exists media_assets_staff_update on public.media_assets;
drop policy if exists media_assets_staff_delete on public.media_assets;
create policy media_assets_permission_select on public.media_assets for select to authenticated
using ((select private.has_permission('media.view')));
create policy media_assets_permission_insert on public.media_assets for insert to authenticated
with check ((select private.has_permission('media.upload')));
create policy media_assets_permission_update on public.media_assets for update to authenticated
using ((select private.has_permission('media.update')))
with check ((select private.has_permission('media.update')));
create policy media_assets_permission_delete on public.media_assets for delete to authenticated
using ((select private.has_permission('media.delete')));

drop policy if exists testimonials_authenticated_select on public.testimonials;
drop policy if exists testimonials_staff_insert on public.testimonials;
drop policy if exists testimonials_staff_update on public.testimonials;
drop policy if exists testimonials_staff_delete_inactive on public.testimonials;
create policy testimonials_permission_select on public.testimonials for select to authenticated
using (active = true or (select private.has_permission('testimonials.view')));
create policy testimonials_permission_insert on public.testimonials for insert to authenticated
with check ((select private.has_permission('testimonials.manage')) and (active = false or (select private.has_permission('testimonials.publish'))));
create policy testimonials_permission_update on public.testimonials for update to authenticated
using ((select private.has_permission('testimonials.manage')))
with check ((select private.has_permission('testimonials.manage')));
create policy testimonials_permission_delete on public.testimonials for delete to authenticated
using ((select private.has_permission('testimonials.delete')) and active = false);

drop policy if exists google_reviews_authenticated_select on public.google_reviews_cache;
drop policy if exists google_reviews_staff_update on public.google_reviews_cache;
create policy google_reviews_permission_select on public.google_reviews_cache for select to authenticated
using ((visible = true and expires_at > now()) or (select private.has_permission('testimonials.view')));
create policy google_reviews_permission_update on public.google_reviews_cache for update to authenticated
using ((select private.has_permission('testimonials.publish')))
with check ((select private.has_permission('testimonials.publish')));

drop policy if exists popups_authenticated_select on public.popups;
drop policy if exists popups_staff_insert on public.popups;
drop policy if exists popups_staff_update on public.popups;
drop policy if exists popups_staff_delete_inactive on public.popups;
create policy popups_permission_select on public.popups for select to authenticated
using (active = true or (select private.has_permission('popups.view')));
create policy popups_permission_insert on public.popups for insert to authenticated
with check ((select private.has_permission('popups.manage')) and (active = false or (select private.has_permission('popups.publish'))));
create policy popups_permission_update on public.popups for update to authenticated
using ((select private.has_permission('popups.manage')))
with check ((select private.has_permission('popups.manage')));
create policy popups_permission_delete on public.popups for delete to authenticated
using ((select private.has_permission('popups.delete')) and active = false);

drop policy if exists site_settings_authenticated_select on public.site_settings;
drop policy if exists site_settings_admin_update on public.site_settings;
create policy site_settings_permission_select on public.site_settings for select to authenticated
using (public_read = true or (select private.has_permission('settings.view')));
create policy site_settings_permission_update on public.site_settings for update to authenticated
using ((select private.has_permission('settings.manage')))
with check ((select private.has_permission('settings.manage')));

drop policy if exists google_business_settings_admin_select on public.google_business_settings;
drop policy if exists google_business_settings_admin_update on public.google_business_settings;
create policy google_business_settings_permission_select on public.google_business_settings for select to authenticated
using ((select private.has_permission('testimonials.manage_google')));
create policy google_business_settings_permission_update on public.google_business_settings for update to authenticated
using ((select private.has_permission('testimonials.manage_google')))
with check ((select private.has_permission('testimonials.manage_google')));

drop policy if exists caravan_storage_staff_insert on storage.objects;
drop policy if exists caravan_storage_staff_update on storage.objects;
drop policy if exists caravan_storage_staff_delete on storage.objects;
create policy caravan_storage_permission_insert on storage.objects for insert to authenticated
with check (bucket_id = 'caravan-images' and (select private.has_permission('caravans.manage_media')));
create policy caravan_storage_permission_update on storage.objects for update to authenticated
using (bucket_id = 'caravan-images' and (select private.has_permission('caravans.manage_media')))
with check (bucket_id = 'caravan-images' and (select private.has_permission('caravans.manage_media')));
create policy caravan_storage_permission_delete on storage.objects for delete to authenticated
using (bucket_id = 'caravan-images' and (select private.has_permission('caravans.manage_media')));

drop policy if exists blog_storage_staff_insert on storage.objects;
drop policy if exists blog_storage_staff_update on storage.objects;
drop policy if exists blog_storage_staff_delete on storage.objects;
create policy blog_storage_permission_insert on storage.objects for insert to authenticated
with check (bucket_id = 'blog-images' and (select private.has_permission('blog.manage_media')));
create policy blog_storage_permission_update on storage.objects for update to authenticated
using (bucket_id = 'blog-images' and (select private.has_permission('blog.manage_media')))
with check (bucket_id = 'blog-images' and (select private.has_permission('blog.manage_media')));
create policy blog_storage_permission_delete on storage.objects for delete to authenticated
using (bucket_id = 'blog-images' and (select private.has_permission('blog.manage_media')));

drop policy if exists site_media_staff_select on storage.objects;
drop policy if exists site_media_staff_insert on storage.objects;
drop policy if exists site_media_staff_update on storage.objects;
drop policy if exists site_media_staff_delete on storage.objects;
create policy site_media_permission_select on storage.objects for select to authenticated
using (bucket_id = 'site-media' and (select private.has_permission('media.view')));
create policy site_media_permission_insert on storage.objects for insert to authenticated
with check (
  bucket_id = 'site-media'
  and (select private.has_permission('media.upload'))
  and (storage.foldername(name))[1] in ('general', 'testimonials', 'popups', 'seo', 'home')
  and (storage.foldername(name))[2] ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
);
create policy site_media_permission_update on storage.objects for update to authenticated
using (bucket_id = 'site-media' and (select private.has_permission('media.update')))
with check (bucket_id = 'site-media' and (select private.has_permission('media.update')));
create policy site_media_permission_delete on storage.objects for delete to authenticated
using (bucket_id = 'site-media' and (select private.has_permission('media.delete')));

drop policy if exists caravan_categories_public_select on public.caravan_categories;
create policy caravan_categories_public_select on public.caravan_categories for select to anon using (active = true);
create policy caravan_categories_permission_select on public.caravan_categories for select to authenticated
using (active = true or (select private.has_permission('caravans.view')));

drop policy if exists caravans_public_or_staff_select on public.caravans;
create policy caravans_public_select on public.caravans for select to anon using (published = true);
create policy caravans_permission_select on public.caravans for select to authenticated
using (published = true or (select private.has_permission('caravans.view')));

drop policy if exists caravan_departures_public_or_staff_select on public.caravan_departures;
create policy caravan_departures_public_select on public.caravan_departures for select to anon
using (exists (select 1 from public.caravans where caravans.id = caravan_departures.caravan_id and caravans.published = true));
create policy caravan_departures_permission_select on public.caravan_departures for select to authenticated
using ((select private.has_permission('caravans.view')) or exists (select 1 from public.caravans where caravans.id = caravan_departures.caravan_id and caravans.published = true));

drop policy if exists caravan_itinerary_days_public_or_staff_select on public.caravan_itinerary_days;
create policy caravan_itinerary_public_select on public.caravan_itinerary_days for select to anon
using (exists (select 1 from public.caravans where caravans.id = caravan_itinerary_days.caravan_id and caravans.published = true));
create policy caravan_itinerary_permission_select on public.caravan_itinerary_days for select to authenticated
using ((select private.has_permission('caravans.view')) or exists (select 1 from public.caravans where caravans.id = caravan_itinerary_days.caravan_id and caravans.published = true));

drop policy if exists caravan_images_public_or_staff_select on public.caravan_images;
create policy caravan_images_public_select on public.caravan_images for select to anon
using (exists (select 1 from public.caravans where caravans.id = caravan_images.caravan_id and caravans.published = true));
create policy caravan_images_permission_select on public.caravan_images for select to authenticated
using ((select private.has_permission('caravans.view')) or exists (select 1 from public.caravans where caravans.id = caravan_images.caravan_id and caravans.published = true));

drop policy if exists blog_categories_public_or_staff_select on public.blog_categories;
create policy blog_categories_public_select on public.blog_categories for select to anon
using (exists (select 1 from public.blog_posts where blog_posts.category_id = blog_categories.id and blog_posts.published = true));
create policy blog_categories_permission_select on public.blog_categories for select to authenticated
using ((select private.has_permission('blog.view')) or exists (select 1 from public.blog_posts where blog_posts.category_id = blog_categories.id and blog_posts.published = true));

drop policy if exists blog_posts_public_or_staff_select on public.blog_posts;
create policy blog_posts_public_select on public.blog_posts for select to anon using (published = true);
create policy blog_posts_permission_select on public.blog_posts for select to authenticated
using (published = true or (select private.has_permission('blog.view')));

drop policy if exists blog_post_images_public_or_staff_select on public.blog_post_images;
create policy blog_post_images_public_select on public.blog_post_images for select to anon
using (exists (select 1 from public.blog_posts where blog_posts.id = blog_post_images.blog_post_id and blog_posts.published = true));
create policy blog_post_images_permission_select on public.blog_post_images for select to authenticated
using ((select private.has_permission('blog.view')) or exists (select 1 from public.blog_posts where blog_posts.id = blog_post_images.blog_post_id and blog_posts.published = true));

create or replace function private.enforce_sensitive_content_transitions()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  old_row jsonb := to_jsonb(old);
  new_row jsonb := to_jsonb(new);
begin
  if (select auth.uid()) is null then
    return new;
  end if;
  if tg_table_name = 'caravans'
    and (old_row ->> 'published') is distinct from (new_row ->> 'published')
    and not (select private.has_permission('caravans.publish')) then
    raise exception 'Permissão insuficiente para publicar caravanas.';
  elsif tg_table_name = 'blog_posts'
    and (old_row ->> 'published') is distinct from (new_row ->> 'published')
    and not (select private.has_permission('blog.publish')) then
    raise exception 'Permissão insuficiente para publicar posts.';
  elsif tg_table_name = 'popups'
    and (old_row ->> 'active') is distinct from (new_row ->> 'active')
    and not (select private.has_permission('popups.publish')) then
    raise exception 'Permissão insuficiente para publicar pop-ups.';
  elsif tg_table_name = 'testimonials'
    and (old_row ->> 'active') is distinct from (new_row ->> 'active')
    and not (select private.has_permission('testimonials.publish')) then
    raise exception 'Permissão insuficiente para publicar depoimentos.';
  end if;
  return new;
end;
$$;

revoke all on function private.enforce_sensitive_content_transitions() from public, anon, authenticated;
create trigger caravans_enforce_sensitive_transition before update on public.caravans
for each row execute function private.enforce_sensitive_content_transitions();
create trigger blog_posts_enforce_sensitive_transition before update on public.blog_posts
for each row execute function private.enforce_sensitive_content_transitions();
create trigger popups_enforce_sensitive_transition before update on public.popups
for each row execute function private.enforce_sensitive_content_transitions();
create trigger testimonials_enforce_sensitive_transition before update on public.testimonials
for each row execute function private.enforce_sensitive_content_transitions();
