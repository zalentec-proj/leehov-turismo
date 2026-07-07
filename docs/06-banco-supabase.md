# Banco de Dados Supabase

## Objetivo

Definir o modelo inicial de banco para o projeto Leehov Turismo.

O banco será PostgreSQL via Supabase, com Row Level Security habilitado nas tabelas sensíveis.

## Tabelas principais

1. `profiles`
2. `caravans`
3. `caravan_departures`
4. `caravan_itinerary_days`
5. `caravan_images`
6. `caravan_categories`
7. `blog_posts`
8. `blog_categories`
9. `leads`
10. `newsletter_subscribers`
11. `testimonials`
12. `google_reviews_cache`
13. `popups`
14. `site_settings`
15. `media_assets`

## `profiles`

Usuários administrativos.

Campos:

1. `id uuid primary key`
2. `name text`
3. `email text`
4. `role text default 'editor'`
5. `created_at timestamp`
6. `updated_at timestamp`

Roles:

1. `admin`
2. `editor`

## `caravans`

Cadastro principal das caravanas.

Campos:

1. `id uuid primary key`
2. `title text`
3. `slug text unique`
4. `destination text`
5. `category_id uuid`
6. `type text`
7. `summary text`
8. `description text`
9. `duration text`
10. `price text`
11. `currency text default 'BRL'`
12. `status text`
13. `card_image_url text`
14. `hero_image_url text`
15. `video_url text`
16. `video_thumbnail_url text`
17. `is_group_trip boolean default true`
18. `is_accompanied boolean default true`
19. `has_portuguese_guide boolean default false`
20. `has_leehov_representative boolean default false`
21. `has_travel_kit boolean default false`
22. `has_travel_insurance boolean default false`
23. `min_people integer`
24. `max_people integer`
25. `leader_name text`
26. `leader_bio text`
27. `leader_image_url text`
28. `included jsonb default '[]'`
29. `not_included jsonb default '[]'`
30. `notes text`
31. `featured_home boolean default false`
32. `featured_hero boolean default false`
33. `hero_title text`
34. `hero_description text`
35. `hero_cta_text text`
36. `hero_cta_url text`
37. `hero_order integer default 0`
38. `published boolean default false`
39. `seo_title text`
40. `seo_description text`
41. `created_at timestamp`
42. `updated_at timestamp`

## `caravan_departures`

Saídas/datas das caravanas.

Campos:

1. `id uuid primary key`
2. `caravan_id uuid references caravans(id)`
3. `label text`
4. `start_date date`
5. `end_date date`
6. `available_spots integer`
7. `status text`
8. `notes text`
9. `created_at timestamp`
10. `updated_at timestamp`

## `caravan_itinerary_days`

Roteiro dia a dia.

Campos:

1. `id uuid primary key`
2. `caravan_id uuid references caravans(id)`
3. `day_number integer`
4. `title text`
5. `location text`
6. `description text`
7. `image_url text`
8. `meals jsonb default '[]'`
9. `accommodation text`
10. `notes text`
11. `order_index integer`
12. `created_at timestamp`
13. `updated_at timestamp`

## `caravan_images`

Galeria das caravanas.

Campos:

1. `id uuid primary key`
2. `caravan_id uuid references caravans(id)`
3. `image_url text`
4. `alt_text text`
5. `caption text`
6. `order_index integer`
7. `created_at timestamp`

## `caravan_categories`

Categorias das caravanas.

Campos:

1. `id uuid primary key`
2. `name text`
3. `slug text unique`
4. `description text`
5. `created_at timestamp`
6. `updated_at timestamp`

Categorias iniciais sugeridas:

1. Religioso.
2. Turístico.
3. Cultural.
4. Internacional.
5. Nacional.

## `blog_posts`

Posts do blog.

Campos:

