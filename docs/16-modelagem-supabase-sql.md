# Modelagem Supabase SQL

Este documento define a modelagem técnica prevista para o Supabase PostgreSQL do projeto Leehov Turismo.

O objetivo é orientar a criação futura das migrations, sem aplicar SQL nesta etapa.

## Princípios

1. Usar Supabase PostgreSQL como fonte de dados do site público e do painel administrativo.
2. Habilitar Row Level Security em todas as tabelas do schema público.
3. Visitantes só leem conteúdos publicados ou ativos.
4. Visitantes podem criar leads, contatos e inscrições de newsletter.
5. Apenas usuários autenticados com papel `admin` ou `editor` acessam dados internos.
6. Uploads em Storage ficam restritos a usuários autenticados.
7. Dados sensíveis, API keys e secrets não devem ficar em tabelas públicas editáveis pelo client.
8. Analytics, Google Tag Manager e Meta Pixel devem ser configurados no admin e salvos no Supabase.
9. API keys e secrets devem ficar em `.env` ou ambiente seguro.
10. Google Business Profile deve usar OAuth 2.0.
11. Resend deve usar `RESEND_API_KEY`.
12. Webhooks devem ter logs e envio server-side.

## Extensões

Extensões sugeridas:

1. `pgcrypto`, para `gen_random_uuid()`.
2. `citext`, para e-mails com comparação case-insensitive.

## Enums

Enums sugeridos:

```sql
app_role = 'admin' | 'editor'
content_status = 'draft' | 'published' | 'archived'
caravan_status = 'available' | 'coming_soon' | 'waitlist' | 'sold_out' | 'draft'
departure_status = 'available' | 'coming_soon' | 'waitlist' | 'sold_out'
lead_status = 'new' | 'in_progress' | 'converted' | 'archived'
newsletter_status = 'pending' | 'active' | 'unsubscribed'
email_status = 'pending' | 'sent' | 'failed' | 'skipped'
webhook_delivery_status = 'pending' | 'sent' | 'failed' | 'retrying'
popup_type = 'campaign' | 'newsletter' | 'whatsapp' | 'caravan'
review_display_mode = 'manual' | 'google' | 'mixed'
```

Se a equipe preferir flexibilidade no primeiro ciclo, esses valores podem ser `text` com `check constraint`.

## Usuários e admins

### `profiles`

Perfis administrativos vinculados ao Supabase Auth.

Campos:

1. `id uuid primary key references auth.users(id) on delete cascade`
2. `name text`
3. `email citext unique not null`
4. `role app_role not null default 'editor'`
5. `active boolean not null default true`
6. `created_at timestamptz not null default now()`
7. `updated_at timestamptz not null default now()`

Índices:

1. `profiles_email_idx` em `email`.
2. `profiles_role_idx` em `role`.

RLS:

1. Usuário autenticado pode ler o próprio perfil.
2. Admin pode ler e gerenciar todos os perfis.
3. Editor não gerencia usuários.

Segurança:

1. Não usar `user_metadata` para autorização.
2. Regras de autorização devem consultar `profiles.role` ou `app_metadata` controlado pelo servidor.

## Caravanas

### `caravan_categories`

Categorias editoriais das caravanas.

Campos:

1. `id uuid primary key default gen_random_uuid()`
2. `name text not null`
3. `slug text unique not null`
4. `description text`
5. `created_at timestamptz not null default now()`
6. `updated_at timestamptz not null default now()`

Dados iniciais:

1. Religioso.
2. Turístico.
3. Cultural.
4. Internacional.
5. Nacional.

### `caravans`

Cadastro principal das caravanas.

Campos:

1. `id uuid primary key default gen_random_uuid()`
2. `title text not null`
3. `slug text unique not null`
4. `destination text not null`
5. `category_id uuid references caravan_categories(id) on delete set null`
6. `type text`
7. `summary text`
8. `description text`
9. `duration text`
10. `price text`
11. `currency text not null default 'BRL'`
12. `status caravan_status not null default 'draft'`
13. `card_image_url text`
14. `hero_image_url text`
15. `video_url text`
16. `video_thumbnail_url text`
17. `is_group_trip boolean not null default true`
18. `is_accompanied boolean not null default true`
19. `has_portuguese_guide boolean not null default false`
20. `has_leehov_representative boolean not null default false`
21. `has_travel_kit boolean not null default false`
22. `has_travel_insurance boolean not null default false`
23. `min_people integer`
24. `max_people integer`
25. `leader_name text`
26. `leader_bio text`
27. `leader_image_url text`
28. `included jsonb not null default '[]'`
29. `not_included jsonb not null default '[]'`
30. `notes text`
31. `featured_home boolean not null default false`
32. `featured_hero boolean not null default false`
33. `hero_title text`
34. `hero_description text`
35. `hero_cta_text text`
36. `hero_cta_url text`
37. `hero_order integer not null default 0`
38. `published boolean not null default false`
39. `published_at timestamptz`
40. `seo_title text`
41. `seo_description text`
42. `created_by uuid references profiles(id) on delete set null`
43. `updated_by uuid references profiles(id) on delete set null`
44. `created_at timestamptz not null default now()`
45. `updated_at timestamptz not null default now()`

