create table public.blog_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint blog_categories_name_not_blank check (char_length(btrim(name)) between 2 and 80),
  constraint blog_categories_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint blog_categories_slug_key unique (slug)
);

create table public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null,
  summary text,
  content text,
  cover_image_url text,
  cover_alt_text text,
  category_id uuid references public.blog_categories(id) on delete set null,
  related_caravan_id uuid references public.caravans(id) on delete set null,
  related_destination text,
  author text,
  reading_time integer,
  featured_home boolean not null default false,
  featured_blog boolean not null default false,
  published boolean not null default false,
  published_at timestamptz,
  seo_title text,
  seo_description text,
  source_url text,
  created_by uuid references public.profiles(id) on delete set null,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint blog_posts_title_not_blank check (char_length(btrim(title)) between 3 and 160),
  constraint blog_posts_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint blog_posts_slug_key unique (slug),
  constraint blog_posts_source_url_key unique (source_url),
  constraint blog_posts_reading_time_positive check (reading_time is null or reading_time > 0),
  constraint blog_posts_featured_requires_published check (
    published or (featured_home = false and featured_blog = false)
  ),
  constraint blog_posts_publication_fields check (
    published = false
    or (
      char_length(btrim(coalesce(summary, ''))) >= 30
      and char_length(btrim(coalesce(content, ''))) >= 50
      and char_length(btrim(coalesce(cover_image_url, ''))) > 0
      and char_length(btrim(coalesce(cover_alt_text, ''))) > 0
      and category_id is not null
      and char_length(btrim(coalesce(author, ''))) >= 2
      and reading_time is not null
      and published_at is not null
    )
  )
);

create table public.blog_post_images (
  id uuid primary key default gen_random_uuid(),
  blog_post_id uuid not null references public.blog_posts(id) on delete cascade,
  image_url text not null,
  alt_text text,
  caption text,
  order_index integer not null default 0,
  created_at timestamptz not null default now(),
  constraint blog_post_images_path_not_blank check (char_length(btrim(image_url)) > 0),
  constraint blog_post_images_order_nonnegative check (order_index >= 0),
  constraint blog_post_images_post_path_key unique (blog_post_id, image_url)
);

create index blog_posts_published_at_idx
  on public.blog_posts (published_at desc)
  where published = true;
create index blog_posts_featured_home_idx
  on public.blog_posts (published_at desc)
  where published = true and featured_home = true;
create index blog_posts_featured_blog_idx
  on public.blog_posts (published_at desc)
  where published = true and featured_blog = true;
create index blog_posts_category_id_idx on public.blog_posts (category_id);
create index blog_posts_related_caravan_id_idx on public.blog_posts (related_caravan_id);
create index blog_posts_created_by_idx on public.blog_posts (created_by);
create index blog_posts_updated_by_idx on public.blog_posts (updated_by);
create index blog_post_images_post_order_idx
  on public.blog_post_images (blog_post_id, order_index);

create trigger blog_categories_set_updated_at
before update on public.blog_categories
for each row execute function private.set_updated_at();

create trigger blog_posts_set_updated_at
before update on public.blog_posts
for each row execute function private.set_updated_at();