1. `id uuid primary key`
2. `title text`
3. `slug text unique`
4. `summary text`
5. `content text`
6. `cover_image_url text`
7. `category_id uuid`
8. `related_caravan_id uuid`
9. `related_destination text`
10. `author text`
11. `reading_time integer`
12. `featured_home boolean default false`
13. `featured_blog boolean default false`
14. `published boolean default false`
15. `published_at timestamp`
16. `seo_title text`
17. `seo_description text`
18. `created_at timestamp`
19. `updated_at timestamp`

## `blog_categories`

Campos:

1. `id uuid primary key`
2. `name text`
3. `slug text unique`
4. `description text`
5. `created_at timestamp`

## `leads`

Leads captados pelos formulários.

Campos:

1. `id uuid primary key`
2. `name text`
3. `email text`
4. `phone text`
5. `city text`
6. `state text`
7. `message text`
8. `source text`
9. `caravan_id uuid`
10. `status text default 'new'`
11. `created_at timestamp`
12. `updated_at timestamp`

Status:

1. `new`
2. `in_progress`
3. `converted`
4. `archived`

## `newsletter_subscribers`

Campos:

1. `id uuid primary key`
2. `name text`
3. `email text unique`
4. `source text`
5. `active boolean default true`
6. `created_at timestamp`

## `testimonials`

Depoimentos manuais.

Campos:

1. `id uuid primary key`
2. `name text`
3. `role text`
4. `city text`
5. `text text`
6. `rating integer`
7. `image_url text`
8. `source text default 'manual'`
9. `active boolean default true`
10. `featured boolean default false`
11. `order_index integer default 0`
12. `created_at timestamp`
13. `updated_at timestamp`

## `google_reviews_cache`

Cache de avaliações do Google.

Campos:

1. `id uuid primary key`
2. `google_review_id text`
3. `author_name text`
4. `author_photo_url text`
5. `author_url text`
6. `rating integer`
7. `text text`
8. `relative_time_description text`
9. `review_time timestamp`
10. `language text`
11. `active boolean default true`
12. `featured boolean default false`
13. `raw_data jsonb`
14. `fetched_at timestamp`

## `popups`

Campos:

1. `id uuid primary key`
2. `title text`
3. `description text`
4. `image_url text`
5. `button_text text`
6. `button_url text`
7. `type text`
8. `display_location text`
9. `frequency text`
10. `active boolean default false`
11. `created_at timestamp`
12. `updated_at timestamp`

## `site_settings`

Configurações gerais.

Campos:

1. `id uuid primary key`
2. `key text unique`
3. `value jsonb`
4. `updated_at timestamp`

Chaves sugeridas:

1. `contact_info`
2. `social_links`
3. `home_video`
4. `home_hero_settings`
5. `seo_global`
6. `analytics_scripts`
7. `google_reviews_settings`
8. `whatsapp_settings`

## `media_assets`

Biblioteca de mídia.

Campos:

1. `id uuid primary key`
2. `file_url text`
3. `file_name text`
4. `file_type text`
5. `alt_text text`
6. `caption text`
7. `folder text`
8. `created_by uuid`
9. `created_at timestamp`

## Segurança/RLS

Regras gerais:

1. Visitantes podem ler apenas caravanas publicadas.
2. Visitantes podem ler apenas posts publicados.
3. Visitantes podem criar leads.
4. Visitantes podem criar inscrições de newsletter.
5. Visitantes não podem ler leads.
6. Visitantes não podem ler lista da newsletter.
7. Apenas usuários autenticados podem acessar admin.
8. Apenas admin/editor pode criar, editar e excluir conteúdos.
9. Uploads devem ser permitidos apenas a usuários autenticados.
10. Configurações sensíveis devem ser lidas apenas pelo servidor/admin.

## Buckets de storage

1. `caravans`
2. `blog`
3. `testimonials`
4. `popups`
5. `site`
6. `media`

Leitura pública apenas quando necessário para imagens públicas. Upload restrito a usuários autenticados.