Índices:

1. `caravans_slug_idx` unique em `slug`.
2. `caravans_published_idx` em `published`.
3. `caravans_status_idx` em `status`.
4. `caravans_featured_hero_idx` em `featured_hero, hero_order`.
5. `caravans_featured_home_idx` em `featured_home`.
6. `caravans_category_id_idx` em `category_id`.

RLS:

1. Visitantes leem apenas `published = true`.
2. Admin/editor autenticado lê, cria, edita e exclui.

### `caravan_departures`

Saídas ou períodos de uma caravana.

Campos:

1. `id uuid primary key default gen_random_uuid()`
2. `caravan_id uuid not null references caravans(id) on delete cascade`
3. `label text`
4. `start_date date`
5. `end_date date`
6. `available_spots integer`
7. `status departure_status not null default 'available'`
8. `notes text`
9. `order_index integer not null default 0`
10. `created_at timestamptz not null default now()`
11. `updated_at timestamptz not null default now()`

Índices:

1. `caravan_departures_caravan_id_idx`.
2. `caravan_departures_start_date_idx`.

RLS:

1. Visitantes leem saídas de caravanas publicadas.
2. Admin/editor gerencia todas.

### `caravan_itinerary_days`

Roteiro dia a dia.

Campos:

1. `id uuid primary key default gen_random_uuid()`
2. `caravan_id uuid not null references caravans(id) on delete cascade`
3. `day_number integer not null`
4. `title text not null`
5. `location text`
6. `description text`
7. `image_url text`
8. `meals jsonb not null default '[]'`
9. `accommodation text`
10. `notes text`
11. `order_index integer not null default 0`
12. `created_at timestamptz not null default now()`
13. `updated_at timestamptz not null default now()`

Índices:

1. `caravan_itinerary_days_caravan_order_idx` em `caravan_id, order_index`.

### `caravan_images`

Galeria de imagens.

Campos:

1. `id uuid primary key default gen_random_uuid()`
2. `caravan_id uuid not null references caravans(id) on delete cascade`
3. `image_url text not null`
4. `alt_text text`
5. `caption text`
6. `order_index integer not null default 0`
7. `created_at timestamptz not null default now()`

Índices:

1. `caravan_images_caravan_order_idx` em `caravan_id, order_index`.

## Blog

### `blog_categories`

Campos:

1. `id uuid primary key default gen_random_uuid()`
2. `name text not null`
3. `slug text unique not null`
4. `description text`
5. `created_at timestamptz not null default now()`
6. `updated_at timestamptz not null default now()`

### `blog_posts`

Campos:

1. `id uuid primary key default gen_random_uuid()`
2. `title text not null`
3. `slug text unique not null`
4. `summary text`
5. `content text`
6. `cover_image_url text`
7. `category_id uuid references blog_categories(id) on delete set null`
8. `related_caravan_id uuid references caravans(id) on delete set null`
9. `related_destination text`
10. `author text`
11. `reading_time integer`
12. `featured_home boolean not null default false`
13. `featured_blog boolean not null default false`
14. `published boolean not null default false`
15. `published_at timestamptz`
16. `seo_title text`
17. `seo_description text`
18. `created_by uuid references profiles(id) on delete set null`
19. `updated_by uuid references profiles(id) on delete set null`
20. `created_at timestamptz not null default now()`
21. `updated_at timestamptz not null default now()`

Índices:

1. `blog_posts_slug_idx` unique em `slug`.
2. `blog_posts_published_idx`.
3. `blog_posts_featured_blog_idx`.
4. `blog_posts_category_id_idx`.
5. `blog_posts_related_caravan_id_idx`.

RLS:

1. Visitantes leem apenas posts publicados.
2. Admin/editor gerencia todos.

## Leads e contato

### `leads`

Leads de contato, interesse em caravana e origem de pop-ups.

Campos:

1. `id uuid primary key default gen_random_uuid()`
2. `name text not null`
3. `email citext`
4. `phone text`
5. `city text`
6. `state text`
7. `message text`
8. `source text not null`
9. `caravan_id uuid references caravans(id) on delete set null`
10. `status lead_status not null default 'new'`
11. `metadata jsonb not null default '{}'`
12. `created_at timestamptz not null default now()`
13. `updated_at timestamptz not null default now()`

Índices:

1. `leads_created_at_idx`.
2. `leads_status_idx`.
3. `leads_caravan_id_idx`.
4. `leads_source_idx`.

RLS:

1. Visitantes podem inserir.
2. Visitantes não podem listar, ler, editar ou excluir.
3. Admin/editor lê e gerencia.

## Newsletter

### `newsletter_subscribers`

Campos:

1. `id uuid primary key default gen_random_uuid()`
2. `name text`
3. `email citext unique not null`
4. `source text`
5. `status newsletter_status not null default 'pending'`
6. `active boolean not null default false`
7. `confirmation_token_hash text`
8. `confirmed_at timestamptz`
9. `unsubscribed_at timestamptz`
10. `created_at timestamptz not null default now()`
11. `updated_at timestamptz not null default now()`

Índices:

1. `newsletter_subscribers_email_idx` unique.
2. `newsletter_subscribers_status_idx`.

RLS:

1. Visitantes podem inserir.
2. Confirmação deve acontecer via rota server-side.
3. Admin/editor lê e gerencia.

## Depoimentos e Google Reviews

### `testimonials`

Depoimentos manuais.

Campos:

1. `id uuid primary key default gen_random_uuid()`
2. `name text not null`
3. `role text`
4. `city text`
5. `text text not null`
6. `rating integer`
7. `image_url text`
8. `source text not null default 'manual'`
9. `active boolean not null default true`
10. `featured boolean not null default false`
11. `order_index integer not null default 0`
12. `created_at timestamptz not null default now()`
13. `updated_at timestamptz not null default now()`

RLS:

1. Visitantes leem apenas `active = true`.
2. Admin/editor gerencia todos.

### `google_business_settings`

Campos:

1. `id uuid primary key default gen_random_uuid()`
2. `account_id text`
3. `location_id text`
4. `enabled boolean not null default false`
5. `display_mode review_display_mode not null default 'mixed'`
6. `reviews_limit integer not null default 6`
7. `min_rating integer not null default 4`
8. `cache_hours integer not null default 24`
9. `last_sync_at timestamptz`
10. `last_sync_status text`
11. `last_sync_error text`
12. `created_at timestamptz not null default now()`
13. `updated_at timestamptz not null default now()`

Segurança:

1. OAuth client secret e refresh token ficam em `.env` ou secret store.
2. Account ID e Location ID podem ficar no admin/Supabase.

### `google_reviews_cache`

Campos:

1. `id uuid primary key default gen_random_uuid()`
2. `google_review_id text unique not null`
3. `review_name text`
4. `reviewer_display_name text`
5. `reviewer_profile_photo_url text`
6. `reviewer_profile_url text`
7. `star_rating integer`
8. `comment text`
9. `create_time timestamptz`
10. `update_time timestamptz`
11. `reply_comment text`
12. `reply_update_time timestamptz`
13. `visible boolean not null default true`
14. `featured boolean not null default false`
15. `raw_data jsonb`
16. `synced_at timestamptz`
17. `created_at timestamptz not null default now()`
18. `updated_at timestamptz not null default now()`

Índices:

1. `google_reviews_cache_review_id_idx` unique.
2. `google_reviews_cache_visible_featured_idx`.
3. `google_reviews_cache_star_rating_idx`.

RLS:

1. Visitantes leem apenas `visible = true`.
2. Admin/editor lê, oculta, destaca e atualiza cache.
3. Responder/remover resposta no Google deve acontecer apenas no servidor.

## Pop-ups

### `popups`

Campos:

1. `id uuid primary key default gen_random_uuid()`
2. `title text not null`
3. `description text`
4. `image_url text`
5. `button_text text`
6. `button_url text`
7. `type popup_type`
8. `display_location text`
9. `frequency text`
10. `active boolean not null default false`
11. `created_at timestamptz not null default now()`
12. `updated_at timestamptz not null default now()`

RLS:

1. Visitantes leem pop-ups ativos.
2. Admin/editor gerencia todos.

Regra:

1. No MVP, apenas um pop-up principal ativo deve ser exibido por vez.

## Configurações do site

### `site_settings`

Campos:

1. `id uuid primary key default gen_random_uuid()`
2. `key text unique not null`
3. `value jsonb not null default '{}'`
4. `public_read boolean not null default false`
5. `updated_at timestamptz not null default now()`

Chaves sugeridas:

1. `contact_info`
2. `social_links`
3. `home_video`
4. `home_hero_settings`
5. `seo_global`
6. `analytics_scripts`
7. `google_tag_manager`
8. `meta_pixel`
9. `google_reviews_settings`
10. `whatsapp_settings`
11. `email_settings`

RLS:

1. Visitantes leem apenas configurações com `public_read = true`.
2. Configurações sensíveis devem ser lidas apenas pelo servidor/admin.
3. Scripts de Analytics/GTM/Pixel são configuráveis no admin, mas devem ser renderizados com sanitização e controle server-side.

## E-mails

### `email_logs`

Registra tentativas e resultados de envio pelo Resend.

Campos:

1. `id uuid primary key default gen_random_uuid()`
2. `template_key text not null`
3. `recipient_email citext`
4. `subject text`
5. `provider text not null default 'resend'`
6. `provider_message_id text`
7. `status email_status not null default 'pending'`
8. `error_message text`
9. `related_entity_type text`
10. `related_entity_id uuid`
11. `metadata jsonb not null default '{}'`
12. `created_at timestamptz not null default now()`
13. `sent_at timestamptz`

Índices:

1. `email_logs_status_idx`.
2. `email_logs_related_entity_idx` em `related_entity_type, related_entity_id`.
3. `email_logs_created_at_idx`.

RLS:

1. Visitantes não leem logs.
2. Admin/editor pode visualizar logs.
3. Inserções devem acontecer no servidor.

## Webhooks

### `webhooks`

Campos:

1. `id uuid primary key default gen_random_uuid()`
2. `name text not null`
3. `url text not null`
4. `event text not null`
5. `validation_key text`
6. `description text`
7. `active boolean not null default true`
8. `created_by uuid references profiles(id) on delete set null`
9. `created_at timestamptz not null default now()`
10. `updated_at timestamptz not null default now()`

Índices:

1. `webhooks_event_active_idx` em `event, active`.

Segurança:

1. `validation_key` não deve ser exposta no front-end.
2. Envio deve acontecer no servidor.

### `webhook_logs`

Campos:

1. `id uuid primary key default gen_random_uuid()`
2. `webhook_id uuid references webhooks(id) on delete set null`
3. `event text not null`
4. `delivery_id text unique`
5. `payload jsonb not null default '{}'`
6. `status webhook_delivery_status not null default 'pending'`
7. `response_status integer`
8. `response_body text`
9. `error_message text`
10. `attempts integer not null default 0`
11. `created_at timestamptz not null default now()`
12. `sent_at timestamptz`

Índices:

1. `webhook_logs_webhook_id_idx`.
2. `webhook_logs_status_idx`.
3. `webhook_logs_delivery_id_idx` unique.

RLS:

1. Visitantes não acessam webhooks nem logs.
2. Admin/editor gerencia configurações e visualiza logs.

Regra:

1. Falha no webhook não bloqueia a ação principal.

## Mídia e Storage

### `media_assets`

Campos:

1. `id uuid primary key default gen_random_uuid()`
2. `file_url text not null`
3. `file_name text not null`
4. `file_type text`
5. `file_size integer`
6. `alt_text text`
7. `caption text`
8. `folder text`
9. `created_by uuid references profiles(id) on delete set null`
10. `created_at timestamptz not null default now()`

Buckets:

1. `caravans`
2. `blog`
3. `testimonials`
4. `popups`
5. `site`
6. `media`

Storage RLS:

1. Leitura pública apenas para imagens usadas publicamente.
2. Upload restrito a usuários autenticados.
3. Upsert deve exigir permissões de insert, select e update.

## Dados iniciais

Seeds recomendados:

1. Categorias de caravana.
2. Categorias iniciais do blog.
3. Configurações vazias de contato, redes sociais, WhatsApp, SEO global, e-mails, Analytics/GTM/Pixel e Google Reviews.
4. Primeiro usuário admin deve ser criado via fluxo controlado após Auth estar configurado.

## Observações de segurança

1. Nunca expor `SUPABASE_SECRET_KEY`, `RESEND_API_KEY`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REFRESH_TOKEN` ou `TURNSTILE_SECRET_KEY` no client.
2. Usar publishable key no client e secret key apenas no servidor.
3. Views públicas, se criadas, devem usar `security_invoker = true` quando aplicável.
4. Funções `security definer`, se necessárias, devem ficar fora de schema exposto.
5. Toda mutation sensível deve passar por Server Action ou Route Handler.
6. Turnstile deve ser validado no servidor antes de criar leads, contatos ou inscrições.
